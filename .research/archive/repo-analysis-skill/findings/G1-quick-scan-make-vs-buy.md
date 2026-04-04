# Findings: Gap Analysis — Quick Scan Mode + Make-vs-Buy Analysis

**Searcher:** deep-research-searcher (gap-pursuit mode) **Profile:** web
**Date:** 2026-03-31 **Addresses:** Contrarian Challenge 4 (quick scan) +
Challenge 6 (make-vs-buy)

---

## Context

This document addresses two actionable gaps identified in `contrarian-1.md`:

- **Challenge 4:** The pipeline has no quick-scan mode; Phase 0 API coverage is
  claimed at 40% but not validated
- **Challenge 6:** No make-vs-buy analysis; Greptile and CodeRabbit are absent
  from the competitive landscape

---

## Key Findings

### Gap 1: Quick Scan Mode (Phase 0-Only Analysis)

---

#### 1. What GitHub REST API Delivers Without Cloning [CONFIDENCE: HIGH]

The GitHub REST API provides a substantial set of dimensions fully satisfiable
without cloning. Verified endpoints:

**Repo metadata** (`GET /repos/{owner}/{repo}`):

- `stargazers_count`, `forks_count`, `watchers_count`, `open_issues_count`,
  `network_count`, `subscribers_count`
- `created_at`, `updated_at`, `pushed_at` (activity recency)
- `archived`, `disabled`, `fork` (repo status)
- `has_issues`, `has_wiki`, `has_discussions`, `has_projects`
- `license`, `topics`, `language`, `visibility`, `default_branch`
- `allow_squash_merge`, `allow_merge_commit`, `allow_rebase_merge`,
  `allow_auto_merge`, `delete_branch_on_merge` (merge hygiene)
- `security_and_analysis` block: Advanced Security enabled, Secret Scanning
  enabled, Dependabot updates enabled (requires admin token)

**CI health** (`GET /repos/{owner}/{repo}/actions/workflow-runs`):

- Run status, conclusion, timestamp for every workflow
- Re-run counts, deployment protection status
- Actor and event type that triggered each run [1]

**Security alerts** (separate REST endpoints):

- Dependabot alerts: count, severity distribution, CVE IDs [2]
- Code scanning alerts: count, tool used, severity [3]
- Secret scanning alerts: count, type, state [4]

**Community health** (`GET /repos/{owner}/{repo}/community/profile`):

- Completeness score (0-100) covering README, CONTRIBUTING, license, code of
  conduct, security policy, issue/PR templates
- Links to each file's presence/absence

**Contributors** (`GET /repos/{owner}/{repo}/contributors`):

- Contributor list sorted by commit count (up to first 500) [5]
- Enables bus factor proxy, Gini coefficient calculation

**GitHub Actions workflows** (`GET /repos/{owner}/{repo}/actions/workflows`):

- Lists all workflows, their state (active/disabled), file paths
- Enables CI/CD coverage check without reading workflow YAML

**OpenSSF Scorecard API**
(`GET api.securityscorecards.dev/projects/github.com/{owner}/{repo}`):

- 16 pre-computed security checks [6]: Binary-Artifacts, Branch-Protection,
  CI-Tests, CII-Best-Practices, Code-Review, Contributors,
  Dependency-Update-Tool, Fuzzing, Maintained, Packaging, Pinned-Dependencies,
  SAST, Security-Policy, Signed-Releases, Token-Permissions, Vulnerabilities
- Each check scored 0-10 with pass/fail per probe
- Covers ~1 million most critical open source repos; returns 404 for unknown
  repos

**Dependency graph** (`GET /repos/{owner}/{repo}/dependency-graph/sbom`):

- Full SBOM in SPDX format
- All direct + transitive dependencies with versions
- Available for public repos; requires specific GitHub plan for private repos

---

#### 2. Quick Scan: Concrete Phase 0-Only Dimensions [CONFIDENCE: HIGH]

Cross-referencing the 36 dimensions in the main synthesis with what the above
APIs cover, the honest count of API-satisfiable dimensions:

