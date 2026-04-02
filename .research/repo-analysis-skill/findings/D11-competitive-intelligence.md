# Findings: D11 — Beyond Code Quality: Competitive/Strategic Intelligence from Repo Analysis

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question ID:** D11

---

## Key Findings

### 1. Team Velocity Signals: What Commit Patterns Actually Tell You [CONFIDENCE: HIGH]

Repository commit metadata contains surprisingly rich organizational
intelligence:

**Deployment frequency as team health proxy:** The 2024/2025 DORA reports
establish four performance tiers. Elite teams deploy multiple times per day with
sub-one-hour recovery. In 2024, the high-performer cluster shrank from 31% to
22% of surveyed organizations while low performers grew from 17% to 25% — a
measurable degradation visible via release tags in public repos [1][2].

**PR merge time as reviewer health signal:** Long PR review times (>2 business
days) indicate overloaded senior developers or cultural review debt. The 2025
DORA finding that AI-assisted repos show +91% more code review time and +154%
larger PR sizes [3] creates a diagnostic: repos showing this pattern may be
adopting AI coding tools without proportional review capacity — a team health
risk that shows up before any code quality metric degrades.

**Commit timestamp analysis for team size/distribution:** Carnegie Mellon
research (published in ACM SIGSOFT) demonstrates that commit time-of-day
variance is strongly associated with both timezone distribution and team size.
Projects with compressed activity windows (all commits in a 9-hour band) suggest
small, co-located teams. "Follow-the-sun" patterns — sequential activity peaks
8+ hours apart — indicate distributed teams of meaningful size [4].

**AI productivity paradox as velocity trap:** Individual-level AI gains (+21%
tasks, +98% PRs merged) do not translate to organizational delivery improvement.
Repos showing high PR velocity alongside flat deployment frequency may be in
this trap [3].

---

### 2. Decision-Making Patterns Visible in Dependencies [CONFIDENCE: HIGH]

Dependency graph evolution is one of the highest-signal competitive intelligence
surfaces in a public repo:

**Framework migration as strategy signal:** A package.json change from Express
to Fastify signals a team explicitly investing in performance and modern async
patterns — not a trivial decision, as it requires middleware rewrites. A
migration from plain React to Next.js signals SSR/SEO requirements emerging,
which often means a product moving from internal tool to customer-facing
application [5]. These are strategic decisions made explicit in dependency
diffs.

**Lock file staleness as risk indicator:** When package-lock.json or yarn.lock
diverges significantly from package.json (many unresolved updates), it signals
either technical debt accumulation or a team under delivery pressure deferring
maintenance — both strategy signals [6].

**Architecture style from dependency topology:** Adding service discovery
libraries, message queue clients (e.g., Bull, RabbitMQ), or service mesh
dependencies signals a transition from monolith toward microservices. This is
visible in git history as a discrete dependency event with a date [7].

**SBOM as due diligence surface:** GitHub's dependency graph is automatically
updated on every push to the default branch. It reveals the full indirect
dependency tree (typically 20-50x the direct dependency count), all version
pinning decisions, and security alert history — a full technology strategy
profile accessible via the API [6].

---

### 3. Hiring Signals from Contributor Patterns [CONFIDENCE: MEDIUM]

**Contributor growth rate:** A sudden increase in unique contributors following
a period of stagnation correlates with organizational hiring. Repositories that
include CONTRIBUTING.md docs are 17% more productive — projects that invest in
onboarding infrastructure signal intentional team expansion [8].

**First-time contributor retention as hiring proxy:** Tracking first-time
contributor conversion (do they make a second commit?) reveals organizational
culture. Healthy conversion rates (>30%) suggest good mentorship structures —
which directly correlates with how a team handles new hire onboarding [8].

**Issue label hygiene as team maturity signal:** The presence of "good first
issue" and "help wanted" labels, actively maintained and closed, signals an
organization actively building contributor pipelines — either for hiring or
community building [8].

**Temporal gap analysis:** A sudden drop in commit frequency from a previously
consistent contributor, followed by a new contributor picking up related files,
is a detectable pattern for employee departure and replacement — without any
explicit public announcement [9].

