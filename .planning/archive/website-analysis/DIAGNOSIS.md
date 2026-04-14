# Diagnosis: Website-Analysis Skill

**Date:** 2026-04-06 **Task:** Implement `/website-analysis` skill — a
creator-first website analysis tool modeled after `/repo-analysis` but designed
for web content.

## ROADMAP Alignment

**New Direction** — No ROADMAP.md entry exists for website-analysis. Brainstorm
confirmed "No ROADMAP.md entry. Net-new. No conflict." Aligns with the JASON-OS
vision (Domain 02a: External Adoption Scouting) as a natural sibling to
`/repo-analysis` for web sources.

## Research Context

**Deep research complete:** 39 agents, 175 claims, 28 findings files in
`.research/website-analysis/`. Key artifacts:

- `BRAINSTORM.md` — Direction established: hybrid skill, 4 modes, Creator View
  priority
- `RESEARCH_OUTPUT.md` — 1,856-line comprehensive design spec covering
  extraction pipeline, Creator View (7 sections, 13 value axes), compliance
  gates, Expedition Mode, cross-site synthesis, storage architecture
- `S1-chrome-builtin.md` — Built-in `/chrome` command: POOR as primary (no
  headless, 30s timeout, Windows bug), viable as auth fallback only
- `S2-superpowers-chrome.md` — `superpowers-chrome` plugin: STRONG complement.
  Auto-captures 4 artifacts per navigate (HTML, Markdown, screenshot, console).
  Headless, zero-dep, CDP escape hatch. Currently disabled at v1.6.1 (latest
  v1.8.0).

## Relevant Existing Systems

| System               | Relationship                    | Pattern to Follow                               |
| -------------------- | ------------------------------- | ----------------------------------------------- |
| `/repo-analysis`     | Direct sibling — same lens      | Dual-lens, phase-based, state file, prose style |
| `/repo-synthesis`    | Cross-entity synthesis model    | Thematic synthesis, N>=3 entities               |
| `.research/`         | Shared output location          | Same directory structure, research-index.jsonl  |
| `SKILL_STANDARDS`    | Governance                      | <300 lines, version history, MUST/SHOULD/MAY    |
| `superpowers-chrome` | Extraction tool (newly enabled) | MCP mode auto-capture, CDP access               |
| Playwright MCP       | Alternative extraction          | Accessibility tree, auth state, heavier tokens  |
| WebFetch             | Lightweight fetch               | Static content, robots.txt, metadata            |

## Reframe Check

The task IS what it appears to be: a skill implementation. The research and
brainstorm established the design space thoroughly. The supplemental research on
`superpowers-chrome` adds a significant new extraction option not in the
original research — the auto-capture pattern (4 artifacts per navigate) could
simplify the extraction pipeline considerably compared to the multi-tool
pipeline originally designed (trafilatura + Readability + Turndown).

**Key reframe consideration:** The original research designed a Python-heavy
extraction pipeline (trafilatura is Python). `superpowers-chrome` offers a
zero-dependency Node.js-native alternative that produces Markdown directly. This
could eliminate the Python dependency entirely for v1.

**Recommendation:** Proceed as stated, but the discovery phase should resolve
the extraction pipeline question: original multi-tool (Python + Node) vs.
superpowers-chrome-first (Node-only) vs. hybrid.