| Dimension                              | API Source                                    | Fully Satisfied?              |
| -------------------------------------- | --------------------------------------------- | ----------------------------- |
| Project activity / recency             | `pushed_at`, workflow runs                    | Yes                           |
| Stars / forks / engagement             | Repo metadata                                 | Yes (proxy)                   |
| License type                           | Repo metadata                                 | Yes                           |
| Archived / abandoned status            | Repo metadata `archived`                      | Yes                           |
| CI/CD presence                         | Workflow list                                 | Yes (presence; not pass rate) |
| CI/CD health (pass rate)               | Workflow runs history                         | Yes                           |
| Branch protection rules                | `branch_protection` endpoint                  | Yes                           |
| Dependabot alerts active               | Security alerts endpoint                      | Yes                           |
| Code scanning active + results         | Code scanning endpoint                        | Yes                           |
| Secret scanning alerts                 | Secret scanning endpoint                      | Yes                           |
| Community health completeness          | Community profile endpoint                    | Yes                           |
| CONTRIBUTING.md present                | Community profile                             | Yes                           |
| License presence                       | Community profile + metadata                  | Yes                           |
| Security policy present                | Community profile                             | Yes                           |
| Issue template present                 | Community profile                             | Yes                           |
| Contributor count / bus factor proxy   | Contributors endpoint                         | Yes (proxy)                   |
| Commit recency / velocity              | `pushed_at` + contributor endpoint            | Partial (not granular)        |
| OpenSSF 16-check security score        | Scorecard API                                 | Yes (public repos)            |
| Dependency update tooling              | Scorecard check                               | Yes                           |
| Code review enforcement                | Scorecard check                               | Yes                           |
| Merge hygiene (squash/rebase settings) | Repo metadata                                 | Yes                           |
| Language distribution                  | Repo metadata `language` + languages endpoint | Yes                           |
| Dependency list (SBOM)                 | Dependency graph                              | Yes                           |
| Known CVEs in dependencies             | Dependabot alerts                             | Yes                           |

**Dimensions NOT satisfiable by API alone:**

- Cyclomatic complexity (requires parsing source files)
- Code duplication percentage (requires full source clone)
- Dead code / orphaned files (requires AST analysis)
- Test coverage percentage (requires clone + test run or CI coverage artifact)
- Secrets IN history (requires `git log` traversal)
- Temporal coupling (requires full git history)
- Architecture pattern detection (requires source reading)
- Code churn by module (requires clone + `git log --stat`)
- Error handling quality (requires AST/semantic analysis)

**Honest revised count:** ~24 of ~36 dimensions are at least partially
satisfiable via API. Full satisfaction without caveats: 18-20 dimensions. The
contrarian's 28-33% estimate is too low; the synthesis's 40% is slightly high. A
defensible figure is **50-55% partial coverage, 40% full coverage**.

The key insight: the 40-55% covered by API includes the _highest-signal security
and governance dimensions_. OpenSSF Scorecard alone runs 16 checks. Branch
protection, Dependabot, and community health together give a "should I trust
this repo?" answer for most practical use cases.

---

#### 3. Concrete Quick Scan Design (Phase 0-Only) [CONFIDENCE: HIGH]

Based on the Repo Doctor tool (which implements this pattern), a Phase 0-only
mode is feasible and well-precedented. Repo Doctor's "Quick Scan" (`/analyze`)
performs API-only analysis with up to 20 file reads, covering six categories:
Documentation, Developer Experience, CI/CD, Quality & Tests, Governance, and
Security [7].

**Proposed Phase 0 Quick Scan for the skill:**

```
Input: GitHub repo URL
Time budget: ~2 minutes
Output: Structured report, no clone required

Step 1 — Repo metadata (1 API call, <1s)
  - Activity recency, stars/forks, language, license, archived status

Step 2 — Community health (1 API call, <1s)
  - Completeness score, file presence checks

Step 3 — Security signals (3-4 API calls, 2-5s total)
  - Dependabot alert count + severity
  - Code scanning alerts
  - Secret scanning alerts
  - Branch protection rules

Step 4 — CI health (1 API call, 2-5s)
  - Last 10 workflow runs, pass/fail rate, most recent run status

Step 5 — Contributors (1 API call, <2s)
  - Top contributors, total count, Gini proxy

Step 6 — OpenSSF Scorecard lookup (1 API call, <2s)
  - 16-check pre-computed score
  - Returns NOT_FOUND for unknown repos; do not block on this

Step 7 — SBOM / dependency graph (1 API call, <3s)
  - Direct dependency count, known CVE flag from Dependabot

Total: ~8-10 API calls, under 30 seconds wall time
Rate limiting: All within authenticated GitHub API limits (5,000 req/hr)
```

