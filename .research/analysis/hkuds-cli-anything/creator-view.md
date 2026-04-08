# Creator View: HKUDS/CLI-Anything

**Analyzed:** 2026-04-06 | **Skill Version:** 4.1 | **Depth:** Standard

---

## 1. What This Repo Understands (+ Blindspots)

This repo understands something that most AI tooling projects haven't fully
grasped yet: the bottleneck for AI agents isn't intelligence — it's the
inability to operate software designed for humans. Every GUI application is a
locked door for an agent. CLI-Anything provides the lockpick: a systematic
methodology for wrapping any GUI application in a CLI that agents can invoke.

The HARNESS.md is the intellectual heart. It's a 7-phase SOP that takes you from
"I have a GUI app" to "agents can operate it." The phases are smart: start with
codebase analysis (find the backend engine), design the CLI architecture (REPL +
subcommands), implement layer by layer (data → probes → mutations → backend →
export → session → REPL), then generate SKILL.md for agent discoverability. This
isn't just documentation — it's a repeatable manufacturing process for
agent-native interfaces.

The registry pattern (35 CLIs in `registry.json`, served via CLI-Hub static
site) solves the discovery problem. An agent can fetch the catalog, find the
right tool, and `pip install` it — all without human intervention. The
meta-skill (`cli-hub-meta-skill/SKILL.md`) makes this loop self-contained.

The security thinking is unusually mature for a 29-day-old project. The
SECURITY.md names the actual threat: "an AI agent may autonomously construct and
execute commands based on untrusted input." The codec allowlist pattern,
Script-Fu escape functions, and the explicit "never use `shell=True`" rule show
someone thought about the attack surface, not just the happy path.

**Blindspots:** The project is 100% Python. There's no TypeScript/Node path for
the many developers (like you) building in that ecosystem. The HARNESS.md
methodology is language-agnostic in principle, but every implementation detail
assumes Python + Click + subprocess. If JASON-OS wanted to wrap a tool, it would
need to port the pattern.

The testing claim (1,839 tests) is hard to verify from the repo structure — 74
test files with 0 conftest.py files suggests these might be flat test scripts
rather than a unified test suite. No CI runs tests (only `deploy-pages.yml`
exists). The tests exist but aren't enforced.

The project is growing extremely fast (28K stars in 29 days, daily commits, 30+
contributors), which creates a quality treadmill risk. Each new harness is a
separate package with its own tests, and there's no visible integration testing
across harnesses.

---

## 2. What's Relevant To Your Work

Content evaluation of 6 guides, 37 SKILL.md files, 35 registry entries, and 5
plugin commands surfaced specific artifacts with direct applicability.

**MCP backend pattern (guides/mcp-backend.md).** You already have 3 MCP servers
(memory, sonarcloud, context7). This guide shows how to wrap an MCP server as a
CLI backend using `mcp.ClientSession` + `stdio_client`, with sync wrappers for
each tool. If JASON-OS needs to expose MCP services as CLI commands (or wrap
external MCP servers), this is the exact pattern. The DOMShell browser harness
is a working implementation of this pattern.

**Skill auto-generation (guides/skill-generation.md).** `skill_generator.py`
introspects Click CLI decorators and auto-generates SKILL.md via Jinja2
templates. You write SKILL.md files by hand (72 of them). The auto-generation
approach could inform `/skill-creator` — imagine generating a first-draft
SKILL.md from a new CLI tool's `--help` output, then hand-refining it.

**Session file locking (guides/session-locking.md).** `_locked_save_json`: open
`"r+"` (no truncation), `fcntl.flock` exclusive, then truncate+write inside the
lock. Your JSONL files (reviews.jsonl, hook-warnings-log.jsonl,
MASTER_DEBT.jsonl) are written by multiple scripts and could benefit from
similar locking. The pattern degrades gracefully on Windows.

**Mermaid harness** — the lightest-weight implementation. No local binary
required (uses mermaid.ink cloud renderer). 183-line SKILL.md. If you ever want
to add agent-driven diagram generation to JASON-OS, this is ready to use with
`pip install cli-anything-mermaid`.

**Exa harness** — AI-powered web search via Exa API. Your `/deep-research` uses
WebSearch. Exa offers structured content extraction (not just search) — a
potential alternative or complement for research searcher agents.

**NotebookLM harness** — wraps `teng-lin/notebooklm-py` (one of your 6 analyzed
repos). Cross-repo connection: CLI-Anything provides the agent-native CLI
interface for notebooklm-py's functionality. This is the build-vs-integrate
question made concrete.

**SKILL.md format comparison.** Their SKILL.md (mermaid: 183 lines, drawio: 213
lines) is: YAML frontmatter + Installation + Basic Commands + Command Groups +
Examples. Your SKILL.md (repo-analysis: ~350 lines) is: YAML frontmatter +
Critical Rules + When to Use + Process Overview + Phase definitions + Guard
Rails. Command catalog vs workflow definition — different tools for different
abstraction levels.

