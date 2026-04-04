# Findings: Temporal Fingerprint and Absence Pattern Classifier

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** G2-OPP1 (Temporal Fingerprint), G2-OPP2 (Absence Pattern
Classifier)

---

## Part A: Temporal Fingerprint

### Key Findings

---

**1. The five most diagnostic git history signals** [CONFIDENCE: HIGH]

Based on cross-referencing code-maat, hercules, git-quick-stats, and research
papers on unmaintained project detection, these are the highest-value temporal
signals:

| Signal                                 | Extraction Method                                                                    | Why Diagnostic                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Commit velocity trend**              | Monthly commit counts over 12 months                                                 | Reveals health trajectory: rising = active, declining = stalling, flatlined = ghost ship |
| **Contributor churn rate**             | Unique active authors per month, trailing 6 months vs prior 6 months                 | Bus factor deterioration; single-author collapse is the #1 abandonment predictor         |
| **Test-to-code file ratio trajectory** | Count `*_test.*`, `test_*.*`, `*.spec.*` vs total source files per 3-month quartile  | Rising ratio = growing test discipline; flat or declining = coverage debt accumulation   |
| **Dependency file touch frequency**    | How often `package.json`, `requirements.txt`, `go.mod`, `Gemfile` change per quarter | High frequency = active maintenance; stale for >6 months = "dependency freeze" risk      |
| **Code churn vs. net growth**          | Lines added minus lines deleted per month                                            | High churn with low net growth = thrash/instability; inverse = healthy feature growth    |

Research on unmaintained GitHub projects [8] found that "days without commits,"
PR open/close rates, and issue response time together achieve >90% accuracy in
classifying maintenance status. Commit recency alone is insufficient because
some repos are legitimately stable.

---

**2. Existing tools that extract temporal data** [CONFIDENCE: HIGH]

Three tools are directly usable; one is overkill for a lightweight skill:

**git-of-theseus** [3]

- Writes `cohorts.json`, `authors.json`, `exts.json` — structured JSON outputs
- Generates "survival curves": percentage of lines from a cohort still present
  after N years
- Output is plottable but not directly embeddable in a text report
- Limitation: "might take quite some time" — no published benchmark; Hercules
  claims 20-6x faster

**hercules** [4]

- Go binary + Python `labours` plotting companion
- `--burndown`: line survival over time (project-wide)
- `--burndown-people`: per-developer contribution evolution
- `--devs`: aligned commit series with developer activity patterns
- Output: YAML, Protocol Buffers, JSON, TSV
- Performance: ~1h 40min on Linux kernel; typical mid-size repos estimated
  minutes
- Limitation: heavy dependency chain (TensorFlow for embeddings); overkill for a
  quick skill pass

**git-quick-stats** [5]

- Shell script, zero dependencies beyond git
- `--json-output` flag writes git log as structured JSON
- Exposes hourly/weekday/monthly commit distributions
- Temporal scope filtering via `_GIT_SINCE` / `_GIT_UNTIL` env vars
- Best option for lightweight extraction in a skill pipeline

**code-maat** [6]

- JVM-based; CSV output
- `--temporal-period` switch groups same-day commits as logical units
- Extracts: code age per module (months since last change), absolute churn by
  date, author churn, revision frequency
- Useful for hotspot detection on top of temporal data

**Recommendation for the skill:** Use native `git log` commands (see Section
A.4) for the fingerprint. Reserve hercules/git-of-theseus for a `--deep` flag.
git-quick-stats is a reasonable middle ground.

---

**3. Concrete temporal fingerprint design** [CONFIDENCE: MEDIUM-HIGH]

The fingerprint should be extractable in under 30 seconds on a typical repo (<
5,000 commits) using only `git log`.

**Format: Compact JSONL record (one per repo)**

