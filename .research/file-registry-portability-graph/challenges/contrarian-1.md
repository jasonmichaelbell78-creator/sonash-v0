# Contrarian Challenge — file-registry-portability-graph

_Written by orchestrator from contrarian-challenger agent's task-notification
output per Critical Rule #4._

**Agent:** contrarian-challenger **Date:** 2026-04-17 **Target:**
RESEARCH_OUTPUT.md Section 6 Option B recommendation

---

## Three Most Dangerous Challenges

**Most dangerous (C1 — CRITICAL):** Research bet on `@optave/codegraph`
supporting 34 languages. GitHub title says 11. If `.md`/`.yaml` files aren't
first-class indexed nodes in codegraph, Option B solves the wrong problem — it
builds a code graph for a workflow/documentation portability use case.

**Second most dangerous (C3 — CRITICAL):** Research frame is wrong. "File graph
with scope tags" answers "which files can I copy?" The user's JASON-OS vision
asks "which skills can I run?" Different tools. A capability/environment
dependency graph is the correct abstraction; a file-path registry with
frontmatter tags is a proxy that may not transfer.

**Third most dangerous (C8 — MAJOR):** 29% abandonment rate cited as primary
constraint but nothing in Option B is automated. Five new mechanisms require
manual action. The T0 classify-files action was identified 18 days ago and never
executed — an in-flight abandonment signal.

---

## C1: The 11-vs-34 Language Discrepancy Is Foundational [CRITICAL]

**Target claim:** C-072 — "@optave/codegraph builds function-level and
file-level dependency graph across 34 languages"

**Steel-man:** tree-sitter ships grammars for 40+ languages; "34 languages"
plausible if codegraph bundles broadly. File-level graph (vs symbol-level) could
work for any tree-sitter-tokenizable file.

**Challenge:** Official GitHub repo title (authoritative single-line
description): "Code intelligence CLI — function-level dependency graph across 11
languages." V2 verification already flagged inconsistency. The research scored
codegraph "Y" for "File-graph — function-level and file-level dependency edges
across 34 languages" — based on MEDIUM-confidence claim that may be 3× inflated.

For JASON-OS, primary targets are `.yaml`, `.md`, `.sh`, `.json`, `.ts` —
skill/agent/memory artifacts. A "code intelligence CLI" designed for 11
programming languages likely treats `.md`/`.yaml` as unsupported or passive
nodes with no edge inference.

If `.md`/`.yaml` receive no edges, codegraph's composite score drops below
Obsidian+FolderBridge+Breadcrumbs+Dataview which explicitly handles `.md` with
typed edges. Option B's foundation disappears.

**Evidence:** GitHub title (web 2026-04-17) "11 languages"; V2 README-vs-reality
flag; C-072 MEDIUM confidence; T28 LadybugDB marketing-vs-reality precedent.

**Recommendation:** Downgrade Option B to LOW-MEDIUM pending empirical
verification. Install codegraph, run against `.md`/`.yaml`/`.sh` directory,
confirm edge inference. If no edges → Option A (extend T28 SQLite with
frontmatter scanner) is strictly better.

---

## C2: The T0 Action Has Failed Before — Something Structural Is Wrong [MAJOR]

**Target claim:** "Apply D7 scope schema to 44 JASON-OS memory files as T0
action"

**Steel-man:** 83 files with consistent naming prefixes already encoding scope;
frontmatter insertion only; 30-minute task; unblocks classification without
infrastructure.

**Challenge:** Multi-layer-memory research flagged this T0 action on 2026-03-31.
It's now 2026-04-17 — 18 days. Not only was it not executed; file count grew 44
→ 83 (89% growth). This is signal, not inertia.

**Hypothesis:** classifying doesn't unlock anything visible. `scope:` tag has no
runtime consumer — no MCP tool reads it, no automation acts on it, no query
returns different results. Documentation without a feedback loop. 89% growth
rate means ~45 new files to tag per 18 days indefinitely — a tax that increases
with growth.