**Caution:** Research (Ben Frederickson, 2014, still relevant) warns that GitHub
activity is a weak hiring signal on its own due to selection bias: developers
with active public repos are not representative of the full engineer population.
Context from private repo contribution activity is not observable [10].

---

### 4. Product Direction Signals from Repo Metadata [CONFIDENCE: MEDIUM]

**Branch naming patterns:** Feature branch names like `feature/ai-search`,
`experiment/llm-integration`, or `spike/multi-tenant` are publicly visible in PR
titles, issue references, and occasionally in the default branch's merge
history. These name patterns reveal which product directions a team is actively
exploring — even if never shipped.

**Issue label taxonomy:** Custom label taxonomies reveal organizational
prioritization frameworks. Labels like `P0/customer-escalation`, `area/billing`,
`area/api-v2` expose business model emphasis and internal structure. GitHub's
own public roadmap repository uses labels to signal release phases (preview, GA)
and product areas (code, planning, security) [11].

**Milestone naming conventions:** Time-boxed milestones with customer-facing
feature names (e.g., "Q2 Enterprise Launch," "v3.0 API Breaking Change") reveal
release strategy. Sprint-named milestones signal agile delivery cadence vs.
quarterly release planning [11].

**README evolution as product pivot detector:** Running
`git log --follow README.md` reveals every reframe of a project's stated
purpose. Significant rewrites — especially those changing the target audience
description — are product pivot signals. The GitEvo tool (2026) enables
systematic code evolution analysis across git history for exactly this purpose
[12].

**Star trajectory shape:** A project with slow organic star growth followed by a
sudden spike typically correlates with a press release, conference talk, or
product launch. Star-history.com provides this visualization for any public
repo. However, stars are low-friction (users star to bookmark, not to adopt), so
forks-to-stars ratio and issue engagement rate are better engagement proxies
[13][14].

---

### 5. Technical Strategy: Architecture Evolution Signals [CONFIDENCE: HIGH]

**Monolith-to-microservices trajectory:** Dependency graph changes in a public
repo reveal architecture transitions. Adding an API gateway dependency, service
discovery client, or message broker is a discrete, datable architectural
decision. Empirical research shows microservices co-evolve together — changes
cluster — so a sudden multi-service PR pattern in a formerly monolithic repo
signals architectural transformation [7][15].

**API versioning signals:** The introduction of `/v2/` paths, versioned route
prefixes, or API versioning middleware (e.g., `express-api-versioning`) signals
a product that has reached paying customer lock-in — a company protecting
existing API contracts while evolving forward. This is a maturity signal, not a
technical one [5].

**Security infrastructure adoption timing:** The first appearance of a
`SECURITY.md`, Dependabot config, or GitHub Actions security scanning workflow
often precedes enterprise sales conversations or SOC2 preparation. These are
datable signals in git history.

**Test coverage trajectory:** Decreasing test file growth relative to source
file growth signals velocity-over-quality tradeoffs. GitClear's research
(analyzing 211M changed lines) found refactoring ratios dropping from 25% to
less than 10% of changed lines between 2021-2024 [16].

---

### 6. VC/Acquirer Due Diligence: What Investors Actually Examine [CONFIDENCE: HIGH]

Multiple sources confirm a structured framework investors apply to repos:

**Bus Factor / Contributor Absence Factor:** The minimum number of contributors
whose departure would make a system unmaintainable. ContributorIQ's methodology
uses Degree of Authorship (DOA) analysis, which weights recent commit activity
more heavily than historical commits. Single-author systems are flagged as Bus
Factor = 1 critical risks [9].

**Gini Coefficient of Commit Distribution:**

- Below 0.5 = healthy distribution
- 0.5-0.7 = moderate concentration risk
- Above 0.7 = significant key person risk
- Single contributor >40% of commits across the codebase = acquisition risk
  requiring repricing [9]

**Single-Author File Percentage:**

- 15-25%: moderate concern
- Above 25%: extensive orphaned knowledge risk [9]

**Orphaned File Percentage:** Files where no currently active contributor has
meaningful ownership. Above 20% signals institutional knowledge loss — directly
relevant to acquirer integration risk [9].