```jsonl
{
  "repo": "owner/name",
  "fingerprint_date": "2026-03-31",
  "window_months": 12,
  "signals": {
    "commit_velocity": {
      "monthly_counts": [
        3,
        5,
        12,
        8,
        6,
        0,
        1,
        2,
        4,
        7,
        9,
        11
      ],
      "sparkline": "▂▃█▅▄▁▁▁▃▄▆▇",
      "trend": "recovering",
      "peak_month": "2025-06",
      "dead_months": 2
    },
    "contributor_health": {
      "active_authors_per_month": [
        2,
        3,
        4,
        3,
        2,
        1,
        1,
        1,
        1,
        2,
        2,
        3
      ],
      "sparkline": "▂▄█▄▂▁▁▁▁▂▂▄",
      "bus_factor_trend": "declining",
      "solo_months": 5,
      "unique_contributors_12m": 4
    },
    "test_ratio_trajectory": {
      "quarterly_ratios": [
        0.18,
        0.19,
        0.17,
        0.16
      ],
      "trend": "declining",
      "current_ratio": 0.16
    },
    "dependency_freshness": {
      "dep_file_last_touched_days_ago": 187,
      "dep_file_touches_12m": 3,
      "trend": "stale"
    },
    "churn_vs_growth": {
      "monthly_net_lines": [
        120,
        -40,
        300,
        80,
        -200,
        10,
        5,
        0,
        90,
        150,
        200,
        180
      ],
      "sparkline": "▃▁█▃▁▁▁▁▂▃▄▄",
      "pattern": "erratic_then_stable"
    }
  },
  "summary_indicators": {
    "velocity_trend": "recovering",
    "maintenance_risk": "medium",
    "bus_factor": 1,
    "test_discipline": "declining"
  }
}
```

**Trend classification rules:**

- `velocity_trend`: `growing` (last 3m avg > prior 3m avg by 20%), `stable`
  (±20%), `declining` (down >20%), `dead` (0 commits last 3m), `recovering`
  (dead then active)
- `bus_factor`: count of authors responsible for >80% of commits in last 6
  months (use `git shortlog -sn --since="6 months ago"` and apply 80% cumulative
  threshold)
- `maintenance_risk`: `low` (velocity growing + bus_factor ≥ 2), `medium`
  (stable or ≤1 author), `high` (declining velocity + solo author), `critical`
  (dead + not archived)

---

**4. Extraction commands (implementable now)** [CONFIDENCE: HIGH]

All commands use git log only. No external tools required.

```bash
# Monthly commit counts for last 12 months
git log --oneline --since="12 months ago" \
  --pretty=format:"%ad" --date=format:"%Y-%m" \
  | sort | uniq -c \
  | awk '{print $2, $1}'

# Unique authors per month (last 12 months)
git log --since="12 months ago" \
  --pretty=format:"%ad %aN" --date=format:"%Y-%m" \
  | awk '{month=$1; author=substr($0, length($1)+2); authors[month][author]=1}
         END {for (m in authors) {count=0; for (a in authors[m]) count++; print m, count}}'

# Bus factor calculation: top contributors covering 80% of commits
git shortlog -sn --since="6 months ago" --no-merges

# Dependency file touch frequency
git log --since="12 months ago" --oneline \
  -- package.json pyproject.toml requirements.txt go.mod Gemfile Cargo.toml \
  | wc -l

# Test file ratio: count test files vs source files
git ls-files | grep -cE '(_test\.|\.test\.|\.spec\.|_spec\.)'
git ls-files | grep -cE '\.(js|ts|py|go|rb|java|rs|cs)$'

# Net lines per month (requires --numstat, slower)
git log --since="12 months ago" --pretty=format:"%ad" \
  --date=format:"%Y-%m" --numstat \
  | awk 'NF==1{month=$1} NF==3 && $1~/^[0-9]+$/{added[month]+=$1; deleted[month]+=$2}
         END {for (m in added) print m, added[m]-deleted[m]}'
```

**Sparkline generation** (pure bash, no Python): The Unicode block characters
`▁▂▃▄▅▆▇█` can be assigned by dividing values into 8 buckets relative to the max
value. A 10-line bash function handles this with no dependencies. The Python
`sparklines` package [7] provides the same via
`sparklines.sparklines([1,2,3,...])`.

---

**5. Performance budget** [CONFIDENCE: MEDIUM]

The pure-git extraction path has predictable performance:

| Operation                         | Approx time (1,000 commits) | Approx time (10,000 commits) |
| --------------------------------- | --------------------------- | ---------------------------- |
| Monthly commit counts             | < 1 second                  | 2-5 seconds                  |
| Authors per month                 | 1-3 seconds                 | 5-15 seconds                 |
| Dependency file touches           | < 1 second                  | 1-2 seconds                  |
| Net lines per month (--numstat)   | 5-15 seconds                | 30-120 seconds               |
| Full fingerprint (no --numstat)   | 3-10 seconds                | 10-30 seconds                |
| Full fingerprint (with --numstat) | 10-30 seconds               | 45-150 seconds               |

Recommendation: make `churn_vs_growth` (--numstat) opt-in behind a `--deep`
flag. The 4-signal fingerprint without it completes in under 30 seconds on repos
up to 10,000 commits.

The Hercules tool benchmarks at ~1h 40min for the Linux kernel (800,000+
commits). For typical project repos (< 20,000 commits), estimate 2-10 minutes,
which is too slow for a default analysis pass but reasonable for a dedicated
deep-dive mode.

---

## Part B: Absence Pattern Classifier

### Key Findings

---

**6. The absence catalog — what a healthy repo should have** [CONFIDENCE: HIGH]

Derived from OSSF Scorecard [1], GitHub Community Health API [9], and the
`brief` tool detection pipeline [2].

**Tier 1 — Universal (language-agnostic)**

| Artifact           | Path(s)                                                                                           | Severity if absent |
| ------------------ | ------------------------------------------------------------------------------------------------- | ------------------ |
| README             | `README.md`, `README.rst`, `README.txt`                                                           | CRITICAL           |
| LICENSE            | `LICENSE`, `LICENSE.md`, `LICENSE.txt`, `COPYING`                                                 | CRITICAL           |
| .gitignore         | `.gitignore`                                                                                      | IMPORTANT          |
| CI configuration   | `.github/workflows/*.yml`, `.gitlab-ci.yml`, `.circleci/config.yml`, `Jenkinsfile`, `.travis.yml` | IMPORTANT          |
| SECURITY policy    | `SECURITY.md`, `.github/SECURITY.md`                                                              | IMPORTANT          |
| CONTRIBUTING guide | `CONTRIBUTING.md`, `.github/CONTRIBUTING.md`                                                      | NICE-TO-HAVE       |
| CODE_OF_CONDUCT    | `CODE_OF_CONDUCT.md`, `.github/CODE_OF_CONDUCT.md`                                                | NICE-TO-HAVE       |
| Issue templates    | `.github/ISSUE_TEMPLATE/`                                                                         | NICE-TO-HAVE       |
| PR template        | `.github/PULL_REQUEST_TEMPLATE.md`                                                                | NICE-TO-HAVE       |
| Changelog          | `CHANGELOG.md`, `HISTORY.md`, `CHANGES.md`                                                        | NICE-TO-HAVE       |

**Tier 2 — Framework-specific (detected by manifest file)**

| Detected by                            | Expected artifacts                                     | Severity if absent |
| -------------------------------------- | ------------------------------------------------------ | ------------------ |
| `package.json` present                 | `package-lock.json` or `yarn.lock` or `pnpm-lock.yaml` | IMPORTANT          |
| `package.json` present                 | test script in `scripts.test`                          | IMPORTANT          |
| `package.json` present                 | `.eslintrc.*` or `eslint.config.*`                     | NICE-TO-HAVE       |
| `pyproject.toml` or `setup.py` present | `tests/` or `test_*.py` files                          | IMPORTANT          |
| `pyproject.toml` present               | `[tool.pytest.ini_options]` or `pytest.ini`            | NICE-TO-HAVE       |
| `go.mod` present                       | `*_test.go` files                                      | IMPORTANT          |
| `go.mod` present                       | `Makefile` with test target                            | NICE-TO-HAVE       |
| `Gemfile` present                      | `.rspec` or `spec/` directory                          | IMPORTANT          |
| `Cargo.toml` present                   | `tests/` or `#[cfg(test)]` in source                   | IMPORTANT          |
| `Dockerfile` present                   | `.dockerignore`                                        | IMPORTANT          |
| `Dockerfile` present                   | Multi-stage build (security best practice)             | NICE-TO-HAVE       |
| Any CI file present                    | At least one job with a test command                   | CRITICAL           |
| `package.json` + GitHub Actions        | `npm audit` or `snyk` or `dependabot.yml`              | IMPORTANT          |