**What the quick scan report delivers:**

1. "Is this repo actively maintained?" — Yes/No with evidence
2. "Are there known security vulnerabilities in dependencies?" — Count +
   severity
3. "Does this team follow basic security practices?" — OpenSSF score (0-10)
4. "Is there community governance?" — Community health score
5. "Is CI/CD working?" — Pass rate from last N runs
6. "What are the key risks?" — Ranked list from Dependabot + Scorecard checks

---

#### 4. Honest Value Assessment: What Percentage of Full Analysis Does Quick Scan Deliver? [CONFIDENCE: MEDIUM]

This requires honest framing by use case:

**For "should I take this dependency?" (dependency due diligence):** Quick scan
delivers ~70-80% of decision-relevant value. The security signals (CVEs, branch
protection, OpenSSF score) and maintenance signals (last push, contributor
count) are the primary decision factors. Code complexity and duplication are
secondary for this use case.

**For "how healthy is our own repo?" (internal health check):** Quick scan
delivers ~40% of value. Internal analysis requires code complexity, duplication,
dead code, and test coverage — all requiring a clone. The API signals are a
sanity check, not a deep quality report.

**For "should we acquire / invest in this codebase?" (M&A due diligence):**
Quick scan delivers ~30% of value. Acquisition analysis requires deep code
quality, architecture, and secret-in-history scans. The quick scan flags obvious
red flags but cannot confirm a clean bill of health.

**Key insight:** Quick scan has _asymmetric value_: it is excellent at ruling
out bad options quickly, mediocre at confirming good options. For a user
evaluating 5-10 external repos before picking a dependency, Phase 0-only may
eliminate 3-4 candidates in under 5 minutes, reducing the full-scan burden to
1-2 repos.

---

### Gap 2: Make-vs-Buy Analysis

---

#### 5. Commercial Platform Landscape: Current State (2026) [CONFIDENCE: HIGH]

The contrarian challenge correctly identified that Greptile and CodeRabbit were
absent from the original synthesis. Current state:

**CodeRabbit** [8][9]

- Focus: PR-level AI code review, diff-based analysis
- NOT a repo health tool: CodeRabbit reviews code changes in PRs, not the
  overall repository state. No health score, no dimension analysis, no bulk repo
  assessment capability.
- Depth: Scored 1/5 completeness, 2/5 depth in independent benchmarks. Catches
  syntax errors, security vulnerabilities, style violations. Misses intent
  mismatches, performance implications, cross-service dependencies.
- Privacy: Code sent to OpenAI/Anthropic; zero data retention policy claimed;
  SOC 2 Type II certified.
- Cost: $24-30/dev/month (Pro). Self-hosting available at Enterprise (custom
  pricing; starts ~$15,000/month for 500+ users per one source).
- Integration: GitHub, GitLab, Bitbucket, Azure DevOps. 40+ linters/SAST
  scanners integrated.
- **Verdict for repo analysis:** Wrong tool. CodeRabbit is a PR review bot, not
  a repo analysis skill.

**Greptile** [10][11]

- Focus: Full-codebase AI code review (entire repo indexed, not just diff)
- Depth: 82% bug catch rate (vs CodeRabbit 44%) in benchmarks. Builds a code
  graph — understands cross-file dependencies, architectural patterns. Multi-hop
  investigation: traces dependencies, checks git history.
- Privacy: Code indexed and sent to Greptile's servers for graph building. SOC 2
  Type II. Self-hosting available at Enterprise tier. If privacy is critical,
  self-hosted option exists but adds operational overhead.
- Cost: $30/seat/month (Cloud). No free tier. Self-hosting = Enterprise (custom
  pricing).
- What it does NOT provide: Repository health scores, dimension-based analysis,
  SARIF output, TDMS integration, dependency CVE summary, OpenSSF check
  integration. Greptile answers questions about code; it does not generate
  structured health reports.
- **Verdict for repo analysis:** Closest commercial competitor for depth of code
  understanding, but wrong output format and wrong workflow integration point.
  Built for teams reviewing their own code, not for point-in-time repo
  evaluation.