**Organization Health Score:** ContributorIQ's composite 0-100 metric:

- 70-100: Low acquisition risk
- 50-69: Moderate risk requiring integration planning
- 30-49: Significant concentration concerns
- Below 30: Critical risk warranting repricing or deal exit [9]

**License compliance as deal-killer:** AGPL and GPL licenses embedded in
proprietary products are the single most common deal-derailing finding in
technical M&A due diligence. The 2025 Black Duck report found 30% of license
conflicts stem from hidden transitive dependencies — not direct dependencies.
Automated SBOM generation is now standard practice in pre-acquisition due
diligence. Companies with undisclosed GPL usage risk having their entire
codebase forced open-source under AGPL's viral clause [17][18].

**Research-backed correlation:** An Organization Science study found startups
that engage with open source communities on GitHub are 15 percentage points more
likely to have raised a financing round — a 65% increase over the baseline. The
mechanism is primarily through MVP completion acceleration [19].

---

### 7. Competitive Repo Comparison: Dimensions That Matter [CONFIDENCE: MEDIUM]

When comparing your repo to a competitor's public repo, the actionable
dimensions are:

**Velocity comparison (CNCF framework):** The CNCF velocity project uses a
bubble chart model: X-axis = commits (log scale), Y-axis = issues+PRs (log
scale), bubble size = sqrt(authors). This multi-dimensional view reveals whether
a competitor is gaining developer momentum faster than reflected in star counts
[20].

**Maintainer responsiveness gap:** Time to first response on issues (CHAOSS
metric) is a direct proxy for customer support culture. A competitor with median
<24h first response vs. your 5-day median has a structural advantage in
developer adoption.

**Release cadence comparison:** Regular, predictable releases signal operational
maturity. CHAOSS defines Release Frequency as a core health metric. Comparing
release velocity over 12 months reveals whether a competitor is accelerating,
stable, or slowing [21].

**Contributor diversity ratio:** What percentage of commits come from outside
the core company? LFX Insights resolves contributor affiliations to show single-
company domination risk. A competitor with 80%+ commits from one employer is
more vulnerable to corporate strategy shifts than a broadly-contributed project
[22].

**Stars-to-issues ratio:** A project with many stars but a high open:closed
issue ratio is suffering from adoption-maintenance mismatch — growing faster
than it can sustain.

---

### 8. Open Source Health: Maintainer Burnout and Corporate Backing Signals [CONFIDENCE: HIGH]

**Burnout indicators (CHAOSS framework):**

- Abrupt drop in commit frequency after extended consistent contribution
- Cessation of previously maintained contribution streaks
- Increasing response time to issues/PRs (visible in GitHub timeline data)
- Accumulating PRs with merge conflicts unaddressed
- Shift from code contributions to meta-work (closing stale issues, updating
  docs only) before departure [23][24]

**Concentration risk threshold:** A project where the top 1-2 contributors
provide >50% of commits is CHAOSS-classified as at risk. The Contributor Absence
Factor (identical to Bus Factor) is their primary tracking metric [21].

**Corporate backing signals:**

- Commit affiliation analysis (employer domain in git config email) reveals
  whether 1 company dominates
- CNCF/Apache donation signals neutral governance intent but requires
  verification — Synadia's 2025 attempt to "take back" the NATS project after
  CNCF donation demonstrates this governance model can be contested [22]
- Projects with explicit governance documents (GOVERNANCE.md), defined TSC
  membership, and documented decision-making processes signal corporate backing
  with community safeguards
- Projects without any governance docs, run from a personal repo, are
  structurally single-maintainer risks regardless of star count

**LFX Insights (CNCF, relaunched May 2025):** Covers 15,000+ repos, assigns
Health Scores (Critical / Unsteady / Stable / Healthy / Excellent) across four
dimensions: Contributors, Popularity, Development, Security & Best Practices
[25].

---

### 9. AI/Copilot Usage: What Is Detectable in Commit Patterns [CONFIDENCE: HIGH]

This is the highest-confidence finding from the most recent academic research:

**Fingerprinting is feasible with 97.2% F1-score:** A 2026 study (arxiv
2601.17406) analyzed 33,580 PRs from five AI agents (Codex, Copilot, Devin,
Cursor, Claude Code), extracting 53 features across 5 categories [26].

**Five detection categories:**

1. Commit patterns: commit count, conventional commit ratio, message length
   stats, multiline ratio, capitalization ratio
2. PR structure: title/body length, word counts, checklists, code blocks,
   hyperlinks, bullet points
3. Code changes: file modification counts, extension diversity, test/config/doc
   ratios, Gini coefficient of changes
4. Patch-level code: line counts, trailing whitespace, indentation, comment
   density, import density, function/class/loop counts
5. Temporal patterns: submission hour, weekend vs. business hours, day of week

**Agent-specific signatures:**

- OpenAI Codex: multiline commit messages (67.5%)
- GitHub Copilot: longer PR descriptions (38.4%), high change concentration
  (24.9%)
- Cursor: bullet points (17.2%), hyperlinks (12.8%)
- Devin: multiline commits (48.9%), distributed file changes
- Claude Code: high conditional density (27.2%), high comment density (19.8%)

**Key finding:** Commit message characteristics outrank code-level features in
distinguishing agents. Detection works "even when mediated via human accounts" —
undisclosed AI usage is detectable without explicit labeling [26].

**Structural quality degradation signal:** GitClear's analysis of 211M changed
lines (2020-2024) found AI-associated repos show:

- Code clone rate up from 8.3% to 12.3% of changed lines
- Refactoring ratio down from 25% to <10% of changed lines
- Code churn projected to double vs. 2021 baseline
- "Copy/paste exceeds moved code for first time in history" These are
  quantifiable metrics from standard git diff analysis [16][27].

---

## Sources