**Evidence:** C-ML-1 deferred 18 days; 89% growth verified by V1; C-D7-NAMING
confirms prefixes already encode scope → tags redundant; no MCP tool reads
`scope:` and produces runtime output; 29% abandonment rate applies to
manual-entry mechanisms.

**Recommendation:** Define the runtime consumer before tagging. If it's "the MCP
tool we'll build," defer tagging until tool exists (wrong format wastes effort).
If Obsidian Dataview, only tag if Option C chosen. If "human reference only,"
acknowledge as documentation without automation.

---

## C3: The Wrong Abstraction — File Graph vs. Capability Graph [CRITICAL]

**Target claim:** Research frame — "self-updating file registry with tags +
upstream/downstream graph"

**Steel-man:** Files are the only portable artifacts — you can't "move" a
capability without its files. Tracking files IS tracking capabilities. Scope +
dependency edges fully describes portability.

**Challenge:** Argument fails for **runtime dependencies**. `scope: universal`
on `/deep-research/skill.md` asserts file is portable. But whether it executes
in project X depends on:

- Which MCP servers are registered (`context7`, `serena`)
- Which Claude Code permissions are granted
- Which sub-skills are present in `~/.claude/skills/`
- Which pre-commit hooks are installed

None visible in file graph. A skill file can be `scope: universal` while being
functionally inoperable on a clean install.

D7 "dependency graph heuristic" attempts capability portability from file
dependencies but only traverses declared frontmatter. Misses MCP server
dependencies, environment dependencies, permission dependencies.

**Evidence:** JASON-OS vision = "portable workflows, skills, agents" (not
"files"); D7 Contradictions show same vocabulary ≠ same semantics; C-035/C-064
show `scope:shared` ≠ `machine` ≠ portability; Gap 3 acknowledges but
understates capability-dependency problem.

**Recommendation:** Add "What does portability success look like in 6 months?"
section. Operational test: "Clean Claude Code install on new machine runs
`/deep-research` without manual configuration." Work backward — does file
registry + scope tags achieve this, or is capability-manifest +
environment-lockfile required?

---

## C4: Option B Creates a Daemon It Claimed to Eliminate [MAJOR]

**Target claim:** "codegraph watch runs during development sessions" framed as
benefit, not cost.

**Steel-man:** `codegraph watch` is per-session npm process (not system
service), requires no admin, exits with terminal — categorically lighter than
Watchman.

**Challenge:** Research dismissed Watchman on grounds "persistent system daemon;
high solo-dev operational cost" (C-055). Then recommended `codegraph watch` as
feature. Both are long-running processes the user must start. Asymmetry
unjustified.

For JASON-OS 5+ projects: does watch cover all registered repos or just cwd?
Research doesn't clarify. If per-project: 5 processes to manage.

More critically: `@parcel/watcher getEventsSince` was chosen for daemon-free
architecture. Option B uses BOTH `codegraph watch` (live daemon) AND
`@parcel/watcher getEventsSince` (session snapshot). Architectural contradiction
— no coordination specified.

**Evidence:** C-055 rejects daemon; Option B pros celebrate watch daemon; C-060
zero-daemon advantage; both used in Option B without coordination; 29%
abandonment = "every new mechanism fully automated" — manual-start watch
violates.

**Recommendation:** Specify startup mechanism. Manual → add to cons. Claude Code
hook → add hook cost. npm script → describe. Current framing obscures
operational requirement.

---

## C5: MCP Ecosystem 0.07% Coverage — Negative Finding Is Time-Bound [MAJOR]

**Target claim:** C-082 HIGH confidence — "No composite hybrid system fully
satisfies all five requirements"

**Steel-man:** D8 searched 14 composites + 7 adjacent domain searches;
independent searchers reported same gaps; strong internal consistency for
negative finding.

**Challenge:** Research acknowledges MCP ecosystem has 21,000+ servers; D8
covered 14 = 0.07%. `@optave/codegraph` shipped 1 month pre-research. Similar
new tools may exist. More critically: five criteria defined by research team,
not user. Tool satisfying "workflow portability" with different abstraction
would fail matrix, false negative.