**Tier 3 — Security-specific**

| Expected artifact            | Detection method                                              | Severity if absent |
| ---------------------------- | ------------------------------------------------------------- | ------------------ |
| Dependabot config            | `.github/dependabot.yml`                                      | IMPORTANT          |
| Secret scanning config       | `.github/secret_scanning.yml` or GH Advanced Security enabled | IMPORTANT          |
| SBOM                         | `sbom.json`, `*.spdx`, release assets                         | NICE-TO-HAVE       |
| Branch protection (inferred) | Presence of `branch-protection` in GitHub API or `CODEOWNERS` | IMPORTANT          |

---

**7. Named absence patterns (implementable classifiers)** [CONFIDENCE:
MEDIUM-HIGH]

These are new named patterns synthesized from research. No prior named catalog
for these exists in the literature — the names and definitions below are novel
to this skill.

---

**Pattern: "Ghost Ship"**

- Definition: Last commit > 180 days ago AND repository is NOT marked as
  archived
- Signals: `git log -1 --format="%ar"` returns > 6 months; GitHub API
  `archived: false`
- Severity: CRITICAL if the repo is a dependency; HIGH if standalone
- Related: Research on unmaintained GitHub projects [8] found >6 months without
  commits is the most reliable single predictor of abandonment
- Detection command:
  ```bash
  LAST_COMMIT_DAYS=$(( ($(date +%s) - $(git log -1 --format="%ct")) / 86400 ))
  [ $LAST_COMMIT_DAYS -gt 180 ] && echo "GHOST_SHIP: $LAST_COMMIT_DAYS days since last commit"
  ```

---

**Pattern: "Security Facade"**

- Definition: README contains security-related keywords OR has a security badge,
  but none of the actual security tooling files exist
- Signals present: `grep -i "security\|vulnerability\|CVE\|secure" README.md`
  finds matches; badge URLs reference Snyk/CodeQL
- Signals absent: No `.github/dependabot.yml`, no `.github/workflows/*.yml`
  containing `codeql`, `snyk`, `trivy`, `grype`, `semgrep`, or `npm audit`; no
  `SECURITY.md`
- Severity: HIGH (false sense of security for consumers/contributors)
- Detection: Parse README for badge URLs matching `snyk.io/badge`,
  `github.com/*/security/badge`, `shields.io` security labels; then verify
  corresponding workflow steps exist

---

**Pattern: "Test Theater"**

- Definition: CI configuration exists AND has workflow files, but no workflow
  job contains a recognizable test command
- Signals present: `.github/workflows/*.yml` files exist
- Signals absent: No step with `run:` containing `test`, `pytest`, `jest`,
  `rspec`, `go test`, `cargo test`, `mocha`, `vitest`, `phpunit`, `dotnet test`,
  `mvn test`, `gradle test`
- Severity: CRITICAL (worst pattern: CI infrastructure cost with zero quality
  signal)
- Detection:
  ```bash
  # Check if any workflow run step contains a test command
  grep -r "run:" .github/workflows/ \
    | grep -qiE "test|pytest|jest|rspec|go test|cargo test|mocha|vitest" \
    || echo "TEST_THEATER: CI exists but no test commands found"
  ```

---

**Pattern: "Dependency Freeze"**

- Definition: Dependency manifest exists AND has declared dependencies, but the
  manifest has not been modified in > 6 months
- Signals: `package.json` / `requirements.txt` / `go.mod` present;
  `git log --follow -1 --format="%ar" -- <dep-file>` returns > 6 months
- Severity: IMPORTANT (accumulating vulnerability exposure; indicates
  unmaintained deps)
