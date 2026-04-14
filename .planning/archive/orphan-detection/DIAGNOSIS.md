# Orphan Detection — Diagnosis

## ROADMAP Alignment

**Aligned (maintenance/health).** Not a feature on ROADMAP, but directly
supports project health. Session #263 doc-index check surfaced 1,879 orphaned
docs — this task generalizes that finding across all asset categories.

## Asset Inventory (Verified)

| Category             | Count                         | Reference locations                                 | Existing detection  |
| -------------------- | ----------------------------- | --------------------------------------------------- | ------------------- |
| Scripts (`scripts/`) | 177 non-test .js, 210 total   | package.json (122 npm scripts), hooks, imports      | None                |
| GitHub Workflows     | 17 .yml files                 | Push/PR triggers, cron, workflow_dispatch           | None                |
| Claude Hooks         | 20 .js handlers               | settings.json hook registrations                    | None                |
| State/Data files     | 113 files in `.claude/state/` | Scripts that read/write them                        | None                |
| Agent definitions    | 48 .md files                  | Skill prompts, CLAUDE.md agent table, system prompt | None                |
| Skill definitions    | 70 directories                | generate-skill-registry.js validates                | Partial (registry)  |
| Docs                 | 354 in docs/                  | Cross-references, skills, CLAUDE.md                 | check-docs-light.js |
| Planning artifacts   | ~260 files in .planning/      | Todos, skills that consume plans                    | None                |
| Research artifacts   | ~517 files in .research/      | Deep-plan Phase 0 checks for prior research         | None                |

## Cross-Format Reference Graph

The core challenge is that references span multiple formats and aren't just JS
imports. The full reference graph includes:

| Source format             | Reference style               | Example                                                |
| ------------------------- | ----------------------------- | ------------------------------------------------------ |
| Script → Script           | `require()` / `import`        | `require('../lib/sanitize-error.js')`                  |
| package.json → Script     | npm script value              | `"debt:report": "node scripts/debt/report.js"`         |
| Hook config → Handler     | settings.json `command` field | `"node .claude/hooks/session-start.js"`                |
| Skill → Skill             | Text name in .md              | "use `/deep-plan`", "invoke `/brainstorm`"             |
| Skill → Agent             | Text name in .md              | "spawn `security-auditor` agent"                       |
| Skill → Script            | Inline bash in .md            | "run `node scripts/planning/render-todos.js`"          |
| Agent → Agent             | Text in agent .md             | References to other agents to spawn                    |
| CLAUDE.md → Skills/Agents | Section 7 trigger table       | Skill and agent names in trigger rows                  |
| Workflow → Script         | `run:` steps in YAML          | `node scripts/check-pattern-compliance.js`             |
| Docs → Docs               | Markdown links                | `[CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md)` |
| Docs → Scripts            | Inline references             | "run `npm run patterns:check`"                         |

**Implication:** Orphan detection requires a multi-parser approach — JS AST for
imports, JSON/YAML parsers for configs, and text/regex scanning for .md files. A
single grep won't cover all formats.

## Key Observations

1. **Text references are the hard part** — JS imports are parseable, but skill
   .md files reference other skills, agents, and scripts in free-form prose.
   False positives are likely (e.g., a skill mentioned in a "When NOT to Use"
   section is still a valid reference).

2. **Scripts are the biggest category** — 177 non-test source files, only 122
   npm scripts reference them. Many scripts call each other via require/import,
   so "not in package.json" ≠ orphaned. Need transitive reference tracing.

3. **State files are opaque** — 113 files with no dependency manifest. Scripts
   read/write them but there's no registry of which script owns which state
   file.

4. **Agents have layered references** — 48 agent .md files defined. Referenced
   by: system prompt agent list, skill text, CLAUDE.md Section 7, and other
   agents. An agent with zero references across all four is truly orphaned.

5. **Skills have a registry** — generate-skill-registry.js validates skill
   config, but doesn't check whether any other skill/agent/doc references them.

6. **Docs already partially covered** — Session #263 surfaced 1,879 orphaned
   docs. This plan should build on that finding.

7. **Planning/research are historical artifacts** — "orphan" here means
   "initiative completed, artifacts no longer useful" — archival, not broken.

## Reframe Check

**This is a cross-format reference graph problem.** The naive approach (grep for
filenames) misses text references in .md files and produces false positives. The
real deliverable is a **multi-parser orphan scanner** that builds a unified
reference graph across JS, JSON, YAML, and Markdown, then reports nodes with
zero incoming edges as orphan candidates for triage.

Scripts remain highest-value (177 files, no detection). But the text-reference
layer (skills↔agents↔scripts) is what makes this non-trivial and where
cross-format detection matters most.

The 1,879 doc orphans from Session #263 were already surfaced — this plan should
build on that finding, not re-detect.
