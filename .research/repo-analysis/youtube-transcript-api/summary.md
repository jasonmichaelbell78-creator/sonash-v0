# Engineer View — YouTube Transcript API

**Repo:** jdepoix/youtube-transcript-api **Scan:** Standard, 2026-04-07

---

## Summary Bands

| Dimension       | Band           | Score  | Detail                                                                                                    |
| --------------- | -------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| Security        | High (68)      | 68/100 | defusedxml for safe XML parsing. No subprocess calls. No credentials stored. CI present.                  |
| Reliability     | High (78)      | 78/100 | 100% test coverage enforced. 4 test modules + 14 fixtures. CI with Coveralls. 24 contributors.            |
| Maintainability | Very High (82) | 82/100 | Clean modular architecture. Typed (py.typed). Poetry packaging. 2 runtime deps. Excellent abstractions.   |
| Documentation   | High (72)      | 72/100 | Thorough README with API/CLI examples, proxy guide, IP ban workarounds. Issue templates. Good docstrings. |
| Process         | Moderate (52)  | 52/100 | CI, precommit tasks, ruff linting. Missing CONTRIBUTING.md, SECURITY.md. No branch protection visible.    |
| Velocity        | Very High (88) | 88/100 | Pushed today. 399 commits over 8 years. 24 contributors. 120 CI runs. Active maintenance.                 |

**Composite Health: 73/100 — High**

---

## Absence Pattern

**Mature open-source library.** 8 years of active development. Strong
engineering fundamentals (typed, tested, minimal deps). Missing some community
governance artifacts (CONTRIBUTING, SECURITY, code of conduct) but the code
quality and maintenance history compensate.

---

## Adoption Assessment

**Adoption lens (library):** Trial (72/100)

- WR-01 Stack: Medium — Python library, different ecosystem from TypeScript
  home. But only needed as CLI/script tool for T27, not as app dependency.
- WR-02 Integration: Low — pip install, one-line API. Clean interface.
- WR-03 Maintenance: Low — actively maintained, 24 contributors, 8 years of
  history.
- WR-04 Lock-in: Low — MIT license, standard Python package. No vendor lock.
- WR-05 Value-to-cost: Very High — solves caption extraction completely. Free.
  Minimal deps.
- WR-06 Maturity: Very High — 7K stars, 8 years, 100% coverage.

**Creator lens (knowledge/patterns):** Very Strong (82/100)

- Architecture quality: Very High — clean modular design, excellent abstractions
- Knowledge density: Very High — innertube API, error handling patterns, proxy
  infrastructure, subtitle formats
- Transferable patterns: High — error hierarchy, formatter registry, proxy
  abstraction
- Relevance to home work: Critical for T27

**Primary lens:** Adoption (this is a library that should be installed, not just
studied)

**Verdict:** Trial — adopt for T27 pipeline. First repo-analysis to recommend
adoption over extraction.