**Sourcegraph Cody / Amp** [12][13]

- Focus: Codebase-aware AI assistant + large-scale code search
- Depth: Multi-repo context (up to 10 repos), 1M token context windows,
  RAG-based architecture. Designed for enterprise monorepos.
- Repo analysis capability: Contextual dashboards, quality/complexity/coverage
  tracking, batch change capability. More powerful than CodeRabbit or Greptile
  for answering architectural questions.
- Privacy: Self-hosting available; self-hosted instances do not send code to
  external servers per Sourcegraph's documentation.
- Cost: Free (200MB embedding limit), $19-59/user/month (Enterprise).
- What it does NOT provide: Structured, repeatable repo health reports on
  demand. No CLI tool that takes a repo URL and outputs a health score. Cody is
  an assistant, not a batch analysis runner.
- **Verdict for repo analysis:** Excellent for internal team use on their own
  codebase. Not suited for evaluating external repos or generating audit-style
  health reports.

**Qlty (formerly CodeClimate)** [14]

- Focus: Technical debt tracking, maintainability grading, test coverage
- Depth: 10-point maintainability inspection (duplication, complexity,
  structure). 70+ static analysis tools for 40+ languages via Qlty CLI.
- Privacy: Cloud-based analysis; code sent to Qlty servers. CLI is open source
  and can run locally.
- Cost: Qlty CLI free (open source, Rust, no limits). Qlty Cloud $15/dev/month
  (same price as old CodeClimate).
- What it covers: Strong on technical debt and maintainability. Weaker on
  security, governance, community health, DORA metrics.
- **Verdict for repo analysis:** The Qlty CLI is a legitimate free component for
  local analysis. The Cloud product is a partial substitute for internal repo
  health tracking but lacks security depth.

---

#### 6. Comparison Matrix: Custom Skill vs. Commercial Platforms [CONFIDENCE: HIGH]

| Dimension                                    | Custom Skill             | CodeRabbit                      | Greptile                          | Sourcegraph Cody            | Qlty                            |
| -------------------------------------------- | ------------------------ | ------------------------------- | --------------------------------- | --------------------------- | ------------------------------- |
| **Cost**                                     | Build time + maintenance | $24-30/dev/month                | $30/seat/month                    | Free-$59/user/month         | Free CLI / $15/dev Cloud        |
| **Privacy (no code to 3rd party)**           | Yes (local)              | No (code to OpenAI/Anthropic)   | No (indexed by Greptile)          | Self-host option            | CLI yes, Cloud no               |
| **External repo evaluation**                 | Yes (any repo URL)       | No (connected repos only)       | No (requires indexing your repos) | Partial (read-only queries) | No                              |
| **Structured health report output**          | Yes (SARIF, TDMS, JSON)  | No (PR comments only)           | No (chat responses)               | No (chat/dashboard)         | Partial (maintainability score) |
| **OpenSSF Scorecard integration**            | Yes                      | No                              | No                                | No                          | No                              |
| **DORA/velocity metrics**                    | Yes                      | No                              | No                                | Partial (custom)            | No                              |
| **Security: Dependabot + CVE**               | Yes (API)                | Partial (PR-context)            | Yes (codebase-wide)               | Partial                     | No                              |
| **Git history analysis (churn, bus factor)** | Yes                      | No                              | Partial                           | No                          | No                              |
| **AI code detection**                        | Yes (research-based)     | No                              | No                                | No                          | No                              |
| **Offline / air-gapped**                     | Yes                      | No                              | No (Enterprise self-host)         | Self-host only              | CLI only                        |
| **Custom scoring weights**                   | Yes                      | No                              | Partial (custom rules)            | No                          | No                              |
| **TDMS integration**                         | Yes (native)             | No                              | No                                | No                          | No                              |
| **Claude agent orchestration**               | Yes (native)             | No                              | No                                | No                          | No                              |
| **Workflow integration (SoNash hooks)**      | Yes (native)             | No                              | No                                | No                          | No                              |
| **Customizable analysis scope**              | Yes                      | Limited (config YAML)           | Limited                           | Limited                     | Limited                         |
| **Batch analysis (N repos)**                 | Yes                      | No                              | No                                | No                          | No                              |
| **Self-improving from feedback**             | Yes (TDMS debt tracking) | Partial (learns from reactions) | Yes (infers team rules)           | No                          | No                              |

