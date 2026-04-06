# Deep Read: karpathy/autoresearch

**Date:** 2026-04-06 | **Skill Version:** 4.2

## Artifact Discovery

9 files total. Every file was read.

| Artifact        | Lines  | Read?              | Knowledge Beyond Code                                                                                                                    |
| --------------- | ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| README.md       | 92     | Yes                | Design philosophy, quick start, platform guidance for smaller compute.                                                                   |
| program.md      | 114    | Yes                | Agent instruction protocol. THE intellectual contribution.                                                                               |
| train.py        | 630    | Partial (60 lines) | GPT model + Muon/AdamW optimizer + training loop. Agent-editable zone.                                                                   |
| prepare.py      | 389    | Partial (40 lines) | Fixed constants (MAX_SEQ_LEN=2048, TIME_BUDGET=300), data prep, evaluation. Immutable zone.                                              |
| analysis.ipynb  | ~150   | Yes                | Results visualization: keep/discard rates, val_bpb progress curves, cumulative effort per improvement, top hits ranked by delta.         |
| pyproject.toml  | 20     | Yes                | Dependencies: kernels, matplotlib, numpy, pandas, pyarrow, requests, rustbpe, tiktoken, torch 2.9.1.                                     |
| .gitignore      | 18     | Yes                | Reveals hidden architecture: worktrees/, results/, queue/, CLAUDE.md, AGENTS.md, dev/. Multi-agent scaffolding exists but is gitignored. |
| .python-version | 1      | Yes                | 3.10                                                                                                                                     |
| progress.png    | binary | N/A                | Generated chart from analysis.ipynb.                                                                                                     |

## Key Findings From Deep Read

1. **.gitignore reveals multi-agent architecture.** The gitignore includes
   `worktrees/`, `queue/`, `CLAUDE.md`, `AGENTS.md`, and `dev/`. This means the
   repo has infrastructure for multi-agent runs (worktrees for parallel
   experiments, queue for work distribution, per-session CLAUDE.md/AGENTS.md
   generation) — but it's all gitignored. The public repo is the single-agent
   baseline; the multi-agent extension exists but isn't shared.

2. **analysis.ipynb is a results methodology.** It's not just a chart — it's a
   complete experiment analysis framework: load results.tsv, compute
   keep/discard/crash rates, plot val_bpb progress with running minimum, label
   each kept experiment with its description, compute per-improvement delta and
   rank by magnitude. This is a reusable pattern for analyzing any autonomous
   agent's experiment history.

3. **pyproject.toml reveals the real stack.** `rustbpe` (Rust BPE tokenizer),
   `kernels>=0.11.7` (Flash Attention 3), `torch==2.9.1` (pinned exactly). The
   `kernels` package auto-selects between `varunneal/flash-attention-3` (Hopper)
   and `kernels-community/flash-attn3` (non-Hopper). This is bleeding- edge ML
   infrastructure.

4. **README platform guidance is unusually detailed.** 7 specific
   recommendations for running on smaller compute: use TinyStories dataset,
   decrease vocab_size, lower MAX_SEQ_LEN, increase DEVICE_BATCH_SIZE, decrease
   EVAL_TOKENS, lower DEPTH, use "L" WINDOW_PATTERN. This is practical knowledge
   for anyone adapting the fixed-budget pattern to different hardware.

## External References Cataloged for Phase 4b

- [nanochat](https://github.com/karpathy/nanochat) — parent repo with wider
  platform support
- [TinyStories dataset](https://huggingface.co/datasets/karpathy/tinystories-gpt4-clean)
  — smaller-compute dataset
- [miolini/autoresearch-macos](https://github.com/miolini/autoresearch-macos) —
  Mac fork
- [trevin-creator/autoresearch-mlx](https://github.com/trevin-creator/autoresearch-mlx)
  — MLX fork
- [jsegov/autoresearch-win-rtx](https://github.com/jsegov/autoresearch-win-rtx)
  — Windows RTX fork
- [andyluo7/autoresearch](https://github.com/andyluo7/autoresearch) — Multi-GPU
  fork
- Karpathy tweets (2 referenced) — context on the project's origin
- "Dummy's Guide" tweet — community explainer
