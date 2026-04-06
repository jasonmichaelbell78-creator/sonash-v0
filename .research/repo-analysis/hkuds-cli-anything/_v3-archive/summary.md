# Standard Analysis: HKUDS/CLI-Anything (v2.0)

**Scan Date:** 2026-04-03 | **Depth:** Standard (clone + static) | **Skill
Version:** 2.0 | **Repo Age:** 26 days | **Files:** 796 (561 Python, 170 MD)

> CLI-Anything: Making ALL Software Agent-Native. A monorepo of 33 CLI harnesses
> from HKU Data Science lab wrapping desktop software (Blender, GIMP,
> LibreOffice, FreeCAD, etc.) for AI agent consumption.

---

## Summary Bands

| Dimension       | Band           | Score |
| --------------- | -------------- | ----- |
| Security        | **Needs Work** | (58)  |
| Reliability     | **Healthy**    | (70)  |
| Maintainability | **Healthy**    | (76)  |
| Documentation   | **Excellent**  | (82)  |
| Process         | **Needs Work** | (48)  |
| Velocity        | **Excellent**  | (95)  |

---

## Adoption Assessment (v2.0)

| Dimension              | Band           | Score |
| ---------------------- | -------------- | ----- |
| WR-01 Stack compat     | **Needs Work** | (55)  |
| WR-02 Integration      | **Healthy**    | (70)  |
| WR-03 Maintenance      | **Needs Work** | (50)  |
| WR-04 Lock-in risk     | **Excellent**  | (85)  |
| WR-05 Value-to-cost    | **Healthy**    | (65)  |
| WR-06 Ecosystem mature | **Needs Work** | (45)  |

**Verdict: Trial (62)** -- Trial for Claude Code plugin integration and
methodology extraction. Do not adopt as core infrastructure dependency until
release cadence and CI mature.

---

## Key Stats

| Metric           | Value                                     |
| ---------------- | ----------------------------------------- |
| Stars            | 27,589 (~1,061/day)                       |
| Forks            | 2,586                                     |
| Contributors     | 44 (22 unique in registry)                |
| CLI Harnesses    | 33 in registry, 31 Python + 1 JS + 1 Rust |
| Categories       | 19                                        |
| Test Functions   | 2,707 (69 files, 402+ classes)            |
| Subprocess Calls | 99 across 51 files (0 shell=True)         |
| License          | Apache-2.0                                |
| Language         | Python 95.5%                              |
| CI Workflows     | 1 (GitHub Pages deploy only)              |
| Releases         | 1 (v0.2.0)                                |
| Repomix          | 3.1MB compressed output captured          |

---

## Findings (22 total)

### High Severity (5)

1. **F001: No SAST.** 99 subprocess calls with no automated security scanning.
2. **F002: No test CI.** 2,707 tests exist but zero CI enforcement.
3. **F003: SoX effect injection.** Audacity sox_backend passes agent-controlled
   effect strings directly to subprocess without allowlist validation.
4. **F004: Intelwatch arg passthrough.** All Click ctx.args forwarded to npx
   with zero validation (open-proxy pattern).
5. **F005: GIMP Script-Fu injection.** \_script_fu_escape() missing parenthesis
   escaping -- Scheme expression injection via crafted layer names.

### Medium Severity (7)

6. **F006: XXE in shotcut lxml.** etree.fromstring() without
   resolve_entities=False.
7. **F007: No path confinement.** abspath without directory check across all 33
   harnesses. Agent-directed writes to arbitrary locations.
8. **F008: Immature release cadence.** 1 release in 26 days.
9. **F009: Bus factor.** Merge authority concentrated in 1 maintainer.
10. **F010: Inconsistent credentials.** AdGuardHome plaintext HTTP + JSON config
    vs others using env vars + 0o600.
11. **F011: No monorepo coordination.** 0 conftest.py, no shared test runner.
12. **F012: Documentation staleness.** 4 surfaces show different test counts
    (1,245 / 1,508 / 1,839 / 2,005).

### Low Severity (6)

13-18. repl_skin drift, missing Code of Conduct, no static analysis, 9 missing
**main**.py, CONTRIBUTING.md doesn't link HARNESS.md, stale Shotcut HARNESS.md
copy.

### Positive Findings (4)

19. **Subprocess safety genuinely strong.** 0 shell=True, 0 os.system, 0 eval.
20. **HARNESS.md is novel methodology.** 7-phase SOP, mandatory real-software
    invocation, frame-level output verification.
21. **Viral growth.** 1,061 stars/day, 22 unique community contributors.
22. **Claude Code plugin pioneer.** .claude-plugin/ + 5 slash commands +
    OpenCode parallel + skill scaffolding.

---

## Absence Patterns

| Pattern         | Confidence | Evidence                                        |
| --------------- | ---------- | ----------------------------------------------- |
| SECURITY_FACADE | Medium     | Code has real mitigations, CI enforcement lacks |
| TEST_THEATER    | Low        | 2,707 real tests, CI gap only                   |

---

## Architecture Overview

**33 harnesses** following a consistent pattern:

- `agent-harness/setup.py` + `cli_anything/<name>/` namespace package
- Click CLI + REPL (repl_skin.py copy-pasted into each)
- `core/` (synthetic-testable logic) + `utils/<name>_backend.py` (subprocess)
- `skills/SKILL.md` (AI-discoverable) + `tests/` (test_core + test_full_e2e)
- `click>=8.0` + `prompt-toolkit>=3.0` + `python>=3.10` base

**Plugin system:** `cli-anything-plugin/` with HARNESS.md (7-phase SOP),
skill_generator.py (Jinja2 scaffolding), repl_skin.py (master copy),
.claude-plugin/plugin.json, 5 slash commands, 6 guides.

**Outliers:** sketch (Node.js), wiremock (rich instead of prompt-toolkit),
freecad (258 commands, Apache-2.0), comfyui (namespace violation).

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

## Dimension Agents (v2.0 capture)

| Agent                  | Tool Uses | Duration | Findings | Output Capture    |
| ---------------------- | --------- | -------- | -------- | ----------------- |
| security-auditor       | 55        | 3.3 min  | 20       | task-notification |
| test-engineer          | 33        | 3.5 min  | 6 recs   | task-notification |
| explore (architecture) | 52        | 4.6 min  | 6 areas  | task-notification |
| documentation-expert   | 71        | 4.4 min  | 14       | task-notification |

Note: All 4 agents returned via task-notification fallback. Agent output files
were 0 bytes (known Windows issue: anthropics/claude-code#39791).

---

## Overall Assessment

CLI-Anything is a **high-velocity, well-architected project with significant
security and process gaps.** The v2.0 Standard analysis found 3 critical
injection vulnerabilities (SoX effects, Intelwatch args, GIMP Script-Fu) that
the v1.0 Quick Scan missed. Subprocess safety is strong overall (0 shell=True)
but these 3 harnesses are exceptions that need allowlist validation.

**Adoption verdict: Trial (62).** The methodology (HARNESS.md, SKILL.md format)
is highly portable and worth studying. The Claude Code plugin integration is
novel. But the project is 26 days old with 1 release, no CI, and 3 unpatched
injection vectors -- do not treat as production infrastructure yet.
