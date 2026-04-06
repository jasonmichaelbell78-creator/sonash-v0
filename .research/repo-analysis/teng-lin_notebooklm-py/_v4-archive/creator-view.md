# Creator View: teng-lin/notebooklm-py

## 1. What This Repo Understands

This repo has figured out something most SDK authors haven't even tried: **how
to ship a single capability across four audiences from one codebase**.
NotebookLM-py isn't "a Python library that also has a CLI." It's one codebase
that simultaneously serves a Python SDK, a Click CLI, a Claude Code skill, and a
Codex skill — and every one of those surfaces is first-class. You can see the
conviction in the repo root: `CLAUDE.md`, `AGENTS.md`, `SKILL.md`, and
`README.md` all sit side-by-side with equal weight. No "oh and we also have a
CLI" afterthought.

The deeper insight is about **agent autonomy as a design input, not a wrapper**.
Most CLIs for LLMs read like a function catalogue — "here are the commands, good
luck." NotebookLM's `SKILL.md` has a whole section called `Autonomy Rules` that
splits every command into `Run automatically (no confirmation)` vs
`Ask before running`, with a brief reason for each. `delete` is ask-first
because it's destructive. `generate *` is ask-first because it's long-running
and may fail. `download *` is ask-first because it writes to the filesystem.
`notebooklm status`, `list`, `artifact list` are auto-run because they're
read-only diagnostics. This is an intentional safety boundary baked into the
skill itself, not a prompt-engineering afterthought.

The repo also understands something important about **working with systems you
don't control**. The whole library is built on Google's internal `batchexecute`
RPC protocol with obfuscated method IDs — things like
`LIST_NOTEBOOKS = "wXbhsf"` and `CREATE_NOTEBOOK = "CCqFvf"` that can change
silently at any time. Instead of pretending this away, they've built a
discipline around it: `rpc/types.py` is declared the single "source of truth",
there's a nightly `rpc-health.yml` workflow that verifies each of the 35+ method
IDs still round-trip correctly, and when Google breaks something the workflow
auto-files a GitHub issue with the `rpc-breakage` label. They even document how
you can self-heal your local copy with
`RPCMethod.SOME_METHOD._value_ = "NewMethodId"` before the official patch ships.
That's not just robustness — it's teaching users to collaborate with the
fragility.

The fourth thing this repo understands is **parallel-agent safety**. There's a
whole section in `SKILL.md` dedicated to what happens when multiple agents share
one machine. The CLI stores notebook context in `~/.notebooklm/context.json`
(singleton), so concurrent `use` commands clobber each other. The repo doesn't
just warn about this — it provides three explicit solutions: pass `-n <id>`
everywhere and avoid `use` entirely, isolate with
`NOTEBOOKLM_PROFILE=agent-$ID`, or isolate harder with
`NOTEBOOKLM_HOME=/tmp/agent-$ID`. And for long-running generations, the SKILL.md
actually embeds the exact `Task(...)` invocation you should copy-paste to spawn
a background agent. It treats "spawn a subagent" as a normal workflow primitive,
not an escape hatch.

Finally, there's a quieter insight about **skill distribution**. The
`notebooklm skill install` command (`src/notebooklm/cli/skill.py`) is a 280-line
module that reads `SKILL.md` out of package data (`notebooklm/data/SKILL.md`,
force-included via hatchling config), stamps the CLI version into the
frontmatter as `<!-- notebooklm-py v0.3.4 -->`, and writes it to
`~/.claude/skills/notebooklm/SKILL.md` AND
`~/.agents/skills/notebooklm/SKILL.md`. Then `notebooklm skill status` checks
for version drift between the stamped file and the current CLI. This is the
Python package acting as its own skill distribution channel — pip-installable,
version-drift-aware, multi-target. And there's a second channel too:
`npx skills add teng-lin/notebooklm-py` fetches SKILL.md directly from GitHub
via an "open skills ecosystem" (a separate project this repo integrates with).

## 2. What's Relevant To Your Work

Everything, actually. This is dead-center JASON-OS territory.

Your [user_os_vision memory](user_os_vision.md) notes your primary goal is a
**project-agnostic "Claude Code OS" with portable workflows, skills, agents**.
You currently have 71 skills in `.claude/skills/` locked to this project
worktree — no distribution story, no versioning, no cross-locale sync. Your
[cross_locale_config memory](project_cross_locale_config.md) explicitly calls
out that branch-specific skill artifacts aren't visible cross-locale. Your
active `project_jason_os` work is at 17 domains / 35 decisions, sitting in
post-brainstorm state waiting for deep-plan.

NotebookLM-py is what a shipped, distributed JASON-OS component looks like when
the skill, the CLI, and the library are one artifact. A few direct mappings:

- Your `.claude/skills/repo-analysis/SKILL.md` uses the same YAML frontmatter
  format (`name`, `description`) as `notebooklm/SKILL.md`. The structural
  compatibility is already there — if you wrapped repo-analysis's logic behind a
  CLI, you could ship it the same way they ship notebooklm.
- You have `CLAUDE.md` at the sonash-v0 root. They have `CLAUDE.md` at the
  notebooklm-py root, treating Claude Code as a first-class developer audience.
  Their version is 280 lines of architecture + commands + PR workflow. Yours is
  135 lines of stack + guardrails + triggers. Different optimization targets,
  same pattern.
- Your `/repo-analysis` skill produces `.research/repo-analysis/<slug>/`
  artifacts. Their `notebooklm` CLI produces files via `notebooklm download`.
  Both are "capability wrapped in a named, stable output contract." They just
  went one level further and made theirs `pip install`-able.
- Their RPC layer (`rpc/types.py` with 35+ method IDs) is a directly
  transferable pattern for your **undocumented interface problem**: you have
  `httpsCallable` Cloud Functions in sonash-v0 that could have the same "source
  of truth + nightly health check + auto-issue-on-break" discipline. You don't
  have this today — Firebase doesn't break silently the way `batchexecute` does,
  but your own custom RPC surfaces could benefit.