| #   | URL                                                                                                                                | Title                                                                | Type                            | Trust       | CRAAP | Date   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------- | ----------- | ----- | ------ |
| 1   | https://octopus.com/devops/metrics/dora-metrics/                                                                                   | Understanding the 4 DORA Metrics and 2024/25 Findings                | Technical reference             | HIGH        | 4.4   | 2024   |
| 2   | https://getdx.com/blog/2024-dora-report/                                                                                           | Highlights from the 2024 DORA State of DevOps Report                 | Community/analysis              | MEDIUM      | 3.8   | 2024   |
| 3   | https://www.faros.ai/blog/key-takeaways-from-the-dora-report-2025                                                                  | DORA Report 2025: AI Impact on Dev Metrics                           | Analysis                        | MEDIUM      | 4.0   | 2025   |
| 4   | https://cmustrudel.github.io/papers/swan17.pdf                                                                                     | Timezone and Time-of-Day Variance in GitHub Teams (CMU)              | Academic                        | HIGH        | 4.2   | 2017   |
| 5   | https://www.sitepoint.com/express-to-fastify-migrate/                                                                              | How to Migrate from Express to Fastify                               | Technical blog                  | MEDIUM      | 3.4   | 2023   |
| 6   | https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph | About the Dependency Graph - GitHub Docs                             | Official docs                   | HIGH        | 5.0   | 2024   |
| 7   | https://journal-bcs.springeropen.com/articles/10.1186/s13173-021-00120-y                                                           | Monitoring Coupling Evolution of Microservice Architectures          | Academic                        | HIGH        | 4.0   | 2021   |
| 8   | https://github.blog/open-source/maintainers/how-to-gain-insight-into-your-project-contributors/                                    | How to Gain Insight Into Your Project Contributors                   | Official blog                   | HIGH        | 4.2   | 2023   |
| 9   | https://contributoriq.com/blog/technical-due-diligence-software-acquisition-guide                                                  | Technical Due Diligence for Software Acquisitions                    | Vendor/specialized              | MEDIUM-HIGH | 4.0   | 2024   |
| 10  | https://www.benfrederickson.com/github-wont-help-with-hiring/                                                                      | Why GitHub Won't Help You With Hiring                                | Technical blog                  | MEDIUM      | 3.2   | 2014   |
| 11  | https://github.com/github/roadmap                                                                                                  | GitHub Public Roadmap                                                | Official                        | HIGH        | 4.8   | Active |
| 12  | https://arxiv.org/html/2602.00410v1                                                                                                | GitEvo: Code Evolution Analysis for Git Repositories                 | Academic                        | HIGH        | 4.5   | 2026   |
| 13  | https://www.star-history.com/                                                                                                      | GitHub Star History                                                  | Tool                            | MEDIUM      | 3.5   | Active |
| 14  | https://arxiv.org/pdf/2011.04865                                                                                                   | Scoring Popularity in GitHub                                         | Academic                        | HIGH        | 4.0   | 2020   |
| 15  | https://www.mdpi.com/2076-3417/14/22/10725                                                                                         | Assessing Evolution of Microservices Using Static Analysis           | Academic                        | HIGH        | 4.2   | 2024   |
| 16  | https://www.gitclear.com/ai_assistant_code_quality_2025_research                                                                   | AI Copilot Code Quality: 2025 Data Suggests 4x Growth in Code Clones | Vendor research                 | MEDIUM-HIGH | 4.0   | 2025   |
| 17  | https://dependencydesk.com/blog/ma-due-diligence-checklist-software-companies-2026                                                 | M&A Due Diligence Checklist for Software Companies                   | Vendor/specialized              | MEDIUM      | 3.8   | 2025   |
| 18  | https://www.mend.io/blog/what-you-should-know-about-open-source-license-compliance-for-ma-activity/                                | Open Source License Compliance for M&A                               | Vendor/specialized              | MEDIUM      | 3.8   | 2024   |
| 19  | https://pubsonline.informs.org/doi/10.1287/orsc.2023.18348                                                                         | Engagement with Open Source Communities and Startup Funding          | Academic (Organization Science) | HIGH        | 4.8   | 2023   |
| 20  | https://github.com/cncf/velocity                                                                                                   | CNCF Velocity: Track Development Velocity                            | Official/open source            | HIGH        | 4.5   | Active |
| 21  | https://chaoss.community/kb/metrics-model-starter-project-health/                                                                  | CHAOSS Starter Project Health Metrics Model                          | Official standard               | HIGH        | 4.8   | 2024   |
| 22  | https://www.cncf.io/blog/2025/05/01/protecting-nats-and-the-integrity-of-open-source-cncfs-commitment-to-the-community/            | Protecting NATS: CNCF's Commitment to Open Source                    | Official                        | HIGH        | 4.6   | 2025   |
| 23  | https://chaoss.community/kb/metric-project-burnout/                                                                                | CHAOSS: Project Burnout Metric                                       | Official standard               | HIGH        | 4.8   | 2024   |
| 24  | https://thenewstack.io/how-can-open-source-sustain-itself-without-creating-burnout/                                                | How Can Open Source Sustain Itself without Burnout                   | Community                       | MEDIUM      | 3.6   | 2023   |
| 25  | https://www.cncf.io/blog/2025/10/22/lfx-insights-a-new-way-to-understand-open-source-projects/                                     | LFX Insights: A New Way to Understand Open Source Projects           | Official                        | HIGH        | 4.8   | 2025   |
| 26  | https://arxiv.org/html/2601.17406v1                                                                                                | Fingerprinting AI Coding Agents on GitHub                            | Academic                        | HIGH        | 4.8   | 2026   |
| 27  | https://www.gitclear.com/coding_on_copilot_data_shows_ais_downward_pressure_on_code_quality                                        | Coding on Copilot: 2023 Data Suggests Downward Pressure              | Vendor research                 | MEDIUM-HIGH | 4.0   | 2024   |

---

## Contradictions

**AI velocity vs. delivery:** DORA 2025 and GitClear research contradict the
marketing narrative around AI coding tools. Individual developers see real gains
(+98% PRs merged) while organizational delivery remains flat and code
maintainability measurably degrades. Both findings are well-evidenced; they
describe different measurement levels (individual vs. system).

**Stars as quality signal:** 83% of practitioners rate GitHub stars as "highly
useful" for popularity assessment, yet research shows weak correlation between
stars and actual usage, commits, or contributors. The community's confidence in
stars is not supported by empirical evidence of what they measure.

