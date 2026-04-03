# Standard Analysis: HKUDS/CLI-Anything

**Scan Date:** 2026-04-03 | **Depth:** Standard (clone + static) | **Repo Age:**
26 days | **Files:** 796 (561 Python, 170 Markdown)

> CLI-Anything: Making ALL Software Agent-Native. A monorepo of 33 CLI harnesses
> from HKU Data Science lab that wrap desktop software (Blender, GIMP,
> LibreOffice, FreeCAD, etc.) for AI agent consumption via standardized
> command-line interfaces.

---

## Summary Bands

| Dimension       | Band           | Score | Change from Quick Scan |
| --------------- | -------------- | ----- | ---------------------- |
| Security        | **Needs Work** | (58)  | +20 (code is solid)    |
| Reliability     | **Healthy**    | (70)  | +18 (tests are real)   |
| Maintainability | **Healthy**    | (76)  | +2                     |
| Documentation   | **Excellent**  | (82)  | +4 (HARNESS.md boost)  |
| Process         | **Needs Work** | (48)  | -7 (CI gap confirmed)  |
| Velocity        | **Excellent**  | (95)  | --                     |

**Key shift from Quick Scan:** Code quality is significantly better than API
signals suggested. The gaps are in CI/process, not in the code itself.

---

## Key Stats

| Metric           | Value                                   |
| ---------------- | --------------------------------------- |
| Stars            | 27,518 (~1,058/day)                     |
| Forks            | 2,569                                   |
| Contributors     | 44 in 26 days                           |
| CLI Harnesses    | 33 in registry, 31 with tests           |
| Categories       | 19 (AI, video, image, office, 3D, etc.) |
| Test Functions   | 2,707 (1,854 unit + 740 e2e)            |
| Subprocess Calls | 122 (0 shell=True)                      |
| License          | Apache-2.0                              |
| Language         | Python 95.5%                            |
| CI Workflows     | 1 (GitHub Pages deploy only)            |
| Releases         | 1 (v0.2.0)                              |

---

## Findings (13 total)

### High Severity (2)

1. **F001: No SAST for subprocess-heavy codebase.** 122 subprocess calls, 0
   shell=True today. But no CI gate prevents regressions. Community PRs accepted
   with Copilot review only.

2. **F002: 2,707 tests exist but no CI runs them.** Tests are real,
   well-structured, use synthetic data. But no workflow enforces them.
   Developer-honor-system only.

### Medium Severity (5)

3. **F003: Security mitigations code-level only.** Real protections exist
   (allowlists, no shell=True, Click.Path). But no CI enforcement for
   regressions.

4. **F004: Immature release cadence.** Only 1 release in 26 days.

5. **F005: Bus factor on merge authority.** Single maintainer handles most
   merges.

6. **F006: Inconsistent credential handling.** AdGuardHome stores passwords in
   JSON config. Others use env vars. No shared standard.

7. **F007: No monorepo coordination.** 33 independent harnesses with no shared
   test runner, CI matrix, or quality gates.

### Low Severity (3)

8. **F008: Code reuse via copy-paste.** repl_skin.py copied 31+ times.

9. **F009: Missing Code of Conduct.**

10. **F010: Incomplete type hints.** No mypy/pyright/ruff configuration.

### Positive Findings (3)

11. **F012: Subprocess safety is genuinely strong.** 0 shell=True across 122
    calls. Arguments always as lists. Codec allowlists. Click.Path validation.

12. **F013: HARNESS.md is a novel methodology.** 7-phase SOP with concrete code
    examples. Genuine contribution to agent tooling ecosystem.

13. **F011: Viral growth at 1,058 stars/day.** Outpacing governance maturity.

---

## Absence Patterns (Updated)

| Pattern         | Confidence | Standard Revision                                 |
| --------------- | ---------- | ------------------------------------------------- |
| SECURITY_FACADE | Medium     | Downgraded -- code has real mitigations, CI lacks |
| TEST_THEATER    | Low        | Downgraded -- 2,707 real tests, CI gap only       |

---

## Architecture Overview

**Structure:** Each of 33 harness directories follows a consistent pattern:

```
<software>/
  agent-harness/
    setup.py
    cli_anything/<software>/
      <software>_cli.py    # Click CLI entry point
      core/                # Business logic (synthetic-testable)
      utils/               # Backend wrapping (subprocess)
      skills/SKILL.md      # AI-discoverable skill definition
      tests/
        test_core.py       # Unit tests (no backend needed)
        test_full_e2e.py   # E2E tests (backend required)
```

**Plugin System:** `cli-anything-plugin/` contains the HARNESS.md methodology,
`skill_generator.py` scaffolding, `repl_skin.py` shared UI, and templates.
`.claude-plugin/marketplace.json` registers as a Claude Code plugin.

**Key Design Decisions:**

- Copy-and-customize over shared library (each harness is self-contained)
- Click as universal CLI framework
- JSON as machine output, tables as human output (--json flag)
- Stateful REPL + stateless subcommands (both modes)
- Synthetic test data (no backends needed for unit tests)

---

## Value Extraction Candidates (7)

| Rank | Candidate                   | Novelty | Portability | Effort |
| ---- | --------------------------- | ------- | ----------- | ------ |
| 1    | HARNESS.md Methodology      | High    | 14/15       | E0     |
| 2    | SKILL.md Format             | High    | 12/15       | E0     |
| 3    | ReplSkin Terminal UI        | Medium  | 10/15       | E1     |
| 4    | Registry + CLI-Hub Pattern  | Medium  | 13/15       | E1     |
| 5    | Codec Allowlist Pattern     | Low     | 8/15        | E0     |
| 6    | Skill Generator Scaffolding | Medium  | 6/15        | E2     |
| 7    | Claude Plugin Marketplace   | High    | 14/15       | E0     |

---

## Overall Assessment

CLI-Anything is a **high-velocity, well-architected project with a significant
CI/process gap.** The code itself is better than initial API signals suggested
-- subprocess safety is genuinely strong, tests are real and substantial, and
the HARNESS.md methodology is a novel contribution. The primary risks are:

1. **CI gap:** 2,707 tests + 122 subprocess calls with no automated enforcement
2. **Governance speed:** Growth (27.5k stars, 44 contributors) outpacing process
3. **Copy-paste debt:** Shared components duplicated across 31+ harnesses

For dependency evaluation: **Adopt with awareness.** The code quality is solid
for individual harnesses. Pin to specific commits rather than branches until
release cadence matures. The methodology (HARNESS.md, SKILL.md format) is highly
portable and worth studying regardless of adoption.
