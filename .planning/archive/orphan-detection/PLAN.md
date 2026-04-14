# Orphan Detection — Implementation Plan

**Task:** T21 — Orphan file/script/action search and repair **Decisions:**
[DECISIONS.md](./DECISIONS.md) **Effort:** L (multi-session — script build +
triage execution)

---

## Step 1: Scaffold script structure

Create `scripts/detect-orphans.js` with category-based architecture.

**Files:** `scripts/detect-orphans.js`, `scripts/render-orphan-report.js`

**Implementation:**

- Main entry point dispatches to category scanner functions
- Each category scanner returns
  `{ file, category, references: [], confidence, proposedAction, reason }`
- Results collected into unified findings array
- Write findings to `.planning/orphan-detection/findings.jsonl`
- Add `orphans:detect` and `orphans:report` to package.json scripts

**Structure:**

```js
// scripts/detect-orphans.js
const categories = [
  scanScripts,
  scanWorkflows,
  scanHooks,
  scanStateFiles,
  scanAgents,
  scanSkills,
  scanDocs,
  scanPlanning,
  scanResearch,
];
```

**Done when:** Script runs, outputs empty JSONL, exits 0. Both npm scripts
registered.

---

## Step 2: Build the reference graph collector

Build the cross-format reference extraction layer that all category scanners
share.

**Files:** `scripts/lib/reference-graph.js`

**Implementation:**

- `collectJsReferences(dir)` — regex scan for `require('...')` and
  `import ... from '...'` across all .js files. Returns Map<filePath,
  Set<referencedPath>>.
- `collectMdReferences(dir)` — regex scan .md files for:
  - Slash-commands: `/skill-name`
  - Backtick commands: `` `node scripts/path.js` ``
  - Agent names: `subagent_type=name`, `subagent_type="name"`, `spawn X agent`
  - Markdown links: `[text](relative/path)`
  - Quoted paths: `"scripts/foo.js"`, `'.claude/hooks/bar.js'`
- `collectJsonReferences(file)` — parse JSON files (settings.json, package.json)
  for path-like string values
- `collectYamlReferences(dir)` — parse .yml workflow files for `run:` step
  script references
- `buildGraph()` — merge all collectors into a unified
  `Map<targetFile, Set<sourceFile>>` (incoming edges per target)

Per Decision #5: format-aware parsing, not plain grep. Per Decision #9: regex
for JS imports, not AST.

**Done when:** `buildGraph()` returns a Map. Manual spot-check: pick 3
known-referenced files, verify they have incoming edges; pick 1 known-orphan,
verify zero edges.

---

## Step 3: Implement category scanners — Scripts

**Files:** `scripts/detect-orphans.js` (scanScripts function)

**Implementation:**

- List all .js files in `scripts/` (excluding node_modules, dist, **tests**)
- For each file, check incoming edges from the reference graph
- Also check: package.json scripts values, hook config commands
- Per Decision #13: validate npm scripts reference existing files (dead script
  sub-check)
- Per Decision #6: confidence heuristics:
  - In `scripts/archive/` → HIGH confidence orphan
  - Zero incoming edges + no git activity 90 days → HIGH
  - Zero incoming edges + recent git activity → MEDIUM
  - Referenced only by tests → LOW (may be test-only utility)
- Per Decision #7: propose action — delete / archive / keep-as-standalone

Per Decision #11: also scan script files for state file basename strings (feeds
Step 6).

**Done when:** `scanScripts()` returns findings array. Spot-check 5 findings for
correctness.

---

## Step 4: Implement category scanners — Hooks & Workflows

**Files:** `scripts/detect-orphans.js` (scanHooks, scanWorkflows functions)

**Implementation:**

**Hooks:**

- List all .js files in `.claude/hooks/` (excluding lib/, backup/)
- Cross-reference with settings.json hook registrations (command fields)
- Unregistered handlers with no incoming edges = orphan candidates
- Separately flag `backup/` files as HIGH confidence orphans
- Flag `lib/` utilities: check if imported by any registered handler

**Workflows:**

- List all .yml in `.github/workflows/`
- Parse each for `run:` steps that reference `scripts/` or `node` commands
- Cross-check referenced scripts exist on disk
- Flag workflows with no trigger events or disabled triggers
- Per Decision #13: report dead references (script referenced but missing)