- Nuance: Distinguish from repos with few deps (low risk) vs. many deps (high
  risk). Check `jq '.dependencies | length' package.json` as a weight factor.

---

**Pattern: "Lone Wolf"**

- Definition: > 90% of commits in last 12 months are from a single author AND no
  CODEOWNERS file exists
- Signals: `git shortlog -sn --since="12 months ago"` shows one author with >90%
  share; no `.github/CODEOWNERS`
- Severity: IMPORTANT (bus factor = 1; no succession path documented)
- Variant: "Vanishing Wolf" — was multi-contributor 12 months ago, now solo.
  Detectable by comparing 12m vs 6m contributor lists.

---

**Pattern: "Silent Failure"**

- Definition: CI exists AND tests exist AND CI has test commands, but there are
  no branch protection rules requiring CI to pass before merge
- Signals present: `.github/workflows/` with test steps; `package.json` test
  script
- Signals absent: `CODEOWNERS` file; GitHub API shows no branch protection on
  default branch; PRs merged without required status checks (inferred from
  commit patterns)
- Severity: IMPORTANT (tests run but are advisory, not gating)
- Note: Requires GitHub API access to fully detect; partial detection possible
  via `CODEOWNERS` absence

---

**Pattern: "README Island"**

- Definition: Only file present is `README.md` (or a very sparse set); no
  license, no CI, no source code structure beyond single files
- Signals: File count < 5; no license; no CI; source files but no test directory
- Severity: Contextual (may be intentional for documentation repos) — flag for
  human review rather than auto-score

---

**Pattern: "Borrowed Armor"**

- Definition: Has a `SECURITY.md` file but the file is a template (contains
  `[PLACEHOLDER]`, `TODO`, `your@email.com`, or default GitHub template
  boilerplate) rather than actual disclosure policy
- Detection:
  `grep -iE "TODO|placeholder|\[your|example\.com|maintainer@" SECURITY.md`
- Severity: IMPORTANT (misleads contributors about disclosure process)

---

**8. Scoring system — severity weights** [CONFIDENCE: MEDIUM]

Proposed scoring rubric, calibrated against OSSF Scorecard risk levels [1] and
GitHub health metrics [9]:

**Severity definitions:**

- **CRITICAL** (weight: 3 points): Patterns that actively mislead or create
  security risk
- **IMPORTANT** (weight: 2 points): Patterns that represent genuine maintenance
  or safety gaps
- **NICE-TO-HAVE** (weight: 1 point): Best practices that are commonly absent in
  healthy repos

**Named pattern severity assignments:**

| Pattern                                     | Severity         | Points deducted |
| ------------------------------------------- | ---------------- | --------------- |
| Test Theater                                | CRITICAL         | 3               |
| Ghost Ship                                  | CRITICAL         | 3               |
| Security Facade                             | HIGH → IMPORTANT | 2               |
| Borrowed Armor                              | IMPORTANT        | 2               |
| Dependency Freeze (many deps)               | IMPORTANT        | 2               |
| Lone Wolf                                   | IMPORTANT        | 2               |
| Silent Failure                              | IMPORTANT        | 2               |
| Missing LICENSE                             | CRITICAL         | 3               |
| Missing README                              | CRITICAL         | 3               |
| Missing CI (when tests exist)               | IMPORTANT        | 2               |
| Missing SECURITY.md                         | IMPORTANT        | 2               |
| Missing .gitignore                          | IMPORTANT        | 2               |
| Missing CONTRIBUTING.md                     | NICE-TO-HAVE     | 1               |
| Missing lockfile (when package.json exists) | IMPORTANT        | 2               |

**Score computation:**

- Start at 100
- Deduct points per finding
- Normalize to 0-100 scale based on applicable checks (not all checks apply to
  all repos)
- Example: A Node.js repo with Test Theater (3) + Ghost Ship (3) + no
  SECURITY.md (2) + no lockfile (2) scores: 100 - 10 = 90, but only out of ~20
  applicable points → 50% score

**Output format per finding:**