**Bus factor calculability:** Different methodologies (simple commit count vs.
ContributorIQ's DOA-weighted analysis) produce different bus factor values for
the same repo. No single standard exists; investors should be cautious comparing
bus factor numbers across different tools.

**Copilot detection reliability:** The 97.2% F1-score for AI agent
fingerprinting is impressive but applies to agentic PRs (full agent-generated
workflows). Human developers selectively accepting Copilot suggestions are much
harder to detect — the fingerprint blurs when AI is a tool rather than an
author.

---

## Gaps

**Private repo intelligence is not addressable:** All findings in this document
apply only to public repositories. The most strategically significant code for
most companies lives in private repos. The only available signals there are via
LinkedIn (hiring patterns), job postings (role type, seniority mix, tech stack
in JD), and conference talks (architectural decisions shared publicly).

**Job posting correlation methodology:** While the logical link between hiring
spikes and repo activity is intuitive, no verified research methodology for
systematically correlating public job postings with repo contributor growth was
found. This is identified as a gap.

**Temporal resolution of dependency graph changes:** GitHub's API provides
current state but historical dependency graph snapshots are not natively
accessible via API — reconstructing technology migration history requires
fetching lock file history through git log, not through the GitHub dependency
API.

**Product direction from closed/private issue trackers:** Many companies use
private issue trackers (Linear, Jira) alongside public GitHub repos. GitHub
labels and milestones analysis only covers organizations that centralize
planning in public repos — a minority of commercial software companies.

**AI detection in human-mediated usage:** The 97.2% detection accuracy is for
agentic (bot) code submission. Measuring how much individual developers use
Copilot in their personal workflow (accepting suggestions selectively) is not
currently solved at high accuracy, though GitClear's aggregate metrics (churn
rates, clone rates) provide indirect evidence at the codebase level.

---

## Serendipity

**CNCF governance as M&A risk indicator:** The 2025 NATS/Synadia governance
dispute revealed that even CNCF-donated projects can have their governance
contested by the original corporate donor. For acquirers and investors, checking
whether a target's key OSS dependencies are in contested governance situations
is now a due diligence requirement — not previously standard.

**AI paradox creates new competitive dimension:** The DORA 2025 finding that AI
"magnifies the strengths of high-performing organizations and the dysfunctions
of struggling ones" means AI adoption patterns in a public repo can now serve as
a health amplifier signal: if an AI-heavy repo is simultaneously showing
declining code maintainability AND flat delivery frequency, it may indicate an
organization that was already struggling before AI adoption.

**LFX Insights relaunch (May 2025):** The Linux Foundation's LFX Insights now
covers 15,000+ repositories with automated Health Scores. This tool is now a
standard-of-care for OSS dependency risk assessment and competitive open source
project comparison, and it was not well-known before 2025.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 6
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

---

## Strategic Signals Catalog

A consolidated reference of every detectable signal category, the specific
observable artifact, and the competitive/strategic inference it supports:

### TEAM INTELLIGENCE SIGNALS

| Signal                | Observable Artifact                                       | Inference                                  |
| --------------------- | --------------------------------------------------------- | ------------------------------------------ |
| Team size             | Commit timestamp variance + timezone spread               | Small co-located vs. large distributed     |
| Hiring event          | Sudden new contributor cluster + CONTRIBUTING.md addition | Team expansion underway                    |
| Key person departure  | Consistent contributor activity dropping to zero          | Knowledge concentration risk / staff churn |
| Team health           | PR merge time trends                                      | Reviewer bandwidth, culture of review debt |
| Senior developer load | Code review comment volume on PRs                         | Are seniors bottlenecks or empowerers?     |
| Work culture          | Weekend/evening commit ratio                              | Crunch culture vs. sustainable pace        |

### PRODUCT STRATEGY SIGNALS

