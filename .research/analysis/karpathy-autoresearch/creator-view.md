# Creator View: karpathy/autoresearch

**Analyzed:** 2026-04-06 | **Skill Version:** 4.1 | **Depth:** Standard

---

## 1. What This Repo Understands (+ Blindspots)

This repo understands something that most AI tooling projects overcomplicate:
the optimal agent workflow is a tight loop with one file, one metric, and no
permission gates. Everything else is noise.

The 3-file architecture is the insight. `prepare.py` is immutable
infrastructure. `train.py` is the agent-editable surface. `program.md` is the
instruction set. There's no config system, no CLI flags, no abstraction layers.
The agent doesn't need to understand a framework — it reads one Python file,
modifies it, runs it, and checks one number. That's it.

The `program.md` is remarkable in its clarity. The "NEVER STOP" directive, the
keep/discard binary, the crash recovery protocol, the results TSV logging —
these 114 lines define an autonomous research organization. The fixed 5-minute
time budget is the smartest constraint: it makes every experiment directly
comparable regardless of what the agent changes, and it means you get ~100
experiments per overnight run.

The simplicity criterion is the most underrated idea in the repo: "A 0.001
val_bpb improvement that adds 20 lines of hacky code? Probably not worth it. A
0.001 val_bpb improvement from deleting code? Definitely keep." This is Karpathy
encoding his research taste into an agent instruction. It's not just "optimize
the metric" — it's "optimize the metric while keeping the code clean."

**Blindspots:** The repo is single-agent, single-GPU, single-metric. There's no
multi-agent coordination, no multi-objective optimization, no human-in-the-loop
checkpoints (by design — "NEVER STOP"). This means the methodology doesn't
transfer directly to workflows where you need consensus, multiple evaluation
criteria, or human judgment gates. Your skills have all three.

No license means the 9,611 forks are in legal gray zone. The 173 open issues are
mostly community ports (Mac, AMD, smaller GPUs) that Karpathy is intentionally
not absorbing — he wants forks, not PRs.

---

## 2. What's Relevant To Your Work

Content evaluation of 9 files, 1 notebook, and 6 external references surfaced
specific applicable artifacts.

**analysis.ipynb — experiment results methodology.** Not just a chart. It's a
complete framework: load results.tsv, compute keep/discard/crash rates, plot
val_bpb progress with running minimum, label each kept experiment, rank
improvements by delta magnitude. This pattern is directly applicable to your
agent performance tracking — `review-metrics.jsonl` and `learning-routes.jsonl`
could use similar progress visualization. Imagine: "plot learning effectiveness
over 10 PRs with running best and per-review delta."

**.gitignore reveals hidden multi-agent architecture.** The gitignored
`worktrees/`, `queue/`, `CLAUDE.md`, `AGENTS.md` directories tell us the repo
has infrastructure for parallel experiments (worktrees), work distribution
(queue), and per-session agent configuration (generated CLAUDE.md/AGENTS.md).
The public repo is the single-agent baseline; the multi-agent extension exists
but isn't shared. This is the most interesting unexplored aspect — and it
mirrors your own worktree usage for parallel work.

**program.md vs SKILL.md.** The most direct comparison in all 6 repos.
program.md is a _research protocol_ (one agent, one file, infinite loop). Your
SKILL.md is a _workflow definition_ (multi-agent, multi-phase, convergence
loops, routing menus). The program.md approach works when the task is narrowly
scoped and the metric is unambiguous. Your approach works when the task requires
judgment and coordination. Neither is universally better — they're different
tools for different constraint spaces.

**The 3-file architecture pattern.** `prepare.py` (immutable) + `train.py`
(agent-editable) + `program.md` (instructions). The Mac fork
(miolini/autoresearch-macos) validates this: forking only required modifying
train.py. The architecture enables clean platform adaptation. Maps to JASON-OS:
infrastructure (don't touch) + workspace (agent edits) + instructions (human
edits).

**Fixed-budget experimentation.** TIME_BUDGET=300 in prepare.py. ~12
experiments/hour, ~100 overnight. Apply to skill-audit runs, deep-research
searcher agents, or any time-bounded agent work where comparability matters.