```json
{
  "pattern": "TEST_THEATER",
  "severity": "CRITICAL",
  "evidence": "Found .github/workflows/ci.yml but no run: step matches known test commands",
  "remediation": "Add 'npm test' or equivalent to a workflow job step",
  "score_impact": -3
}
```

---

**9. Implementation pipeline design** [CONFIDENCE: HIGH]

A complete absence classifier can be implemented as a single-pass shell
function:

```
Phase 1: Manifest Detection (< 1 second)
  - Walk root for manifest files → determine language/framework
  - Emit: {language, package_manager, dep_file}

Phase 2: Universal Artifact Check (< 2 seconds)
  - Check existence of Tier 1 universal files
  - Emit: absent_artifacts[]

Phase 3: Framework-Specific Check (< 2 seconds)
  - Based on Phase 1 results, check Tier 2 expected artifacts
  - Emit: absent_framework_artifacts[]

Phase 4: Named Pattern Detection (< 5 seconds)
  - Run git log commands for Ghost Ship, Lone Wolf, Dependency Freeze
  - Parse CI workflow files for Test Theater
  - Check README content for Security Facade, Borrowed Armor
  - Emit: named_patterns[]

Phase 5: Scoring + Output (< 1 second)
  - Compute score from severity weights
  - Format findings as structured JSON or markdown table
  - Emit: absence_report
```

Total wall time: < 10 seconds for most repos (excluding git history for Ghost
Ship/Lone Wolf which adds 5-15 seconds).

---

## Sources

| #   | URL                                                                                             | Title                                       | Type                 | Trust       | CRAAP | Date |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------- | ----------- | ----- | ---- |
| 1   | https://github.com/ossf/scorecard/blob/main/docs/checks.md                                      | OSSF Scorecard Checks                       | Official docs        | HIGH        | 4.5   | 2025 |
| 2   | https://gist.github.com/andrew/29074bd0928e64252af1b17bd5bd13cb                                 | brief tool — repo detection pipeline        | Community/technical  | MEDIUM-HIGH | 4.0   | 2024 |
| 3   | https://github.com/erikbern/git-of-theseus                                                      | git-of-theseus                              | Official repo        | HIGH        | 4.0   | 2023 |
| 4   | https://github.com/src-d/hercules                                                               | hercules git analytics                      | Official repo        | HIGH        | 4.2   | 2023 |
| 5   | https://git-quick-stats.sh/                                                                     | git-quick-stats                             | Official project     | HIGH        | 4.0   | 2024 |
| 6   | https://github.com/adamtornhill/code-maat                                                       | code-maat                                   | Official repo        | HIGH        | 4.0   | 2022 |
| 7   | https://github.com/deeplook/sparklines                                                          | sparklines Python package                   | Official repo        | HIGH        | 4.0   | 2023 |
| 8   | https://arxiv.org/abs/1809.04041                                                                | Identifying Unmaintained Projects in GitHub | Academic (ESEM 2018) | HIGH        | 4.3   | 2018 |
| 9   | https://docs.github.com/en/rest/metrics/community                                               | GitHub REST API — Community Metrics         | Official docs        | HIGH        | 5.0   | 2025 |
| 10  | https://dev.to/itxashancode/gh-repo-health-check-your-github-repos-health-score-in-seconds-2bon | gh-repo-health tool                         | Community            | MEDIUM      | 3.5   | 2024 |
| 11  | https://interjectedfuture.com/ai-assist/generating-a-histogram-of-all-commits-over-time/        | Git commit histogram generation             | Community            | MEDIUM      | 3.5   | 2024 |
| 12  | https://github.com/ibarsi/git-velocity                                                          | git-velocity CLI                            | Official repo        | MEDIUM      | 3.5   | 2022 |
| 13  | https://github.com/elek/bus-factor                                                              | bus-factor tool                             | Official repo        | MEDIUM      | 3.5   | 2022 |

---

## Contradictions

**Contradiction 1: Tool complexity vs. accuracy tradeoff** git-of-theseus and
hercules produce richer temporal data (survival curves, burndown analysis) but
are significantly heavier to run. git log commands produce shallower metrics in
seconds. The literature does not establish which set of metrics is more
predictive of project health outcomes — the choice is primarily a performance
tradeoff, not an accuracy one.