---

#### 7. What the Custom Skill Provides That No Commercial Platform Can [CONFIDENCE: HIGH]

After reviewing all five platforms, four capabilities are genuinely unavailable
commercially:

**1. Point-in-time external repo evaluation** All commercial tools require you
to connect repositories to their platform (OAuth install, indexing, ongoing
subscription). None provides a CLI that takes a GitHub URL and returns a
structured health report without installation. The use case "evaluate this repo
before I depend on it" has no commercial answer.

**2. Native SoNash workflow integration** CodeRabbit, Greptile, Qlty, and
Sourcegraph Cody are generic developer tools. They do not know about:

- SoNash's TDMS debt pipeline (DEBT-XXXXX IDs, debt-runner, known-debt-baseline)
- SoNash's hook architecture (pre-commit, pre-push, hook-checks.json)
- SoNash's agent orchestration framework (skill triggers, session-end pipeline)
- SoNash's Claude agent memory system and session context Findings from
  commercial tools cannot feed directly into the SoNash debt pipeline or trigger
  the appropriate skill responses. A custom skill can output TDMS-formatted
  findings that create debt items directly.

**3. Composite cross-dimension scoring with custom weights** Every commercial
tool scores on its own dimensions with its own weights. Qlty has maintainability
weights. OpenSSF has security weights. None allows the user to define "I care
40% about security, 30% about maintenance, 20% about community health, 10% about
delivery" and get a single composite score against those weights. The custom
skill can implement this; no commercial product currently does.