**Crash recovery protocol.** "Read stack trace, attempt fix, revert if
unfixable." Simpler than checkpoint+resume for low-cost tasks where reverting is
cheaper than recovering.

---

## 3. Where Your Approach Differs

**Ahead: Multi-agent orchestration.** You run 39 agents in a deep-research, 4
dimension agents in a repo-analysis, teams of agents for audits. Autoresearch is
one agent in one loop. Your orchestration is vastly more sophisticated.

**Ahead: Quality infrastructure.** You have 72 skills, pattern compliance,
pre-commit hooks, TDMS, code review automation. Autoresearch has zero quality
infrastructure — intentionally. The simplicity is the quality.

**Different: Autonomy model.** Autoresearch trusts the agent completely within
the loop ("NEVER STOP"). You trust the agent within phases but gate between
them. Both are valid — the right model depends on the cost of mistakes.

**Behind: Simplicity discipline.** The simplicity criterion ("removing something
and getting equal or better results is a great outcome") is something your
codebase could benefit from. 72 skills, 38 agents, 8,490 tech debt items —
autoresearch would ask "could you do 80% of this with 20% of the complexity?"
That's an uncomfortable question, and it's the right one.

---

## 4. The Challenge

The simplicity criterion should haunt you.

Your system works. It's sophisticated, well-documented, quality-gated. But
autoresearch achieved 67K stars with 3 files and 1,200 lines. Your repo has 831+
files. The question isn't "is my system too complex?" — it might not be. The
question is: **for each piece of complexity, can you articulate what it buys you
that a simpler approach wouldn't?**

The skill-audit scores 78-90%. The convergence loop has dual-form. The TDMS has
8,490 items. For each: what's the counterfactual? What happens if you delete it?
Autoresearch's answer would be: if deleting it doesn't make things worse, it
shouldn't exist.

This isn't an argument for deleting your infrastructure. It's an argument for
applying the simplicity criterion to every new thing you add. Before adding
skill #73, ask: "could I accomplish this by modifying an existing skill?"

---

## 5. Knowledge Candidates

| Tier | Candidate                                             | Novelty | Effort | Notes                                                                                                            |
| ---- | ----------------------------------------------------- | ------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| T1   | program.md as agent instruction pattern               | High    | E0     | Compare against SKILL.md. When is a protocol better than a workflow?                                             |
| T1   | Fixed-budget experimentation                          | High    | E0     | Apply to skill-audit, deep-research, any time-bounded agent work.                                                |
| T1   | Simplicity criterion                                  | High    | E0     | "Removing something and getting equal or better results is a great outcome." Apply to JASON-OS growth decisions. |
| T2   | 3-file architecture (immutable/editable/instructions) | Medium  | E0     | Clean "editable zone" contract. Compare against GSD plan + source pattern.                                       |
| T2   | Autonomous crash recovery                             | Medium  | E0     | Read trace, attempt fix, revert. Simpler than checkpoint+resume for low-cost tasks.                              |
| T3   | Results TSV logging                                   | Low     | E0     | Already have JSONL equivalent.                                                                                   |
| T3   | NEVER STOP autonomy model                             | Medium  | E0     | Extreme autonomy end. Study as a design boundary, not a pattern to adopt.                                        |

---

## 6. What's Worth Avoiding

**The no-license-on-purpose pattern.** Karpathy can get away with no license
because he's Karpathy. The 9,611 forks exist in legal ambiguity. If you publish
JASON-OS artifacts, don't follow this example.

**The single-metric optimization trap.** val_bpb is clean because Karpathy chose
a problem with one unambiguous metric. Most real work has multiple competing
metrics (speed vs quality vs complexity). The fixed-budget pattern transfers
well; the single-metric assumption does not. Don't flatten a multi-objective
problem into one number to make it look like autoresearch.

**Conflating simplicity with minimalism.** Autoresearch is minimal because the
problem is minimal (optimize one file for one metric). Your problems are not
minimal (72 skills, multi-phase workflows, cross-session state). Minimalism
applied to complex problems produces incomplete solutions. The simplicity
criterion is "remove what doesn't help" — not "only have 3 files."