- Their `Autonomy Rules` table in SKILL.md is exactly the kind of thing your
  `sc:agent` / agent definitions gesture at but don't encode as a structured
  contract. Your agents have tool access lists; theirs have per-command autonomy
  levels with reasoning. Your agents have descriptions; their SKILL.md has
  explicit activation triggers ("Activates on explicit /notebooklm or intent
  like 'create a podcast about X'").

## 3. Where Your Approach Differs

**Ahead (you've solved this better):**

- **Skill depth and meta-workflows.** Your 71-skill ecosystem includes
  `brainstorm`, `deep-plan`, `deep-research`, `skill-creator`, `skill-audit`,
  `/convergence-loop`, `/multi-ai-audit`. NotebookLM-py ships one
  highly-polished skill (`notebooklm`) — it does ONE thing extremely well, but
  it doesn't have a _system_ of skills that compose. Your orchestration-layer
  ambitions (teams, agents, GSD) are a generation beyond what they're doing
  here.
- **Convergence-loop discipline and verification-before-completion.** Your
  memory set is full of feedback like "Never accept empty agent results
  silently", "Learning entry + JSONL + state file are MANDATORY", "Convergence
  loops mandatory". Their SKILL.md has `Error Handling` and `Exit Codes` tables
  but no built-in verification discipline. Their nightly RPC check is narrow (ID
  round-trip only, explicitly NOT schema validation).
- **Multi-layer memory and cross-session state.** They have `NOTEBOOKLM_HOME`
  and profiles. You have `MEMORY.md` + episodic memory + TDMS + state files +
  compaction-resilient artifacts as a coherent discipline.
- **Bus factor.** Yours is "you, 263 sessions". Theirs is "teng-lin: 551
  commits, everyone else ≤21" — which is the same bus-factor-of-one problem, but
  you've made peace with it and tooled around it with memory, skills, and state
  persistence. They haven't yet.

**Different (valid alternatives, neither wrong):**

- **Solo codebase vs. coordinated fleet.** Your skills live in one project repo
  (sonash-v0); they may eventually move to `~/.claude/skills/` as JASON-OS
  matures. NotebookLM-py's skill lives in a _separate_ pip-installable package
  that writes into `~/.claude/skills/`. Same destination, opposite direction.
  Their approach requires Python and pip. Yours requires nothing — you just edit
  files. Trade-off is: theirs is distributable to other users; yours is
  infinitely malleable.
- **Testing philosophy.** They enforce 90% coverage, ruff + mypy + pre-commit,
  and have a 3-tier test split (unit / integration-VCR / e2e). You have a much
  looser functional-test culture (`node:test`, not Jest) with a strong
  patterns:check gate and code-reviewer agent doing most of the heavy lifting.
  Both work. Theirs catches type errors earlier; yours catches architectural
  violations earlier.
- **Documentation granularity.** They split docs into `cli-reference.md`,
  `python-api.md`, `configuration.md`, `troubleshooting.md`, `development.md`,
  `rpc-development.md`, `rpc-reference.md`, `stability.md` — seven separate
  surfaces. Your approach is fewer, denser entry points (`CLAUDE.md`,
  `AI_WORKFLOW.md`, `ROADMAP.md`, `docs/agent_docs/*.md`). Neither is wrong.
  Theirs is better for external users; yours is better for an AI agent orienting
  itself quickly.
- **Install target scopes.** Their CLI supports `--scope user` (`~/.claude/...`)
  AND `--scope project` (`./.claude/...`) for skill installation. You work
  exclusively in project scope today. Worth noting: they default to `user`, you
  default to `project`. Those are genuinely different philosophical positions
  about where skills live.

**Behind (they've figured out something you haven't):**

- **Skill versioning and drift detection.** Their `notebooklm skill install`
  stamps `<!-- notebooklm-py v0.3.4 -->` into the installed SKILL.md
  frontmatter, and `notebooklm skill status` reads that stamp and warns "version
  mismatch — run `notebooklm skill install`". You have no equivalent. When you
  edit a skill in worktree-rnd-4526 and another worktree has the old version,
  nothing detects the drift. Your cross_locale_config memory calls this out as a
  known problem. They have a clean, minimal solution for it that's worth copying
  wholesale.
- **Package-data-as-canonical-source.** They force-include `SKILL.md` into the
  wheel at build time
  (`force-include = {"SKILL.md" = "notebooklm/data/SKILL.md"}`). The installed
  skill is a _copy_; the canonical source is inside the package. This means
  `pip install --upgrade notebooklm-py && notebooklm skill install` updates your
  skills transactionally. You don't have a canonical source distinct from the
  file Claude Code reads — they're the same file, which means no way to version,
  no way to update atomically, no way to detect tampering.
- **SKILL.md as executable spec.** Their SKILL.md is not just documentation.
  It's an executable spec for the agent: autonomy rules, activation triggers,
  error decision trees, exit code contracts, JSON schemas, subagent patterns
  with literal `Task(...)` invocations, common workflows with timing estimates.
  Yours are more guidance-oriented. Theirs treats the agent as a first-class
  execution target and writes the skill accordingly. This is a craft skill, not
  a tooling one.
- **PR workflow baked into CLAUDE.md.** Their CLAUDE.md has a mandatory 4-step
  PR workflow: monitor CI → check review comments → address each → reply with
  commit SHA → verify `mergeStateStatus === CLEAN` before merge. It's embedded
  in the project's CLAUDE.md so any Claude Code session in their repo picks it
  up automatically. You have a `/pr-review` skill that does similar work, but
  it's invoked rather than ambient. There's something to learn about _ambient vs
  invoked_ agent guidance.
- **pyproject.toml `fancy-pypi-readme` substitutions.** They rewrite relative
  doc links to version-tagged absolute GitHub URLs at build time (`](docs/` →
  `](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/docs/`). This
  solves the classic "README on PyPI has broken links" problem _and_ makes sure
  the README on PyPI at v0.3.4 always links to v0.3.4 docs, not main. It's a
  beautiful, tiny hack you don't need today but will want when you publish
  anything.

## 4. The Challenge

**The thing from this repo you should seriously consider is the
`notebooklm skill install` pattern — and you should consider it specifically as
a solution to your cross-locale drift problem.**

Not because you should publish your skills to PyPI (you shouldn't, at least not
yet). Because the _shape_ of their solution is exactly the shape of what
JASON-OS needs:

1. **A canonical source distinct from the installed copy.** Today, your
   `.claude/skills/repo-analysis/SKILL.md` is both the canonical source AND the
   file Claude Code reads. When you edit it in worktree-rnd-4526, no other
   worktree knows. When you fix a bug in skill X in session #263, and session
   #264 in another worktree starts from its older copy, you lose the fix
   silently. You have no way to version, no way to detect drift, no way to
   update atomically.

2. **A version stamp embedded in the installed file.** Their 4-line
   `add_version_comment` function does the entire job: strip frontmatter, inject
   `<!-- notebooklm-py v{version} -->`, reassemble. That's it. `skill status`
   reads the stamp, compares it to the current source version, yells if they
   differ.

3. **An installer that's idempotent and multi-target.**
   `notebooklm skill install` writes to `~/.claude/skills/notebooklm/SKILL.md`
   AND `~/.agents/skills/notebooklm/SKILL.md` in one command, handles
   `--scope user|project`, and treats the operation as a transaction (all
   succeed or all fail).

**Concrete recommendation:** Build a `/skill-sync` or `skill-installer.js` that
does for your 71 skills what `notebooklm skill install` does for its one.
Canonical sources live in a designated place (say, `.claude/skills/` in the main
branch of sonash-v0, or eventually a separate repo). Installed copies live
wherever the skill is actually read from. Each installed SKILL.md gets a version
stamp (git SHA, semver, or session number — you pick). `skill-sync status`
reports drift. `skill-sync install` idempotently updates.

This is a ~1 day build that directly retires a documented problem
(cross*locale_config) and unblocks the JASON-OS portability story. It's also the
first step toward \_any* future distribution model — pip, npm, a GitHub-based
registry, whatever. You can't distribute what you can't version.

**Why this specifically and not their other good ideas?** Because the others are
either things you're already doing better (convergence loops, memory), things
that don't apply yet (nightly RPC health, since you don't have that failure
mode), or things you'd need to adapt heavily (PyPI packaging, which requires a
Python host when your ecosystem is Node). The skill install pattern is copyable
as-is, with the smallest semantic gap, and it retires a real problem.