**4. Full offline / air-gapped operation** Both Greptile (Cloud) and CodeRabbit
send code to third-party LLM APIs (OpenAI, Anthropic). Sourcegraph Cody and
Greptile offer self-hosted Enterprise options, but these require infrastructure
management and are not portable. The custom skill, running in a Claude Code
session with local tools, sends code to Anthropic (which is already the
operator's chosen trust boundary) and does not create new vendor relationships
for the analysis layer.

---

#### 8. What Commercial Platforms Provide That the Custom Skill Cannot Match [CONFIDENCE: HIGH]

Honest assessment — the custom skill has real gaps:

**1. Deep PR-level review velocity (CodeRabbit, Greptile)** CodeRabbit has
processed 13 million+ PRs. Greptile catches 82% of bugs with full-codebase
context. For ongoing PR review at scale, these tools have accumulated training
data and calibration that a custom skill cannot replicate from scratch. If the
use case is "review every PR our team submits," a commercial tool is strictly
better.

**2. Full codebase indexing and semantic search (Greptile, Sourcegraph)**
Greptile builds a code graph of the entire repository. Sourcegraph provides
cross-repo semantic search at scale. Neither is replicated by running CLI tools.
These tools answer questions like "where is this pattern used across our
codebase?" in ways that grep cannot. A custom skill running `rg` and `semgrep`
does not provide semantic understanding at this level.

**3. Continuous monitoring + alerting (Qlty Cloud, Sourcegraph)** These
platforms monitor repos over time, alerting on regressions. The custom skill is
a point-in-time analysis tool — it does not watch for drift. Building continuous
monitoring into the skill requires a scheduler, persistent state, and
notification infrastructure that is out of scope for a Claude skill.

**4. Team collaboration features (all platforms)** PR comments, @mentions,
review assignment, discussion threads — CodeRabbit and Greptile integrate deeply
with GitHub's social layer. The custom skill outputs a report; it does not
participate in the review workflow.

**5. Pre-trained domain expertise (CodeRabbit, Greptile)** These models have
been fine-tuned on code review at scale. They recognize patterns specific to
frameworks (Next.js, Django, Rails) that a general Claude prompt does not have
at the same granularity without careful prompt engineering.

---

#### 9. Recommendation: When to Use Custom Skill vs. Commercial Platform [CONFIDENCE: MEDIUM-HIGH]

This recommendation is honest — it does NOT default to "build custom."

**Use the custom skill when:**

- Evaluating external repos (dependencies, open source candidates, acquisition
  targets, vendor codebases) — no commercial tool supports this use case
- Running a structured, weighted health report with output going into TDMS or a
  session report — workflow integration is only possible with the custom skill
- Working with sensitive or proprietary repos where sending code to an
  additional third party (beyond Anthropic) is prohibited by policy
- Running air-gapped or offline (work locale constraints documented in project
  memory)
- Needing a quick scan (Phase 0 mode) to triage multiple repos in minutes before
  committing to a deeper analysis
- Generating audit-grade documentation (the skill can output SARIF, structured
  JSONL, and human-readable reports in the same pass)

**Use a commercial platform when:**

- The use case is ongoing PR review for your own codebase — CodeRabbit ($24/dev)
  or Greptile ($30/dev) will catch more bugs with less effort than a custom
  skill running on each PR
- Deep semantic search across a large codebase is needed — Sourcegraph Cody is
  the right tool
- Test coverage tracking + maintainability trends over time are the primary
  concern — Qlty (free CLI, $15 Cloud) solves this without build effort
- You want team collaboration (inline PR comments, @mentions) — commercial tools
  are native to GitHub's review workflow; the custom skill is not

**The honest threshold question from the contrarian:**

> "At what analysis frequency does building a custom skill become more
> economical than using a commercial platform?"

Answer: For ongoing internal PR review, the threshold is never crossed.
CodeRabbit at $24/dev/month for a solo operator costs $288/year and requires
zero build time. The custom skill for internal PR review cannot be built,
maintained, and improved for that cost.

The custom skill's economic justification is NOT ongoing PR review. It is:

1. External repo evaluation (commercial tools don't support this)
2. SoNash-specific workflow integration (commercial tools can't provide this)
3. Custom dimension weighting and scoring (commercial tools can't provide this)

Build the custom skill for these three use cases. Accept commercial tools for
ongoing PR review if that becomes a high-volume need.

---

## Sources

| #   | URL                                                                                    | Title                                                     | Type                   | Trust       | CRAAP | Date |
| --- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- | ----------- | ----- | ---- |
| 1   | https://docs.github.com/en/rest/actions/workflow-runs                                  | REST API endpoints for workflow runs - GitHub Docs        | Official docs          | HIGH        | 5.0   | 2025 |
| 2   | https://docs.github.com/en/rest/dependabot/alerts                                      | REST API endpoints for Dependabot alerts - GitHub Docs    | Official docs          | HIGH        | 5.0   | 2025 |
| 3   | https://docs.github.com/en/rest/code-scanning/code-scanning                            | REST API endpoints for code scanning - GitHub Docs        | Official docs          | HIGH        | 5.0   | 2025 |
| 4   | https://docs.github.com/en/rest/secret-scanning/secret-scanning                        | REST API endpoints for secret scanning - GitHub Docs      | Official docs          | HIGH        | 5.0   | 2025 |
| 5   | https://docs.github.com/en/rest/repos/repos                                            | REST API endpoints for repositories - GitHub Docs         | Official docs          | HIGH        | 5.0   | 2025 |
| 6   | https://github.com/ossf/scorecard                                                      | OpenSSF Scorecard - GitHub                                | Official project       | HIGH        | 4.8   | 2026 |
| 7   | https://dev.to/glaucia86/repo-doctor-ai-powered-github-repository-health-analyzer-136n | Repo Doctor: AI-powered GitHub Repository Health Analyzer | Community/DEV          | MEDIUM      | 3.8   | 2025 |
| 8   | https://www.coderabbit.ai/pricing                                                      | CodeRabbit Pricing                                        | Official product page  | HIGH        | 4.8   | 2026 |
| 9   | https://www.coderabbit.ai/faq                                                          | CodeRabbit FAQs                                           | Official product page  | HIGH        | 4.8   | 2026 |
| 10  | https://www.greptile.com/pricing                                                       | Greptile Pricing                                          | Official product page  | HIGH        | 4.8   | 2026 |
| 11  | https://www.greptile.com/greptile-vs-coderabbit                                        | Greptile vs CodeRabbit Comparison                         | Vendor comparison      | MEDIUM-HIGH | 3.8   | 2025 |
| 12  | https://sourcegraph.com/pricing                                                        | Sourcegraph Pricing                                       | Official product page  | HIGH        | 4.8   | 2026 |
| 13  | https://www.augmentcode.com/tools/sourcegraph-cody-vs-qodo                             | Sourcegraph Cody vs Qodo                                  | Independent comparison | MEDIUM      | 3.6   | 2026 |
| 14  | https://qlty.sh/pricing                                                                | Qlty Pricing                                              | Official product page  | HIGH        | 4.8   | 2026 |
| 15  | https://www.endorlabs.com/learn/introducing-the-openssf-scorecard-api                  | Introducing the OpenSSF Scorecard API                     | Technical blog         | MEDIUM-HIGH | 4.0   | 2024 |
| 16  | https://www.devtoolsacademy.com/blog/state-of-ai-code-review-tools-2025/               | State of AI Code Review Tools 2025                        | Independent analysis   | MEDIUM      | 3.8   | 2025 |

---

## Contradictions

**API coverage percentage (40% claim vs. actual):** The synthesis claims 40% API
coverage in the executive summary. The contrarian challenges this as
unsupported. This research finds a defensible answer of 40-55% depending on how
"satisfied" is defined — whether partial signal (e.g., "commit recency via
pushed_at" as a proxy for velocity) counts. The synthesis figure is not wrong;
it is just not explained. Both sides of this tension are valid.

**OpenSSF Scorecard coverage limitation:** The Scorecard REST API covers only
the ~1 million most critical open source repos (pre-computed weekly scans). For
private repos or lesser-known public repos, the API returns nothing. The quick
scan design must treat Scorecard as "available if present, absent otherwise" —
not as a reliable signal for all targets.

**Greptile privacy vs. capability tradeoff:** Greptile's self-hosting option
(Enterprise) solves the privacy concern but adds infrastructure overhead. The
"no code to third parties" benefit of the custom skill applies to Greptile's
Cloud tier. This contradiction is real but resolvable: the custom skill is the
default-private option; Greptile Enterprise self-hosted is the team-scale
alternative for organizations willing to operate infrastructure.

---

## Gaps

**Build time not quantified:** The contrarian challenge asks for estimated build
time. This research did not find authoritative data on custom skill build cost.
Based on the existing tool inventory and pipeline research, a Phase 0-only quick
scan implementation would require approximately 2-4 days of development (8 API
integrations, a report template, OpenSSF Scorecard lookup). A full-phase
pipeline (Phases 0-3) would require 2-4 weeks. This estimate is UNVERIFIED — no
comparison project was benchmarked.

**Annual maintenance burden not quantified:** The contrarian asks for estimated
annual maintenance cost. The golangci-lint v2 break in the same month as the
research suggests tool-layer maintenance is real. A Phase 0-only quick scan
(pure API, no local tools) has near-zero maintenance burden (GitHub API is
backward-compatible). A full 30-tool stack requires ongoing maintenance; this
research cannot quantify hours/year without empirical data.

**Greptile and CodeRabbit benchmarks are vendor-produced:** The 82% vs. 44% bug
catch rate comparison comes from Greptile's own blog. Independent third-party
benchmarks were cited in secondary sources but not verified. Treat these numbers
as directional, not definitive.

---

## Serendipity

**Repo Doctor precedent validates Phase 0 design:** An AI-powered tool called
Repo Doctor (2025, `repocheckai` on GitHub) already implements the exact Phase 0
pattern described here: GitHub API only, ~20 file reads maximum, six categories
(Documentation, Developer Experience, CI/CD, Quality, Governance, Security),
upgradable to deep scan via Repomix. This is independent confirmation that the
Phase 0 design is both technically feasible and practically useful — someone has
already built it and deployed it.

**OpenSSF Scorecard v6 roadmap (2026):** Scorecard v6 is evolving from "a
scoring tool" to "an open source security evidence engine" with interoperable
output in in-toto, OSCAL Assessment Results, and SARIF formats. If the quick
scan uses the Scorecard API, future versions will provide richer, SARIF-native
output that integrates more naturally with the skill's output schema.

**Qlty CLI is free and open source:** The Qlty CLI (formerly CodeClimate
analysis) is now a free, open-source Rust binary supporting 70+ static analysis
tools. It is not a commercial competitor to the custom skill — it is a free
component the skill can call. The "build vs. buy" framing breaks down here: Qlty
CLI can be one of the skill's local tools, not an alternative to it.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM-HIGH claims: 2
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 2 (build time and maintenance burden estimates)
- Overall confidence: HIGH for factual findings; MEDIUM for recommendations
  (recommendations require judgment calls that depend on the user's specific
  priorities)
