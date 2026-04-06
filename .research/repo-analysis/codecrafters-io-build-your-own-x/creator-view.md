# Creator View: codecrafters-io/build-your-own-x

**Analyzed:** 2026-04-06 | **Skill Version:** 4.1 | **Depth:** Standard

---

## 1. What This Repo Understands (+ Blindspots)

This repo understands something fundamental: the fastest way to truly learn a
technology is to build it yourself. The Feynman quote at the top isn't
decorative — it's the operating thesis. Every link in this collection exists
because someone sat down and said "I'm going to build a database / compiler /
operating system from scratch, and here's how."

The taxonomy is the real intellectual contribution. The 31 categories aren't
arbitrary — they represent the consensus answer to "what are the canonical
implementable systems?" From 3D renderers to web servers, this is a map of
what's worth rebuilding as a learning exercise. The categories that feel obvious
(database, shell, regex engine) and the ones that feel surprising (voxel engine,
physics engine, memory allocator) together draw the boundary of "systems you can
understand by building."

The curation quality is uneven but the selection criteria is clear: guided
tutorials that build real things from scratch, not framework guides or
library-gluing exercises. The issue template enforces this — "no frameworks,
libraries, guides for frameworks/libraries or tutorials that glue just other
libraries together."

**Blindspots:** The repo has a significant blind spot around modern AI/ML build
tutorials — only 3 entries under "AI Model" and those were clearly late
additions. The "Neural Network" section is more complete but aging. There's
nothing for "Build your own RAG system from scratch" beyond a single LangChain
link. The repo also completely misses the "Build your own developer tools"
category — no entries for building a linter, formatter, package manager, CI
system, or code editor plugin. Given that developer tooling is where a lot of
"build from scratch" energy has gone in the last 3 years, this is a meaningful
gap.

There's also a meta-blindspot: the repo catalogs tutorials for building systems,
but doesn't catalog tutorials for building _processes_ — build your own testing
framework, build your own deployment pipeline, build your own monitoring system.
The line between "system" and "process" is where a lot of modern engineering
learning happens.

---

## 2. What's Relevant To Your Work

The connection to your work is more specific than it first appears. Content
evaluation of 390 entries across 8 relevant categories surfaced 16 individually
applicable tutorials.

**React internals (directly applicable).** You use React 19 in SoNash. Two
tutorials stand out:

- [Build your own React](https://pomb.us/build-your-own-react/) (Pomber) — the
  canonical "build React from scratch" tutorial. Covers fiber architecture,
  reconciliation, and hooks. Understanding these improves your component design
  and helps diagnose re-render issues.
- [Didact](https://github.com/hexacta/didact) — focuses specifically on virtual
  DOM diffing. Complementary to Pomber.
- [Building a frontend framework from scratch](https://mfrachet.github.io/create-frontend-framework/)
  — templating, state, VDOM in plain JS. Deepens understanding of what Next.js
  abstracts away.

**Shell/CLI for JASON-OS.** 7 shell tutorials, 9 CLI tool tutorials:

- [Brennan's Write a Shell in C](https://brennan.io/2015/01/16/write-a-shell-in-c/)
  — canonical reference if JASON-OS needs custom command dispatch.
- [Build Your Own Shell using Rust](https://www.joshmcguigan.com/blog/build-your-own-shell-rust/)
  — Rust alternative. Pattern applicable regardless of language choice.
- [Command line apps in Rust](https://rust-cli.github.io/book/index.html) — CLI
  design patterns (arg parsing, output formatting). Your statusline is a Go CLI;
  these patterns transfer.

**Git internals (directly applicable).** Heavy git workflow (hooks, pre-commit,
pre-push, worktrees). Two tutorials:

- [Write yourself a Git!](https://wyag.thber.com/) — Python implementation from
  scratch. Understanding the object model helps design better hook
  infrastructure.
- [ugit](https://www.loomcom.com/blog/0110_build_your_own_git.html) — more
  approachable Python implementation.

**Regex theory (applicable to pattern compliance).** Your
`check-pattern-compliance.js` uses regex heavily.
[Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html)
(Russ Cox) explains NFA/DFA theory — helps write more efficient patterns.

**Taxonomy as skill organization model.** You have 72 skills in
`.claude/skills/`. This repo's 31-category taxonomy is a worked example of how
to organize a large collection of capabilities. The organizational challenge is
the same — yours are executable while these are educational.

**JASON-OS Domain 01 (Internal Archaeology).** The "build your own X" framing
could inform how you structure Domain 01's output: not "here's what exists" but
"here's how each system was built and why."

---

## 3. Where Your Approach Differs

**Ahead: Skill-as-documentation.** Your skills aren't just documentation —
they're executable workflows with SKILL.md files, REFERENCE.md companions, and
agent orchestration. This repo treats tutorials as static links. You've moved
past "here's how to learn X" into "here's how to _do_ X with AI assistance." The
skill-audit, convergence-loop, and deep-plan skills are examples of
knowledge-as-process that this repo doesn't imagine.

**Different: Curation philosophy.** This repo curates by technology domain
("build your own database"). You curate by workflow stage ("brainstorm → plan →
execute → review"). Neither is wrong — they're orthogonal organizing principles.
Your skills serve a single user's workflow; this serves a community's learning
paths.

**Behind: Nothing.** This repo doesn't do anything you need to do. It's a
curated list, not a system. The comparison is philosophical, not technical.

---

## 4. The Challenge

Here's the one thing worth sitting with: **your skill index is becoming a
curated list, and curated lists have a known failure mode.**

This repo is exhibit A. 486K stars, 462 open issues, 1 commit in 90 days. It
grew through community enthusiasm, hit a maintenance bottleneck, and is now in
celebrity stagnation. The issue template is the only quality gate, and it's
clearly not being enforced (462 open issues).

You have 72 skills. You're adding more through deep-plans and brainstorms. Your
quality gate is the skill-audit (scoring 78-90%), which is better than an issue
template — but the same growth dynamic applies. At some point, the catalog
outgrows the curator's attention span. The `/skill-creator` and `/skill-audit`
skills are your defense against this, but the meta-question is: do you have a
_retirement_ process? This repo doesn't, and it shows.

---

## 5. Knowledge Candidates

| Tier | Candidate                                    | Novelty | Effort | Notes                                                                     |
| ---- | -------------------------------------------- | ------- | ------ | ------------------------------------------------------------------------- |
| T1   | Skill retirement process design              | High    | E0     | Learn from this repo's stagnation. Apply to JASON-OS skill lifecycle.     |
| T1   | "Build your own" framing for Domain 01       | Medium  | E0     | Structure JASON-OS archaeology as "how each system was built" narratives. |
| T2   | 31-category taxonomy as organizing reference | Low     | E0     | Cross-reference against your skill categories for gaps.                   |
| T3   | Shell/CLI tutorial collection                | Low     | E0     | 7 shell tutorials potentially useful if JASON-OS needs custom dispatch.   |

---

## 6. What's Worth Avoiding

**The single-file-everything pattern.** This repo puts 390 links in one
README.md. It works at small scale and becomes unmaintainable at large scale.
You've already avoided this — your skills are individual directories with
SKILL.md + REFERENCE.md. But watch for the same impulse in other artifacts
(EXTRACTIONS.md, MEMORY.md). When a single file becomes the dumping ground for
"everything of type X," it's following this repo's trajectory.

**The no-license trap.** The README claims CC0 but there's no LICENSE file.
GitHub's API reports "no license." This means automated tools (including yours)
will flag it incorrectly. If you ever publish skills or JASON-OS artifacts,
include an actual LICENSE file — the inline declaration isn't machine-readable.
