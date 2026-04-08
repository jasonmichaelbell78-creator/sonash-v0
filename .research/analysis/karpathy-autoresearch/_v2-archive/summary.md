# karpathy/autoresearch — Deep Analysis

**Analyzed:** 2026-04-03 | **Depth:** Deep (clone + static + temporal) |
**Age:** 28 days

> AI agents running research on single-GPU nanochat training automatically

## Health Summary

| Dimension       | Band              | Score  | Detail                                           |
| --------------- | ----------------- | ------ | ------------------------------------------------ |
| Security        | **Critical** (9)  | 9/100  | No license, no scanning, no branch protection    |
| Reliability     | Needs Work (30)   | 30/100 | No CI/CD, no tests, no quality gates             |
| Maintainability | Healthy (82)      | 82/100 | 1,019 LOC, 3-file design, clean PyTorch          |
| Documentation   | Healthy (78)      | 78/100 | Excellent README + program.md, no CONTRIBUTING   |
| Process         | **Critical** (15) | 15/100 | No branch protection, no review, bus factor = 1  |
| Velocity        | Excellent (95)    | 95/100 | 65K stars in 28 days, 9.2K forks, viral adoption |

## Architecture Assessment (Deep)

**Architecture score: 88/100** — Exceptionally well-designed for its purpose.

- **3-file contract:** `prepare.py` (immutable infrastructure, 389 LOC) +
  `train.py` (agent-editable target, 630 LOC) + `program.md` (agent
  instructions). Total: 1,019 LOC for a complete GPT training pipeline with
  tokenizer, data loading, and evaluation.
- **program.md is a masterclass** in AI agent instruction design: setup
  protocol, experiment loop, keep/discard semantics, crash recovery, NEVER STOP
  autonomy.
- **Security: low risk.** No subprocess calls, no shell invocation, no user
  input. Only network call is HuggingFace dataset download with timeouts.

## Temporal Fingerprint (Deep)

- **60 commits, 28 days.** 25 by AI agent ("autoresearch"), 29 by Karpathy, 6
  community.
- **42% of commits are by the AI agent** — the repo is its own proof of concept.
- **48-hour burst:** 30 commits in Mar 7-8 (overnight autonomous experiments).
- **Then maintenance mode:** bug fixes, README updates, community PRs.
- **8 days since last push** (Mar 25). Experiment cycle may be complete.
- **Bus factor = 1.** Karpathy is sole maintainer. Community PRs are one-off
  fixes.

## Key Findings

1. **NO LICENSE** (Critical). Without a license, 9,260 forks exist in a legal
   gray zone. This is the #1 blocker for any adoption.
2. **Security Facade.** "Copilot code review" workflow (20 runs, all failing)
   creates appearance of CI without substance.
3. **Zero test infrastructure.** No tests, no lint, no type checking. The
   5-minute training run IS the validation mechanism — by design.
4. **Brilliant minimalism.** The entire GPT training pipeline (model, optimizer,
   data loading, evaluation, tokenizer) fits in 1,019 LOC across 2 files.
5. **Agent-human commit parity.** 42% AI-authored commits demonstrate the
   autonomous research concept working in practice.

## Absence Patterns

- **SECURITY_FACADE:** Copilot code review workflow present but non-functional.

## Adoption Verdict: Extract (62)

**Do not adopt as a dependency.** No license blocks direct code use. Instead:

| Candidate                    | Novelty | Effort | Relevance to JASON-OS           |
| ---------------------------- | ------- | ------ | ------------------------------- |
| program.md Agent Instruction | High    | E0     | Compare against SKILL.md format |
| Fixed-Budget Experimentation | High    | E0     | Generalizable optimization loop |
| 3-File Architecture Pattern  | Medium  | E0     | Agent-editable zone contracts   |
| Crash Recovery Protocol      | Medium  | E0     | GSD executor, background agents |
| Results TSV Logging          | Low     | E0     | Already have JSONL equivalent   |
