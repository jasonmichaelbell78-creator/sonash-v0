# Deep Read: teng-lin/notebooklm-py

**Date:** 2026-04-06 | **Skill Version:** 4.2

## Artifact Discovery

255 files. 47 Python source files, 89 test files, 19 Markdown docs. Rich
internal documentation.

| Artifact                     | Read?                   | Knowledge Beyond Code                                                                                                                     |
| ---------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| CLAUDE.md                    | Yes                     | Architecture overview, dev commands, pre-commit checks, PR workflow. Well-structured agent guidance.                                      |
| AGENTS.md                    | Yes                     | Codex/parallel agent notes. Module organization, testing split (unit/integration/e2e).                                                    |
| SKILL.md (~250 lines)        | Yes                     | Full skill definition with Autonomy Rules section, workflow examples, embedded Task() subagent patterns.                                  |
| CONTRIBUTING.md              | Not read                | Contribution guidelines.                                                                                                                  |
| CHANGELOG.md                 | Not read                | Release history.                                                                                                                          |
| SECURITY.md                  | Not read                | Security policy.                                                                                                                          |
| docs/ (10 files)             | Not read                | cli-reference, configuration, development, examples/, python-api, releasing, rpc-development, rpc-reference, stability, troubleshooting.  |
| .github/workflows/ (8 files) | Read 1 (rpc-health.yml) | 8 CI workflows: codeql, nightly, publish, rpc-health, test, testpypi-publish, verify-artifacts, verify-package.                           |
| src/notebooklm/cli/skill.py  | Yes (50 lines)          | Skill install mechanism: reads SKILL.md from package data, writes to ~/.claude/skills/ and ~/.agents/skills/. Version stamping via regex. |
| .pre-commit-config.yaml      | Not read                | Pre-commit hooks configuration.                                                                                                           |
| scripts/ (2 files)           | Not read                | check_rpc_health.py, diagnose_get_notebook.py.                                                                                            |

## Key Findings From Deep Read

1. **SKILL.md Autonomy Rules section** (lines 94-128) — Structured split of
   every command into "Run automatically" vs "Ask before running" with one-line
   reasons. This is the pattern identified in v4.1 extraction as a retrofit
   candidate for sonash skills. Now confirmed: 22 auto-run commands, 7 ask-first
   commands.

2. **skill.py install mechanism** — `SkillTarget` dataclass defines install
   paths: `.claude/skills/notebooklm/SKILL.md` and
   `.agents/skills/notebooklm/SKILL.md`. Version stamping extracts version from
   HTML comment in SKILL.md header. `notebooklm skill install` and
   `notebooklm skill status` manage lifecycle.

3. **`npx skills add` reference** — SKILL.md line 29: "npx skills add
   teng-lin/notebooklm-py installs this skill from the GitHub repository." This
   suggests a real "open skills ecosystem" CLI tool. Still unverified — flagged
   as investigate in v4.1 extraction.

4. **CLAUDE.md PR Workflow** — Embedded 4-step PR workflow: monitor CI → check
   reviews → fix + reply with SHA → verify mergeStateStatus CLEAN. Ambient
   guidance vs invoked skill.

5. **rpc-health.yml** — Daily cron at 7 AM UTC. Runs check_rpc_health.py against
   live Google APIs. Auto-creates GitHub issues with
   `bug/rpc-breakage/automated` labels on mismatch. Auto-creates different issue
   on auth failure. 3 exit codes (0=healthy, 1=rpc-mismatch, 2=auth-failure).
   Reports uploaded as artifacts with 30-day retention.

6. **8 CI workflows** — The most CI-mature repo in all 6 analyzed. CodeQL,
   nightly tests, PyPI publish, TestPyPI publish, RPC health, regular tests,
   artifact verification, package verification. Production-grade CI.

## External References Cataloged for Phase 4b

- `npx skills add` ecosystem (unverified)
- Google NotebookLM (the wrapped service)
- arXiv papers referenced in codebase? (need to grep)
- CLI-Anything notebooklm harness (cross-repo: wraps this repo)