**Plugin format (.claude-plugin/).** `marketplace.json` + 5 slash command
definitions in `commands/` (cli-anything.md, list.md, refine.md, test.md,
validate.md). First public Claude Code plugin reference. Compare against your
`.claude-plugin/` structure for JASON-OS distribution.

**Registry pattern.** `registry.json` (35 entries) powers a live hub at
`hkuds.github.io/CLI-Anything/`. Agent-discoverable via meta-skill. Your
`SKILL_INDEX.md` is static. This is the distribution model to study.

**ReplSkin.** Their `repl_skin.py` provides a branded terminal UI (banner,
styled prompts, colored output, progress bars) that any harness can import. You
have no equivalent — your skills are document-driven, not UI-driven. If JASON-OS
develops interactive modes, this is a reference implementation.

---

## 3. Where Your Approach Differs

**Ahead: Skill sophistication.** Your skills are multi-phase workflows with
convergence loops, agent orchestration, compaction resilience, and quality
audits. CLI-Anything's SKILL.md files are flat command references — they tell an
agent what commands exist, not how to accomplish a goal. Your `/deep-research`
skill with 39 agents and 5 verification phases is in a different league than
their "here are the CLI subcommands."

**Ahead: Quality infrastructure.** You have 72 skills with a skill-audit scoring
system (78-90%), pattern compliance checks, pre-commit hooks, code review
automation, and a full TDMS. CLI-Anything has no CI testing, no automated
quality gates, no pattern enforcement — just a contribution guide and manual
review.

**Different: Target abstraction.** CLI-Anything wraps external GUI software for
agent use. Your skills wrap _processes and workflows_ for agent use. They make
software operable; you make methodology executable. Both are agent-native, but
at different layers of the stack.

**Behind: Plugin ecosystem.** CLI-Anything has a
`.claude-plugin/marketplace.json`, a `registry.json` powering a live hub, a
meta-skill for agent self-discovery, and `pip install` distribution. Your skills
are local-only. If portability matters (JASON-OS vision), their distribution
model is ahead of yours.

---

## 4. The Challenge

The HARNESS.md methodology should inform JASON-OS Domain 02a. Specifically:

When JASON-OS needs to teach agents to operate new software, the question isn't
"should we write a CLI wrapper?" — CLI-Anything already solves that for Python.
The question is: **should JASON-OS generate skills that invoke CLI-Anything
harnesses, or should it generate its own Node/TS wrappers using the same
methodology?**

This is a build-vs-integrate decision that directly affects JASON-OS
architecture. The HARNESS.md phases (analyze backend → design CLI → implement →
generate SKILL.md) are transferable regardless of the answer. But the registry
and distribution patterns only transfer if you integrate rather than rebuild.

---

## 5. Knowledge Candidates

| Tier | Candidate                          | Novelty | Effort | Notes                                                                            |
| ---- | ---------------------------------- | ------- | ------ | -------------------------------------------------------------------------------- |
| T1   | HARNESS.md 7-phase SOP             | High    | E0     | Agent-native CLI methodology. Directly applicable to JASON-OS Domain 02a.        |
| T1   | SKILL.md format comparison         | High    | E0     | Command catalog vs workflow definition. Design space exploration.                |
| T1   | .claude-plugin/marketplace.json    | High    | E0     | First public Claude Code plugin format reference. Compare against yours.         |
| T2   | Registry + CLI-Hub distribution    | Medium  | E1     | JSON registry → static hub → pip install. JASON-OS distribution model.           |
| T2   | ReplSkin terminal UI pattern       | Medium  | E1     | Branded REPL with Python prompt_toolkit. Pattern portable, code Python-specific. |
| T2   | Codec allowlist security pattern   | Low     | E0     | frozenset-based subprocess arg validation. Similar to your patterns.             |
| T3   | Skill generator (Jinja2 templates) | Medium  | E2     | Auto-generates SKILL.md from CLI inspection. Pattern portable, needs Node port.  |

---

## 6. What's Worth Avoiding

**The no-CI-for-tests pattern.** 74 test files with no CI enforcement means
tests exist for documentation purposes, not quality gates. Their contribution
guide says "ensure tests pass" but nothing enforces it. You've solved this —
your pre-commit hooks and pattern checker are the enforcement mechanism they're
missing. Don't regress on this if you adopt any of their patterns.

**The monorepo-of-independent-packages pattern.** Each harness is its own
`setup.py` package in a subdirectory. This means no shared test infrastructure,
no integration tests across harnesses, and no way to verify that a change to
`repl_skin.py` doesn't break 35 consumers. This is the cost of their "each
harness is independent" design. If JASON-OS distributes skills as packages,
consider a monorepo test strategy that CLI-Anything lacks.

**Growing faster than quality gates can absorb.** 28K stars in 29 days with 30+
contributors and no automated quality enforcement is a recipe for the same
trajectory as build-your-own-x — just faster. Watch this repo for the stagnation
pattern in 6-12 months.