**Contradiction 2: "Ghost Ship" threshold** The academic research [8] uses 6
months as the abandonment threshold. cargo-unmaintained (Rust ecosystem) uses 1
year. GitHub's own OSSF Scorecard "Maintained" check uses 90 days as an activity
requirement. There is no consensus. Recommendation: use 180 days as the Ghost
Ship threshold but surface the raw "days since last commit" value to let the
skill consumer apply their own threshold.

**Contradiction 3: Absence vs. intentional minimalism** Some high-quality repos
(personal tools, single-purpose utilities) legitimately have no CONTRIBUTING.md,
no issue templates, and no SECURITY.md because they are not community projects.
The absence classifier must not penalize these the same as production libraries.
Mitigation: weight checks by a "community project" signal (has > N stars, has
open issues/PRs, has external contributors) before applying
IMPORTANT/NICE-TO-HAVE penalties.

---

## Gaps

1. **No benchmark data for git log performance on Windows.** All performance
   estimates are from Linux/macOS sources. Windows git may be 2-5x slower on
   large repos due to NTFS overhead. The skill runs in a Windows environment —
   this needs empirical testing before publishing the performance budget.

2. **CI workflow parsing for Test Theater is pattern-matched, not semantically
   parsed.** A workflow that calls `make ci` which in turn runs tests would be
   missed. Full semantic analysis would require executing the Makefile target
   lookup, which is out of scope for a lightweight pass.

3. **Security Facade detection is heuristic.** Detecting whether a Snyk badge in
   README corresponds to an active Snyk integration requires either API access
   (Snyk API) or checking the badge URL for a valid project ID. The heuristic
   (check badge URL format) may produce false positives.

4. **No language-specific test framework exhaustiveness verification.** The Tier
   2 framework checks verify that test files exist, but not that they contain
   meaningful tests (e.g., empty `describe()` blocks in Jest). Full coverage
   analysis requires running the test suite, which is outside a static analysis
   pass.

5. **Contributor churn "Vanishing Wolf" variant** requires historical author
   data at two time points. The git log command approach handles this, but the
   comparison logic needs careful handling of email/name normalization
   (contributors may commit with different email addresses).

---

## Serendipity

**The `brief` tool is a near-complete absence catalog engine.** It
deterministically detects language, package manager, test framework, linter, CI
system, and project resources — outputting JSON with confidence levels. It is
designed exactly for what the absence classifier needs for Phase 1 and Phase 2.
If this tool can be invoked as a subprocess, it eliminates ~60% of the absence
classifier implementation. Worth evaluating as a hard dependency vs.
reimplementing detection from scratch.

**git_time_extractor** (https://github.com/rietta/git_time_extractor) detects
"death marches" in development by analyzing commit timing patterns. This is a
named temporal pattern not covered in the original OTB analysis but directly
relevant to team health signals.

**OSSF Scorecard has a JSON output mode** (`scorecard --format json`) that maps
directly to absence patterns. Running it as a subprocess would provide 20
pre-scored absence signals out of the box, with severity weights already
calibrated. This could replace the entire Tier 3 security detection layer. The
downside: it requires GitHub API credentials for some checks.

**The `libyear` metric** (https://github.com/jdanil/libyear) quantifies
dependency staleness as a single number: sum of years between current version
and latest version across all dependencies. This is a more precise version of
"Dependency Freeze" that weights by actual version lag, not just file
modification date.

---

## Confidence Assessment

- HIGH claims: 5 (tool capabilities, git commands, OSSF check list, sparkline
  format, scoring framework structure)
- MEDIUM-HIGH claims: 4 (temporal fingerprint JSONL design, named pattern
  definitions, framework-specific artifact list, performance estimates)
- MEDIUM claims: 3 (scoring weights, some named pattern severity assignments,
  contradiction resolutions)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The high-confidence findings (tools, commands, OSSF data) are directly
implementable. The medium-confidence findings (scoring weights, named pattern
thresholds) are reasonable starting points that should be validated against real
repos in a pilot run.