HIGH confidence on negative finding in incompletely sampled 21,000-server
ecosystem growing at MCP velocity is epistemically aggressive.

**Evidence:** Research appendix acknowledges incompleteness; D8 0.07% coverage;
codegraph age 1 month; C-082 HIGH confidence claim.

**Recommendation:** Downgrade C-082 to MEDIUM. Add: "Current as of April 2026;
re-check in 90 days. MCP ecosystem velocity makes negative findings ephemeral."

---

## C6: JASON-OS Scope Not Stable Enough to Build Registry Against [MAJOR]

**Target claim:** Option B assumes JASON-OS stable — "prioritizes home CC-OS
work as primary"

**Steel-man:** Brainstorm COMPLETE, 17 domains, 35 decisions. Shape defined
enough for tooling. Scope distinctions inherent in files regardless of final
JASON-OS shape.

**Challenge:** `upstreamProject:` field requires stable project boundaries.
`codegraph registry add` requires canonical JASON-OS project list. Neither
exists in memory files.

T28 Scope Drift precedent (project_t28_content_intelligence.md): "NEEDS
RE-SCOPING. Data layer research was scope drift." Current research itself
flagged as scope-drift risk. Building registry on actively re-scoping initiative
= layered instability.

JASON-OS consolidation 5→2 repos = stale `upstreamProject:` entries. Expansion
5→10 = 5 new registry additions + scope reclassifications. Maintenance burden
scales with architectural churn.

**Evidence:** project_jason_os.md "Domain 02a active";
project_t28_content_intelligence.md scope-drift precedent; no canonical JASON-OS
list exists; Option B requires project boundaries.

**Recommendation:** Define JASON-OS constituent project list as prerequisite.
Write to memory. Treat list changes as migration events with defined procedure.

---

## C7: The "Just Use Git" Path Was Not Evaluated [MAJOR]

**Target claim:** Research conclusion that custom build required.

**Steel-man:** Git lacks user-defined metadata tags, cross-project registry, MCP
query surface. `log --follow` works for moves but not semantic copies.
Portability needs intent, not just existence.

**Challenge:** Two questions the registry must answer:

1. "What changed since last session?" → `git diff HEAD@{1}` + `git status`
2. "Which files are portable?" → filename prefix (C-D7-NAMING HIGH confidence
   verified)

Neither requires new infrastructure. Custom JSONL + MCP tool + codegraph gives
third answer: "traverse file dep graph via MCP." But research never established
users need that interactively.

D6 evaluated chokidar/watchman/parcel/MCP but NOT git as change-detection
primary strategy. C-094 is only git mention — narrow gap (untracked files)
dismissed too quickly.

**Evidence:** C-D7-NAMING HIGH verified — scope detection free via prefixes;
C-094 narrow git dismissal; D6 home probe shows lockfile hash pattern
(git-adjacent) already works; no sub-question "can git + naming solve this
without new infrastructure?"

**Recommendation:** Add "Option D: git + filename convention + no
infrastructure" comparison. Per user need, show git capability vs Option B
delta. If delta = "interactive MCP graph queries," estimate usage frequency vs
build cost.

---

## C8: The 29% Abandonment Rate Is Not Addressed [MAJOR]

**Target claim:** Option B "build cost: Low to medium"

**Steel-man:** Code footprint small. JSONL sidecar readable without codegraph —
data portability preserved. Incremental scope authoring. Automation potential
acknowledged.

**Challenge:** 29% abandonment (PRIMARY CONSTRAINT) = "every new mechanism must
be fully automated." Option B has 5 manual mechanisms:

1. `codegraph registry add` per new project
2. `codegraph watch` startup per session
3. JSONL sidecar updates on file move/create
4. `scope:` frontmatter per new file
5. Session-start hook modification

All manual. T0 action flagged 18 days ago, not executed — the mechanism failed
before it was built.