**Secondary challenge worth noting:** Their `Autonomy Rules` section in SKILL.md
is a pattern your skills would benefit from. You have skills that wrap
destructive operations (e.g., anything that writes to TDMS, creates PRs, pushes
commits), and the "when is it OK to run without asking" question is answered
case-by-case in your behavioral guardrails rather than per-command in the skill
itself. Consider adding an `Autonomy Rules` section to your highest-risk skills
(`add-debt`, `pr-review`, `session-end`, any `/audit-*`) with explicit auto-run
/ ask-first splits. The skill-sync pattern above is the bigger win; autonomy
rules are the easier win.

## 5. Knowledge Candidates

### Tier 1 — Directly relevant to active projects

**K1. Skill-as-pip-package distribution model.** The entire
`src/notebooklm/cli/skill.py` (280 lines) plus the hatchling `force-include`
config plus the `add_version_comment` trick. Read it as a complete reference for
"how to ship a skill as installable software." Relevant to JASON-OS and directly
addresses cross_locale_config drift. Effort: 30 min read. Relevance: very high.

**K2. SKILL.md as executable spec.** Read their SKILL.md in full (500 lines),
specifically the structure: frontmatter activation triggers → installation →
prerequisites → parallel-agent safety → agent setup verification → autonomy
rules → quick reference → output formats with JSON schemas → generation types →
features beyond UI → common workflows with embedded Task() patterns → output
style → error handling → exit codes → known limitations. This is a _template_
worth studying. Your most complex skills (`/deep-plan`, `/audit-comprehensive`,
`/repo-analysis` itself) could steal 2-3 sections of this structure. Effort: 45
min read. Relevance: high.

**K3. Undocumented-API discipline.** Read `docs/stability.md` +
`docs/rpc-development.md` + `src/notebooklm/rpc/types.py` + the `rpc-health.yml`
workflow. This is a masterclass in "engineering against a moving target you
don't control." The key insight is the nightly ID round-trip check — minimal,
cheap, catches the specific failure mode that matters. You don't have this
problem for Firebase, but you do have it for Claude Code's tool API, the
Anthropic SDK versions, and any external MCP servers. Could seed a
`/external-api-health` skill. Effort: 30 min read. Relevance: medium-high.

### Tier 2 — Deepens systems understanding

**K4. `fancy-pypi-readme` substitution pattern.** Tiny insight, high leverage
when you eventually publish anything. Templated README processing at build time
solves a class of doc-staleness problems. Effort: 10 min read of pyproject.toml
lines 60-90. Relevance: medium, latent.

**K5. CLAUDE.md as ambient agent guidance.** Their CLAUDE.md embeds a mandatory
PR workflow directly in the agent-facing doc. Contrast with your invoked
`/pr-review` skill. There's a design question here: when should agent guidance
be ambient (loaded every turn) vs invoked (loaded on demand)? Their answer:
high-criticality process discipline goes ambient; everything else goes in docs.
Effort: 15 min study + comparison with your CLAUDE.md. Relevance: medium.

**K6. Three-tier test strategy.** Unit (no network) / integration (VCR-recorded
HTTP) / e2e (authenticated real API, explicitly marked). Especially their use of
`vcrpy` for recording HTTP cassettes is interesting — your functional test
discipline around `httpsCallable` mocking is the equivalent but structurally
different. Worth comparing. Effort: 20 min read of `tests/conftest.py` +
`tests/vcr_config.py`. Relevance: medium, mostly conceptual.

### Tier 3 — Interesting but lower priority

**K7. Click command organization at scale.** Their `src/notebooklm/cli/` has 22
modules for a CLI with ~50 commands. How they split groups (`session.py`,
`notebook.py`, `source.py`, `generate.py`, `download.py`, etc.) is a good
reference for any future large CLI you might build. Effort: 20 min browse.
Relevance: low-medium, latent.

**K8. `SourceFulltext.find_citation_context()` pattern.** Mentioned in SKILL.md
— citations returned from the API are snippets that don't always match the raw
fulltext, so they built a helper that locates citation context with position
tracking and handles ambiguous matches. A nice example of API ergonomics when
the underlying data is messy. Effort: 10 min to read the relevant function.
Relevance: low, interesting as a pattern.

**K9. The `open skills ecosystem` (`npx skills add`).** They reference this in
the README but I haven't verified what it actually is. Could be a lightweight
skill registry worth knowing about for JASON-OS distribution research. Needs a
separate 15-min investigation to determine if it's a real ecosystem or just
aspirational naming. Effort: 15 min web research. Relevance: potentially high if
it's real, zero if it's vapor.