**Done when:** Both scanners return findings. Verify against known facts:
explorer found 2 dead workflow refs, 12 unregistered hook handlers.

---

## Step 5: Implement category scanners — Agents & Skills

**Files:** `scripts/detect-orphans.js` (scanAgents, scanSkills functions)

**Implementation:**

**Agents:**

- List all .md files in `.claude/agents/` and `.claude/agents/global/`
- For each agent, check incoming edges from reference graph:
  - Referenced in skill .md files (subagent_type, spawn mentions)
  - Referenced in CLAUDE.md Section 7
  - Referenced by other agent definitions
- Agents with zero references across all sources = orphan candidates
- Note: system prompt agent list is runtime, not scannable — flag agents not in
  any .md reference as MEDIUM confidence

**Skills:**

- List all directories in `.claude/skills/`
- For each skill, check:
  - Referenced by other skills (slash-command mentions in .md)
  - Referenced in CLAUDE.md Section 7
  - Referenced in agent definitions
  - Has entry in skill registry (generate-skill-registry.js output)
- Skills with zero cross-references AND not in CLAUDE.md = orphan candidates

Per Decision #10: text pattern matching for slash-commands, agent names.

**Done when:** Both scanners return findings. Verify: agents known to be
pipeline-only (deep-research-\*) should NOT be flagged as orphans (referenced by
deep-research skill).

---

## Step 6: Implement category scanners — State files

**Files:** `scripts/detect-orphans.js` (scanStateFiles function)

**Implementation:**

- List all files in `.claude/state/`
- For each file, search for its basename string across:
  - All .js files in `scripts/` and `.claude/hooks/`
  - All .md files in `.claude/skills/`
  - settings.json
- Per Decision #11: string-matching for basenames
- Per Decision #6: confidence heuristics:
  - Zero references anywhere → HIGH
  - Referenced only in one script that is itself an orphan → HIGH
  - Deep-plan/brainstorm state files for completed topics → MEDIUM (check
    against todos.jsonl)
- Exclude well-known operational files from false-positive: reviews.jsonl,
  consolidation.json, learning-routes.jsonl

**Done when:** Scanner returns findings. Spot-check: `reviews.jsonl` should have
references, random `deep-plan.*.state.json` for completed topics should be
flagged.

---

## Step 7: Implement category scanners — Docs, Planning, Research

**Files:** `scripts/detect-orphans.js` (scanDocs, scanPlanning, scanResearch
functions)

**Implementation:**

**Docs:**

- List all .md files in `docs/`
- Check incoming edges from reference graph (markdown links, CLAUDE.md refs,
  skill refs)
- Build on Session #263 finding (1,879 orphans) — verify count, don't re-detect
  from scratch
- Confidence: no incoming edges + not in any index/TOC → HIGH

**Planning:**

- List all directories in `.planning/`
- Per Decision #12: check if corresponding todo in todos.jsonl is completed or
  absent
- Cross-check if any active skill or plan references the directory
- Completed + unreferenced = MEDIUM confidence archival orphan

**Research:**

- List all directories in `.research/`
- Same logic as planning: check todo status, active references
- Research consumed by a shipped skill/plan = completed, candidate for cleanup

Per Decision #12: orphan = completed/absent todo AND no active reference.

**Done when:** All three scanners return findings. Planning/research findings
should mostly be archival candidates, not broken references.

---

## Step 8: Git recency signal

**Files:** `scripts/lib/reference-graph.js` (add `getGitRecency` function)

**Implementation:**

- For each file in findings, run `git log -1 --format=%aI -- <file>` to get last
  modification date
- Compute days since last modification
- Feed into confidence scoring per Decision #13:
  - 90+ days no activity → boost confidence by one level
  - <30 days activity → reduce confidence by one level
- Add `lastModified` and `daysSinceModified` fields to each finding

**Done when:** All findings have git recency data. Verify: recently created
files should have low daysSinceModified.

**Depends on:** Steps 3-7 (needs findings to annotate)

---

## Step 9: Incremental diff support

**Files:** `scripts/detect-orphans.js` (add diff logic)

**Implementation:**

- Per Decision #17: before writing new findings.jsonl, read previous version if
  it exists
- Compare by file path: findings in new but not old = `NEW`, in old but not new
  = `RESOLVED`, in both = `UNCHANGED`
