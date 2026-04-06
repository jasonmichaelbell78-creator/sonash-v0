# Orphan Detection — Decisions

| #   | Decision                     | Choice                                                                                | Rationale                                                                  |
| --- | ---------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Output format                | Script (`scripts/detect-orphans.js`), not a skill                                     | Diagnostic tool, not a workflow                                            |
| 2   | Graph storage                | In-memory per run                                                                     | Repo small enough for full rebuild; persisted graphs go stale              |
| 3   | Report format                | Both JSONL + Markdown                                                                 | JSONL for machine triage, Markdown for human review                        |
| 4   | Scope                        | All 9 categories, no deferrals                                                        | Scripts, Workflows, Hooks, State, Agents, Skills, Docs, Planning, Research |
| 5   | Text reference parsing       | Format-aware: regex for JS imports, regex for .md refs, JSON/YAML parsing for configs | Simple grep = too many false positives; full AST = overkill                |
| 6   | Confidence levels            | HIGH/MEDIUM/LOW per finding                                                           | archive/ = HIGH, recent git activity = LOW                                 |
| 7   | Triage output                | Proposed actions per item                                                             | delete / archive / wire-up / keep-as-standalone                            |
| 8   | Architecture                 | Script (detection) + agent orchestration (triage)                                     | Detection is deterministic & repeatable; triage benefits from AI judgment  |
| 9   | JS import parsing            | Regex for `require()` / `import` patterns                                             | Scripts are straightforward CJS/ESM, no dynamic imports                    |
| 10  | Skill/agent text patterns    | Slash-commands, backtick commands, agent names, markdown links, quoted paths          | Covers all known reference styles in .md files                             |
| 11  | State file ownership         | String-match state file basenames across all .js files                                | State files have no imports; only detectable via string literals           |
| 12  | Planning/research orphan def | Dir whose todo is completed/absent AND no active reference                            | Completed initiatives are archival, not broken references                  |
| 13  | npm script validation        | Yes, include dead npm script sub-check                                                | Explorer found dead workflow refs; same risk in package.json               |
| 14  | npm script names             | `orphans:detect` + `orphans:report`                                                   | Consistent with existing naming conventions                                |
| 15  | Output location              | `.planning/orphan-detection/findings.jsonl` + `REPORT.md`                             | Planning/maintenance artifact, not operational state                       |
| 16  | Resolution strategy          | Present fix options to resolve on the spot, no TDMS deferral                          | User wants immediate resolution, not debt tracking                         |
| 17  | Incremental runs             | Diff against previous JSONL — flag NEW/RESOLVED/UNCHANGED                             | Shows progress across cleanup passes                                       |
| 18  | Hook/session integration     | No for v1 — manual runs only                                                          | Can add to /alerts later if needed                                         |
| 19  | Agent triage scope           | One agent per category, parallel                                                      | Parallel keeps it fast; each agent scoped to its category                  |
| 20  | Archive strategy             | `scripts/archive/` for scripts, git-delete for everything else                        | Existing convention for scripts; git history suffices for others           |