Build cost must include automation layer. Without it: 200-400 lines MCP + hooks
for 5 mechanisms + maintenance at 89% growth rate. Not "low to medium."

**Evidence:** C-ML-2 verified; T0 18-day deferral = abandonment-before-start; V1
89% growth rate; Option B cost excludes automation; Cursor Memories failure mode
= too-manual OR too-automatic-without-gates, Option B has neither.

**Recommendation:** Define automation path for each of 5 mechanisms OR document
accepted abandonment risk. If automation not feasible, recommend Option A
(extend T28 SQLite) — lower abandonment risk because builds on
actively-maintained infrastructure.

---

## C9: The scope: Vocabulary Is Invented — Convergence ≠ Standard [MINOR]

**Target claim:** D7 HIGH confidence — "Five systems converge... strong implicit
consensus"

**Steel-man:** When five independent teams arrive at same 5-value enum, strong
prior. Building on convergent patterns beats single-vendor schema.

**Challenge:** Five systems use overlapping vocabulary for different semantics:

- Nx `scope:shared` = dependency rule
- chezmoi `.tmpl` = rendering mechanism
- VSCode `machine` = sync behavior
- XDG `$XDG_DATA_HOME` = directory convention
- Agent Skills install location = path convention

Not same concept. D7 Contradiction 1 acknowledges "Opposite defaults." Opposite
defaults ≠ shared vocabulary.

JASON-OS `scope:` will be a new standard coined by this research. In 6 months,
developer reading `scope: user` has no external reference. "Convergent
consensus" visible only to researcher.

**Evidence:** D7 Contradictions 1+2 show divergent defaults; C-069 "no academic
consensus schema"; V2 partial refutation of C-098 AGENTS.md; C-061 "no
cross-domain schema exists."

**Recommendation:** Keep `scope:` but narrow justification: "JASON-OS-internal
convention derived from pattern analysis; not interoperable with external
tools." More honest; sets correct expectations.

---

## C10: Session-Start Snapshot Breaks for Multi-Project JASON-OS [MAJOR]

**Target claim:** `@parcel/watcher getEventsSince` adequate for cross-project
use

**Steel-man:** Elegant: snapshot at session-end, diff at session-start. Mirrors
lockfile hash pattern. C-053 confirms sub-1s at hundreds of files.

**Challenge:** Snapshot is machine-local, session-scoped. For JASON-OS 5+
projects:

1. **Cross-locale sync**: project_cross_locale_config.md — "branch-specific
   artifacts not visible cross-locale." Snapshots written on Windows not visible
   from different locale. Registry intended cross-machine; mechanism inherently
   single-machine.

2. **Crash orphaning**: Force-termination = no snapshot written. Next session
   diffs against old snapshot, days/weeks stale. Registry floods with false
   positives. No recovery specified.

3. **Multi-project coordination**: 5 projects = 5 separate snapshot files.
   Session-start executes 5 calls, updates 5 registry segments. Conflicts when
   same file appears in multiple projects (universal skill in
   `~/.claude/skills/`)? Not addressed.

4. **Growth rate**: C-053 "1000 files <1s on SSD." 89% growth per 18 days →
   exceed 1000 files within weeks. Sub-1s guarantee disappears.

**Evidence:** project_cross_locale_config.md cross-locale absence; C-053
FindFirstFile O(n); C-093 "per-project daemon + shared SQLite with WAL" is
viable cross-project — implies zero-daemon is single-project; V1 89% growth; no
multi-project coordination in Option B architecture.

**Recommendation:** Explicitly scope snapshot pattern to single-project v1. For
multi-project, adopt C-093 pattern (per-project watcher daemon + shared SQLite
WAL) and revise "zero daemon" framing. Alternatively, document multi-project as
v2 concern.

---

## Sources

- [@optave/codegraph npm](https://www.npmjs.com/package/@optave/codegraph)
- [GitHub optave/codegraph](https://github.com/optave/codegraph)
- RESEARCH_OUTPUT.md + findings/V1, V2, D6, D7, D8 + claims.jsonl