- Add `diffStatus` field to each finding
- Summary line: "N new orphans, M resolved, K unchanged since last run"

**Done when:** First run marks all as NEW. Second run (after no changes) marks
all as UNCHANGED.

---

## Step 10: Markdown report generator

**Files:** `scripts/render-orphan-report.js`

**Implementation:**

- Read `.planning/orphan-detection/findings.jsonl`
- Group by category, sort by confidence (HIGH first)
- Render table per category:
  ```
  | File | Confidence | Proposed Action | Reason | Last Modified |
  ```
- Summary section: total findings, by category, by confidence level
- Diff section (if available): new/resolved counts
- Write to `.planning/orphan-detection/REPORT.md`

**Done when:** `npm run orphans:report` produces readable Markdown. Tables
render correctly.

---

## Step 11: Integration test — full run

Run `npm run orphans:detect` end-to-end against the actual repo.

**Verification:**

- Script exits 0
- findings.jsonl has entries across all 9 categories
- REPORT.md is readable and tables are well-formed
- Spot-check 10 findings across categories for correctness:
  - 2 scripts, 1 workflow, 1 hook, 1 state file, 1 agent, 1 skill, 1 doc, 1
    planning, 1 research
- No false positives for known-active files (e.g., `sanitize-error.js`,
  `detect-orphans.js` itself)
- Dead npm script sub-check catches any missing files

**Done when:** Full run completes, findings verified, no obvious false
positives.

---

## Step 12: Agent triage execution

After the script produces findings, dispatch parallel agents to classify and
propose resolutions.

**Implementation:**

- Per Decision #19: one agent per category, dispatched in parallel
- Each agent receives: category findings JSONL, category context (what files do
  in this category)
- Agent reviews each finding and either confirms or overrides the script's
  proposed action
- Agent outputs: refined findings with `triageAction` and `triageReason` fields
- Merge agent outputs back into findings.jsonl, regenerate REPORT.md

**Agent prompt template:**

```
You are reviewing orphan detection findings for the [CATEGORY] category.
For each finding, confirm or override the proposed action:
- DELETE: file is truly unused, safe to remove
- ARCHIVE: file has historical value, move to archive location
- WIRE-UP: file is useful but unreferenced, add reference
- KEEP: file is standalone by design (manual-run utility, reference doc)
- REVIEW: uncertain, needs human judgment

Provide a one-line reason for each decision.
```

**Done when:** All 9 category agents complete. Findings updated with triage
decisions. REPORT.md regenerated with triage column.

---

## Step 13: Interactive resolution

Present triage results to the user for fix-on-the-spot resolution.

**Implementation:**

- Per Decision #16: no TDMS deferral — resolve immediately
- Walk through findings by category, HIGH confidence first
- For each finding, present: file, confidence, proposed action, agent triage,
  reason
- User confirms or overrides
- Execute confirmed actions:
  - DELETE: `git rm <file>` (or `rm` for untracked)
  - ARCHIVE (scripts): `git mv <file> scripts/archive/`
  - ARCHIVE (other): `git rm <file>` per Decision #20
  - WIRE-UP: add reference where appropriate
  - KEEP: mark as intentionally standalone (add to exclusion list)
- Batch commits by category

**Done when:** All findings triaged and resolved. Orphan count reduced.

---

## Step 14: Audit checkpoint

Run code-reviewer on all new/modified files.

**Files to review:** `scripts/detect-orphans.js`,
`scripts/render-orphan-report.js`, `scripts/lib/reference-graph.js`,
`package.json`

**Checks:**

- Pattern compliance (sanitize-error, path traversal, file read try/catch)
- No security issues in file path handling
- Code follows existing script conventions

**Done when:** Code review passes with no blocking issues.

---

## Parallelization Notes

- **Steps 3-7 can be developed in parallel** (independent category scanners)
- **Step 8 depends on Steps 3-7** (needs findings to annotate)
- **Step 12 agents run in parallel** (one per category)
- **Step 13 is sequential** (interactive user resolution)

## Execution Route

Per Decision #8: Steps 1-11 are script development (manual or subagent
execution). Step 12 is agent orchestration. Step 13 is interactive.

Recommended: **Subagent-driven for Steps 1-11** (independent code tasks), then
**interactive for Steps 12-13**.