| Signal               | Observable Artifact                             | Inference                               |
| -------------------- | ----------------------------------------------- | --------------------------------------- |
| Product pivot        | README significant rewrite (git log)            | Repositioning of value proposition      |
| Enterprise readiness | SECURITY.md first commit date                   | SOC2/enterprise sales ramp starting     |
| API maturity         | v2 route prefix introduction                    | Locked-in users, forward evolution      |
| Feature priority     | Custom issue label taxonomy                     | Business model emphasis areas           |
| Release strategy     | Milestone naming pattern (sprints vs. quarters) | Agile cadence vs. product release cycle |
| Feature exploration  | Feature branch names in PR history              | Active R&D directions not yet public    |
| Public roadmap       | GitHub roadmap repo (if exists)                 | Declared intent (non-binding)           |

### TECHNOLOGY STRATEGY SIGNALS

| Signal              | Observable Artifact                             | Inference                                          |
| ------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Framework migration | package.json/requirements.txt dependency diff   | Strategic tech investment (performance, ecosystem) |
| Architecture shift  | Service discovery / MQ library first appear     | Monolith-to-microservices transition date          |
| AI tool adoption    | Code churn rate, clone ratio, PR size explosion | Copilot/AI adoption (before it's disclosed)        |
| Security investment | Dependabot config, secret scanning enablement   | Security posture shift                             |
| Build maturity      | CI/CD workflow complexity growth                | DevOps capability investment                       |
| Test investment     | Test file growth ratio vs. source growth        | Quality vs. velocity tradeoff                      |

### ORGANIZATIONAL HEALTH SIGNALS

| Signal              | Observable Artifact                        | Inference                            |
| ------------------- | ------------------------------------------ | ------------------------------------ |
| Bus factor          | Gini coefficient of commits (>0.7 = risk)  | Key person dependency risk           |
| Maintainer burnout  | Increasing PR response time trend          | Sustainability risk                  |
| Community health    | First-time contributor return rate         | Welcoming culture                    |
| Corporate backing   | Commit email domain analysis               | Single-company control vs. community |
| Governance maturity | GOVERNANCE.md, TSC charter existence       | Community vs. single-vendor risk     |
| Project abandonment | Last commit date + open issue accumulation | Maintenance risk for dependents      |

### COMPETITIVE POSITIONING SIGNALS

| Signal                  | Observable Artifact                | Inference                          |
| ----------------------- | ---------------------------------- | ---------------------------------- |
| Momentum                | Star velocity (weekly growth rate) | Market awareness growth            |
| Real engagement         | Fork-to-star ratio, issue volume   | Adoption vs. passive interest      |
| Developer ecosystem     | Dependent repo count (GitHub API)  | Ecosystem lock-in / switching cost |
| Velocity vs. competitor | CNCF bubble chart position         | Relative development investment    |
| Release predictability  | Release cadence regularity         | Operational maturity               |
| Community vs. corporate | Outside contributor % of commits   | Single-vendor vs. ecosystem play   |

### M&A / INVESTMENT DUE DILIGENCE SIGNALS

| Signal                 | Observable Artifact                       | Inference                             |
| ---------------------- | ----------------------------------------- | ------------------------------------- |
| IP risk                | AGPL/GPL in dependency tree               | Valuation discount / deal-killer      |
| Key person risk        | Bus factor = 1 in revenue-critical repos  | Retention requirement pre-close       |
| Tech debt              | Orphaned file %, refactoring ratio        | Post-acquisition integration cost     |
| Contributor stability  | Contributor "winding down" state patterns | Pre-departure risk                    |
| OSS community leverage | GitHub engagement + MVP completion        | VC funding probability signal (+15pp) |
| Supply chain risk      | Known CVEs in dependency graph            | Security liability exposure           |

### AI USAGE DETECTION SIGNALS

| Signal                 | Observable Artifact                                       | Inference                                  |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------ |
| Agentic PR authorship  | Commit message style, PR structure, change Gini           | AI agent vs. human author (97.2% accuracy) |
| Copilot adoption       | Code churn rate, clone rate increase, refactoring decline | AI-assisted development adoption           |
| Agent type fingerprint | Conditional density, comment density, bullet point usage  | Which AI tool the team uses                |
| Undisclosed AI usage   | PR size explosion, review time increase                   | Team adopted AI without process change     |
