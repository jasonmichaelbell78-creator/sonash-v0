# Research Plan: Dev Dashboard Command Center

**Created:** 2026-03-27 (Session #243) **Status:** APPROVED — awaiting execution
**Prior research:** `.research/debt-runner-expansion/` (consumed as input)

## Vision

Transform the dev dashboard from 5 placeholder tabs into a fully operational
back-of-house command center. Each tab follows the debt tab pattern: rich web
visualization + smooth CLI handoff. The admin page handles app-facing concerns;
the dev dashboard handles build pipeline and development process.

## Settled Decisions (from Session #243 Q&A)

| #   | Decision          | User Direction                                                   |
| --- | ----------------- | ---------------------------------------------------------------- |
| D1  | Lighthouse tab    | Moves to admin panel post-M1.6, not a dev tab                    |
| D2  | Tab selection     | NOT pre-decided — research discovers what tabs should be         |
| D3  | Track B (B6-B11)  | NOT assumed valid — research evaluates against current landscape |
| D4  | Admin vs Dev      | Admin = app + users. Dev = build pipeline + dev process          |
| D5  | Scope             | All potential tabs researched, not just top 4-5                  |
| D6  | Research output   | One unified report, integrating debt-runner research             |
| D7  | CLI handoff       | Every tab gets web→CLI handoff (clipboard commands)              |
| D8  | Data architecture | Hybrid fetch from debt research (API dev, static prod)           |
| D9  | Desktop only      | Same constraint as admin panel                                   |
| D10 | Agent sizing      | Agents sized to avoid context exhaustion — max 13 files each     |

## Research Phases

### Wave 1: Discovery (13 agents)

| Agent  | Scope                                                                                                                                                | Files to Read                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SQ1a-1 | Audit skills (13 audit-\* skills)                                                                                                                    | 13 SKILL.md                                     |
| SQ1a-2 | Ecosystem audit skills (8 \*-ecosystem-audit)                                                                                                        | 8 SKILL.md                                      |
| SQ1a-3 | Operational skills A-M (debt-runner, deep-plan, deep-research, docs-maintain, ecosystem-health, alerts, checkpoint, code-reviewer, convergence-loop) | 9 SKILL.md                                      |
| SQ1a-4 | Operational skills N-Z (pr-review, pr-retro, pre-commit-fixer, session-begin, session-end, skill-audit, sonarcloud, system-test, skill-creator)      | 9 SKILL.md                                      |
| SQ1a-5 | Remaining skills (add-debt, gh-fix-ci, quick-fix, doc-optimizer, find-skills, etc.)                                                                  | ~10 SKILL.md                                    |
| SQ1b   | Data source inventory update                                                                                                                         | state-file-inventory.md + data-dir-inventory.md |
| SQ1c-1 | Process mapping: debt management + review lifecycle                                                                                                  | Workflow docs + scripts                         |
| SQ1c-2 | Process mapping: session lifecycle + hook compliance                                                                                                 | Workflow docs + hooks                           |
| SQ1c-3 | Process mapping: health monitoring + ecosystem audits + doc maintenance                                                                              | Health scripts + audit skills                   |

Each agent reports: skill name, data produced (paths + format), what it
represents, CLI-only vs persistent, web dashboard relevance (HIGH/MEDIUM/LOW),
natural grouping affinity.

### Wave 2: Analysis + Boundary (4 agents)

| Agent | Purpose                                                                          |
| ----- | -------------------------------------------------------------------------------- |
| SQ2a  | Grouping analysis: read ALL Wave 1 findings, propose tab groupings with evidence |
| SQ2b  | Grouping analysis: alternative groupings, challenge SQ2a's proposals             |
| SQ3a  | Admin vs Dev boundary: read admin components, classify what belongs where        |
| SQ3b  | Track B evaluation: read ROADMAP.md B6-B11, compare against Wave 1 findings      |

Output: 2-3 grouping OPTIONS (not decisions) with pros/cons for each.

### ═══ USER CHECKPOINT ═══

Present grouping options. User decides:

- Which groups become tabs
- What merges, what's cut, what's new
- Priority ordering

### Wave 3: Per-Group Deep-Dives (6-10 agents)

2 agents per approved group:

- Agent A: Data analysis + capability design (what can this tab show?)
- Agent B: CLI handoff design + gap analysis (what's missing?)

### Wave 4: Infrastructure + Gaps + Integration (7 agents)

| Agent | Purpose                                                                            |
| ----- | ---------------------------------------------------------------------------------- |
| SQ5a  | Shared infrastructure: hybrid fetch, component library                             |
| SQ5b  | Shared infrastructure: TanStack Table, Recharts, MiniSearch patterns               |
| SQ6a  | Gap analysis: data gaps per approved group                                         |
| SQ6b  | Gap analysis: skill gaps (what skills need new persistent output?)                 |
| SQ6c  | Gap analysis: process gaps (what workflows have no web visibility?)                |
| SQ7a  | Debt research integration: reconcile 941-line report into unified plan             |
| SQ7b  | Debt research integration: verify debt-tab decisions still hold in unified context |

### Post-Research Phases

| Phase                             | Agents    |
| --------------------------------- | --------- |
| Synthesis                         | 2         |
| Verification (L1)                 | 3         |
| Challenges (2 contrarian + 2 OTB) | 4         |
| Dispute resolution                | 2         |
| Re-synthesis (if >20% changed)    | 1         |
| **Total**                         | **38-47** |

## Output

```
.research/dev-dashboard/
  findings/           # per-agent findings
  challenges/         # contrarian + OTB
  RESEARCH_OUTPUT.md  # unified report
  claims.jsonl        # machine-parseable claims
  sources.jsonl       # source registry
  metadata.json       # session metadata
```

## Context from This Session

### Admin Panel (fully built, 14 tabs)

- System: Dashboard, Users, Privileges, Jobs, Errors (Sentry), Logs (GCP),
  Analytics
- Content: Meetings, Sober Living, Daily Quotes, Slogans, Quick Links, Prayers,
  Glossary
- Auth: Google OAuth + admin custom claim, desktop-only

### Dev Dashboard (1 real tab, 4 placeholders)

- Lighthouse (implemented — MOVING to admin)
- Errors, Sessions, Docs, Overrides (placeholders)
- Same auth gate as admin

### Data Landscape (from inventory agents)

- 34 state files in .claude/state/ (18 HIGH web relevance)
- 33 data files in data/ and docs/technical-debt/ (9 HIGH)
- 50+ skills with varying data output
- 70+ total persistent data files

### Debt Tab (fully researched)

- 941-line RESEARCH_OUTPUT.md at .research/debt-runner-expansion/
- Hybrid fetch architecture (API in dev, static JSON in prod)
- TanStack Table + Recharts + MiniSearch
- 4-phase implementation, 6 bugs to fix first
- 3 discovery agents, guided mode default

### Key Constraints

- `output: "export"` — static SPA, no API routes in prod
- Dev mode has API routes (hybrid fetch works)
- Desktop-only, admin-gated
- No Firebase for bulk data — localStorage for annotations
- Field-stripped static JSON (~2 MB for debt, ceiling 5 MB)
- Work locale has no admin access (portable installs only)
