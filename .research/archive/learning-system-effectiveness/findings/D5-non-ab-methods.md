# Findings: How do you measure developer tool impact when A/B testing isn't possible?

**Searcher:** deep-research-searcher **Profile:** academic + web **Date:**
2026-04-03T00:00:00Z **Sub-Question IDs:** SQ-5

---

## Key Findings

### 1. Interrupted Time Series (ITS) Analysis is the Most Applicable Method for Solo Developer Tool Impact [CONFIDENCE: HIGH]

ITS is designed precisely for situations with no control group: you measure a
metric repeatedly before and after an intervention, fit a segmented regression
model, and test whether the level or slope of the outcome changed at the
intervention point. The canonical model is:

```
Yt = β0 + β1·T + β2·Xt + β3·T·Xt
```

Where β2 captures immediate level change and β3 captures trajectory (slope)
change post-intervention [1][2].

For a solo developer, each tool introduction (e.g., adding a pattern checker,
adopting a linter rule, enabling a pre-commit hook) is a natural "intervention."
The outcome series could be: defects-per-week, build failure rate, hook
violations per commit, or time-to-close a category of issue.

**Minimum data requirements are real constraints.** Segmented regression (OLS)
requires roughly 12 pre- and 12 post-intervention points minimum for adequate
power to detect a moderate effect. ARIMA-based ITS (which handles
autocorrelation better) needs 50+ points — likely impractical for a solo
developer measuring weekly. Equal distribution before/after strengthens the
design but is not required [3][4].

**What ITS controls for automatically:** slowly-changing confounders, secular
trends, and regression to the mean. It does NOT control for time-varying
confounders (a major project shift, learning a new technology, seasonality) that
coincide with the intervention [2][5].

**Practical mitigation for confounders:** include measured covariates directly
in the regression; document any concurrent changes at intervention time; use
"multiple baseline" design by staggering introduction of different tools at
different dates to create internal comparisons.

---

### 2. Google's CausalImpact Package Extends ITS with Bayesian Methods — Workable for Solo Use [CONFIDENCE: MEDIUM-HIGH]

CausalImpact (Google, open source) uses a Bayesian structural time series model.
Unlike standard ITS, it constructs a counterfactual ("what would have happened
without the intervention") rather than fitting a segmented line. If you have
multiple related metrics (e.g., "violations of type A" and "violations of type
B"), an unaffected series can serve as a control covariate even without a second
group [6].

Key requirements:

- Pre-intervention period: needs enough history to train the model. The official
  documentation illustrates usage with 70 pre-period and 30 post-period
  observations.
- Control series (strongly recommended): unaffected correlated metrics that can
  act as a synthetic control. For a solo developer, this could be: a different
  category of metric not expected to change with the intervention, or a metric
  from a different project/codebase.
- Three assumptions must hold: (a) control series are not themselves affected by
  the intervention; (b) the pre-intervention relationship between control and
  response is stable post-intervention; (c) priors are set appropriately [6].

**Advantage over standard ITS:** produces credible intervals (probabilistic
uncertainty estimates), handles multiple control covariates simultaneously, and
is less sensitive to autocorrelation. **Disadvantage:** more complex, requires R
or Python, and the analysis quality depends heavily on the choice of control
series [6].

---

### 3. Single-Subject Experimental Designs (SSEDs) From Education and Clinical Psychology are Directly Applicable [CONFIDENCE: HIGH]

SSEDs are the canonical approach when you study one person and cannot compare
against others. The subject serves as their own control across phases. Three
design subtypes matter here [7][8]:

**AB Design** (simplest): Baseline phase A (pre-tool), then intervention phase B
(post-tool). Minimum 5 data points per phase (3 acceptable with reservations).
Evaluate by visual inspection of level, trend, and variability changes. This is
the weakest design because "history" confounds (something else changed
simultaneously) cannot be ruled out.

**ABA Reversal Design**: Baseline → Intervention → Return to Baseline. Proves
the effect is reversible and tied to the tool. Impractical for many dev tools
(you can't un-learn a habit), but workable for toggleable process changes
(enable/disable a rule).

**Multiple Baseline Design**: Introduce the intervention at different times
across different metrics or behavior categories. This is the most powerful
design without reversal. For example: introduce tool A on metric M1 at week 4,
introduce tool B on metric M2 at week 8. If M1 changes at week 4 but M2 doesn't,
and then M2 changes at week 8 but not before, the staggering strongly implicates
each tool. This design requires 3+ demonstration of effect and is explicitly
used when reversal is impractical [7].

**Effect size for SSEDs** uses different metrics than Cohen's d:

- **Nonoverlap of All Pairs (NAP)**: percentage of baseline-phase data pairs
  where the intervention-phase value is more extreme. Easy to compute by hand.
- **Baseline Corrected Tau (BCT)**: extends NAP to handle baseline trends.
- **Log-Response Ratio**: percentage change from baseline to intervention mean.
  Directly interpretable.
- **Between-Case Standardized Mean Difference (BC-SMD)**: comparable to Cohen's
  d but adjusted for within-individual autocorrelation [9].

The What Works Clearinghouse SCED standards require: active manipulation of IV,
systematic measurement, interrater agreement on 20%+ of data, and replication of
effect (at least 3 demonstrations) [7].

---

### 4. Regression Discontinuity Design Applies Only in Specific Edge Cases [CONFIDENCE: MEDIUM]

Regression Discontinuity Design (RDD) works by identifying a sharp threshold in
a running variable that determines treatment assignment. For developer tooling,
this requires: a rule or threshold that determined _when_ the tool was
introduced, not choice [10].

A clean application would be: "We introduced a stricter linter rule when
SonarCloud violations exceeded threshold X." In that case, developers just below
the threshold are a natural comparison group. However, for a solo developer
where tool introduction is deliberate and discretionary, RDD does not apply
cleanly. The threshold logic collapses — there is no population of "units"
stradling the cutoff [10].

**Practical verdict:** RDD is the wrong tool for the typical case of "I chose to
add this on date D." ITS or SCED are more appropriate. RDD becomes viable only
if tool introduction was triggered by a measurable external threshold condition.

---

### 5. Natural Experiments from Pattern Checker / Linter Introduction Provide Plausible Causal Evidence [CONFIDENCE: MEDIUM-HIGH]

When a pattern check rule is added to a pre-commit hook or CI system, the
history of violations before the rule existed (from retrospective scanning of
prior commits) versus after constitutes a natural experiment [11][12].

The logic:

1. Retroactively scan commit history to count how many commits would have
   triggered the new rule — this gives you the pre-intervention violation rate.
2. Track actual violations caught (and fixed or bypassed) post-introduction.
3. The change in violation rate is your effect estimate.

This approach is particularly strong because:

- The "treatment" is binary and clearly dated
- The outcome (violation count) is objective and automatable
- Seasonality and maturation confounds are minimal in short windows

**ESLint's bulk suppressions feature** introduced in 2025 actually captures
exactly this: it logs pre-existing violation counts per file and rule at the
time of rule introduction, giving a baseline snapshot [13].

Key threat: if the engineer changes how they write code _anticipating_ the rule
(before it's enabled), pre-intervention counts may underestimate the true
counterfactual. Mitigate by analyzing pre-introduction commits only up to the
date the rule was decided upon, not the date it was announced.

---

### 6. DORA Metrics Apply to Solo Projects at Application Level, but With Caveats [CONFIDENCE: MEDIUM]

DORA's four metrics (Deployment Frequency, Lead Time for Changes, Change Failure
Rate, Time to Restore) are explicitly designed for "one application or service
at a time" rather than individual persons [14]. For a solo developer with a
single project, this distinction is moot — the unit is both the application and
the individual.

**Deployment Frequency** and **Lead Time for Changes** are directly measurable
from git history and CI/CD logs with no tooling beyond standard pipelines.

**What DORA can support:** tracking whether a new tool moved the project from
one performance tier (Elite/High/Medium/Low) to another. The DORA Quick Check
baseline + repeat assessment is explicitly recommended for trend tracking [14].

**Limitation for solo developers:** Change Failure Rate requires a defined
failure event (failed deploy, incident). For a solo project with infrequent prod
failures, this metric may have too few events per period to be statistically
meaningful. Lead Time and Deployment Frequency are more actionable.

DORA cautions against using these metrics to compare individuals and against
"disparate comparisons" across applications — but longitudinal self-comparison
for a single application is its intended use case [14].

---

### 7. The SPACE Framework at Individual Level is Partially Applicable [CONFIDENCE: MEDIUM]

SPACE (Satisfaction/Wellbeing, Performance, Activity,
Communication/Collaboration, Efficiency/Flow) was designed to be measured across
individual, team, and organizational levels simultaneously. For individual
measurement without a team, only three dimensions retain full meaning [15][16]:

| Dimension       | Solo-applicable metrics                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| Satisfaction    | Subjective survey items (weekly self-rate)                                   |
| Performance     | Code review outcome, bug escape rate, feature delivery against goal          |
| Activity        | Commits, PRs, deployment events (but noisy and gameable)                     |
| Communication   | Mostly team-level; not applicable solo                                       |
| Efficiency/Flow | Time-in-deep-work, context switches, interrupt count (RescueTime-class data) |

**Key insight from the original paper:** SPACE explicitly warns against using
activity metrics alone. They should always be combined with at least one each
from satisfaction, performance, and efficiency dimensions. For before/after tool
impact measurement, pairing an activity metric (raw count) with a performance
metric (defect rate, review rejection rate) and a flow metric (time to complete
task type X) gives triangulated evidence [15].

---

### 8. PSP (Personal Software Process) Is the Academic Precedent for Individual-Level Process Improvement Measurement [CONFIDENCE: HIGH]

Watts Humphrey's Personal Software Process (CMU/SEI, 1995) is the canonical
method for individual developer self-measurement of process improvement. PSP
collects four core measures: Size (LOC), Effort (minutes per phase), Quality
(defect count by phase), and Schedule (planned vs. actual) [17][18].

PSP's proof-of-improvement methodology:

1. Establish baseline across first 3-5 projects using consistent measurement
   forms
2. Track defect injection rate (defects per KLOC introduced in design, code,
   etc.)
3. Track defect removal rate (% removed before testing)
4. Compare across sequential projects — improvement manifests as decreasing
   defect density and increasing yield

**Key caution from academic literature:** A 1998 IEEE paper explicitly flags PSP
measurement validity concerns [19]:

- Self-reported data is subject to recording bias (you undercount defects you
  fix silently)
- Early projects have learning curve overhead that inflates baseline values
  artificially
- Improvement may reflect "familiarity with measurement" rather than genuine
  process change

**Mitigation strategy:** use objective automated measures (automated defect
detection counts, build failure rates, hook violation counts) rather than manual
logs. Automated metrics are immune to recording bias.

---

### 9. Bayesian Approaches to Small-Sample Effectiveness Measurement Offer Honest Uncertainty Quantification [CONFIDENCE: MEDIUM-HIGH]

For a solo developer with limited data points (e.g., 8-10 weeks pre/post),
frequentist hypothesis testing is likely underpowered. Bayesian methods provide
the right framework because they produce probability distributions over effect
size rather than binary p-value verdicts [20][21].

**Practical approaches:**

**Bayesian Changepoint Detection (BOCPD/BEAST):**

- Computes posterior probability that a change point occurred at each time step
- Useful when you did NOT pre-specify an intervention date (i.e., exploratory
  analysis of which tool changes had impact)
- R package `Rbeast`, Python package `bayesian-changepoint-detection`
- Works with small samples; Bayesian methods need smaller window sizes than
  ARIMA [21]

**CausalImpact (already covered in Finding 2):**

- When you KNOW the intervention date, CausalImpact is more appropriate
- Produces posterior distribution over the counterfactual, yielding a credible
  interval for the effect [6]

**Bayesian pre/post comparison with informative priors:**

- If you have prior knowledge about typical variability (e.g., "my violation
  rate historically fluctuates ±20%"), you can incorporate this as a prior
- Avoids overfitting to noise in small samples
- Sensitivity analysis (testing multiple prior specifications) is essential
  since small samples give priors outsized influence [20]

**Key limitation:** for very small samples (N < 10 per phase), Bayesian
estimates are highly sensitive to prior specification. The output is still
uncertain; it just represents uncertainty honestly rather than falsely claiming
significance [20].

---

### 10. Key Confounds in Solo Developer Before/After Studies — and How to Address Them [CONFIDENCE: HIGH]

Six categories of validity threats specifically affect single-group pre/post
designs [22][23]:

| Threat                      | Mechanism                                                                                  | Mitigation for Dev Tooling                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| History                     | Another change happened at same time                                                       | Document all concurrent changes; stagger interventions; use multiple-baseline design            |
| Maturation                  | Natural skill growth explains improvement                                                  | Establish baseline over 8+ weeks to see natural rate of change; compare to pre-tool trend slope |
| Learning curve effect       | Tool adoption itself causes initial disruption followed by rebound (confounds post-period) | Exclude first 2-4 weeks post-introduction as "adoption period"; measure stabilized performance  |
| Regression to mean          | Baseline measured during unusually bad period                                              | Use median of multiple weeks as baseline; avoid measuring just after a spike event              |
| Testing effect              | Awareness of being measured changes behavior                                               | Use automated, non-visible metrics (CI logs, git history analysis) rather than self-reports     |
| Seasonal/workload variation | Project phase (e.g., pre-launch crunch vs. maintenance) changes all metrics                | Match pre/post to similar project phases; note project phase as covariate                       |

The METR 2025 study of AI tool impact explicitly catalogued 20 potential
confounders and evaluated each — showing the discipline required for rigorous
before/after causal claims [24].

**The learning curve confound is particularly salient:** in the 2025 METR RCT,
developers predicted AI would speed them up 24% but actually slowed down 19% —
partly because familiarity with a new tool creates overhead that degrades before
it improves. This means a naive before/after measurement of a new dev tool will
capture the adoption trough as the post-intervention signal unless you design
around it [24].

---

### 11. PDCA / Kaizen Cycles as a Lightweight Practical Framework [CONFIDENCE: MEDIUM]

For a solo developer who cannot implement formal statistical designs, the PDCA
(Plan-Do-Check-Act) cycle from lean manufacturing provides a minimal viable
structure [25]:

1. **Plan**: Define which metric you're measuring (must be specific and
   automatable) and what change you're introducing
2. **Do**: Implement the tool/process change; continue measuring
3. **Check**: Compare the metric against the baseline period; note confounders
4. **Act**: If improvement is confirmed, standardize it; if not, investigate why

The cycle's analytical rigor comes from the "Check" phase being data-driven
rather than intuitive. For developer tools, this means pre-defining success
criteria before introducing the change — not after seeing the data. An InfoQ
2024 article explicitly adapted PDCA to AI code generation tool adoption,
emphasizing that "retrospection asserting accountability" is the critical
discipline [25].

This is less methodologically rigorous than ITS or SCED but substantially better
than no measurement at all, especially when data is too sparse for statistical
analysis.

---

## Sources

| #   | URL                                                                                                      | Title                                                              | Type                    | Trust       | CRAAP | Date |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------- | ----------- | ----- | ---- |
| 1   | https://pmc.ncbi.nlm.nih.gov/articles/PMC5407170/                                                        | ITS Regression for Public Health Interventions: A Tutorial         | Peer-reviewed, PMC      | HIGH        | 4.5/5 | 2017 |
| 2   | https://www.numberanalytics.com/blog/mastering-interrupted-time-series-analysis                          | Mastering Interrupted Time Series Analysis                         | Blog (practitioner)     | MEDIUM      | 3.5/5 | 2024 |
| 3   | https://pmc.ncbi.nlm.nih.gov/articles/PMC6394245/                                                        | Sample Size and Power for OLS ITS Analysis                         | Peer-reviewed, PMC      | HIGH        | 4.5/5 | 2019 |
| 4   | https://journals.sagepub.com/doi/10.1177/01632787251361514                                               | Effect Size and Study Length in Single-Group ITS                   | Peer-reviewed journal   | HIGH        | 4.8/5 | 2025 |
| 5   | https://academic.oup.com/ije/article/47/6/2082/5049576                                                   | Use of Controls in ITS Studies                                     | Peer-reviewed, Oxford   | HIGH        | 4.5/5 | 2018 |
| 6   | https://google.github.io/CausalImpact/CausalImpact.html                                                  | CausalImpact Documentation (Google)                                | Official tool docs      | HIGH        | 4.2/5 | N/A  |
| 7   | https://pmc.ncbi.nlm.nih.gov/articles/PMC3992321/                                                        | SCED for Evidence-Based Practice                                   | Peer-reviewed, PMC      | HIGH        | 4.5/5 | 2014 |
| 8   | https://statsof1.org/2021-08-01-single-case-experimental-design-vs-n-of-1-designs-what-s-the-difference/ | SCED vs N-of-1: What's the Difference?                             | Academic blog           | MEDIUM-HIGH | 4.0/5 | 2021 |
| 9   | https://pmc.ncbi.nlm.nih.gov/articles/PMC8894525/                                                        | Effect Size Measures for SCEDs                                     | Peer-reviewed, PMC      | HIGH        | 4.5/5 | 2022 |
| 10  | https://mixtape.scunning.com/06-regression_discontinuity                                                 | Regression Discontinuity — Causal Inference Mixtape                | Academic textbook (web) | HIGH        | 4.5/5 | 2021 |
| 11  | https://eslint.org/blog/2025/04/introducing-bulk-suppressions/                                           | Introducing Bulk Suppressions (ESLint)                             | Official vendor docs    | HIGH        | 4.0/5 | 2025 |
| 12  | https://www.researchgate.net/publication/350291329                                                       | ITS Using ARIMA for Health Interventions                           | Peer-reviewed           | HIGH        | 4.5/5 | 2021 |
| 13  | https://eslint.org/docs/latest/extend/stats                                                              | ESLint Stats API                                                   | Official vendor docs    | HIGH        | 4.2/5 | 2026 |
| 14  | https://dora.dev/guides/dora-metrics/                                                                    | DORA Metrics Guide (official)                                      | Official vendor docs    | HIGH        | 4.0/5 | 2024 |
| 15  | https://dl.acm.org/doi/10.1145/3454122.3454124                                                           | The SPACE of Developer Productivity (ACM)                          | Peer-reviewed           | HIGH        | 4.8/5 | 2021 |
| 16  | https://linearb.io/blog/space-framework                                                                  | SPACE Metrics Framework 2025 Edition                               | Practitioner blog       | MEDIUM      | 3.5/5 | 2025 |
| 17  | https://en.wikipedia.org/wiki/Personal_software_process                                                  | Personal Software Process — Wikipedia                              | Secondary/encyclopedia  | MEDIUM      | 3.0/5 | 2024 |
| 18  | https://www.sei.cmu.edu/library/the-personal-software-process-psp/                                       | PSP — SEI Library (Humphrey)                                       | Official institutional  | HIGH        | 4.5/5 | N/A  |
| 19  | https://ieeexplore.ieee.org/document/730851/                                                             | PSP: A Cautionary Case Study (IEEE)                                | Peer-reviewed           | HIGH        | 4.5/5 | 1998 |
| 20  | https://www.mdpi.com/2227-7390/9/21/2810                                                                 | Bayesian Inference Under Small Sample Sizes                        | Peer-reviewed, MDPI     | HIGH        | 4.0/5 | 2021 |
| 21  | https://pmc.ncbi.nlm.nih.gov/articles/PMC5464762/                                                        | Survey of Change Point Detection Methods                           | Peer-reviewed, PMC      | HIGH        | 4.5/5 | 2017 |
| 22  | https://conjointly.com/kb/single-group-threats/                                                          | Single Group Threats — Research Methods KB                         | Educational             | MEDIUM      | 3.5/5 | 2024 |
| 23  | https://stats.libretexts.org/Bookshelves/Applied_Statistics/Learning_Statistics_with_R                   | Confounds and Threats to Validity                                  | Academic open textbook  | HIGH        | 4.0/5 | 2024 |
| 24  | https://arxiv.org/abs/2507.09089                                                                         | Measuring Impact of Early-2025 AI on Developer Productivity (METR) | Preprint / academic     | HIGH        | 4.5/5 | 2025 |
| 25  | https://www.infoq.com/articles/PDCA-AI-code-generation/                                                  | PDCA for AI Code Generation                                        | Practitioner article    | MEDIUM      | 3.5/5 | 2024 |
| 26  | https://arxiv.org/html/2509.19708v1                                                                      | Intuition to Evidence: Measuring AI's True Impact                  | Preprint / academic     | HIGH        | 4.3/5 | 2025 |
| 27  | https://link.springer.com/article/10.1007/s11219-006-6000-4                                              | Productivity Benchmarking Using Bayesian Credible Intervals        | Peer-reviewed           | HIGH        | 4.0/5 | 2006 |

---

## Contradictions

**Contradiction 1: Sample size requirements for ITS** The 2019 PMC simulation
study [3] finds that even 12+12 time points can be underpowered if the sample
size per time point is low (i.e., few developers or events per period). But the
2025 Sagepub single-group ITS study [4] and the IJE tutorial [1] suggest
segmented regression is "often feasible" in practice with fewer points.
Reconciliation: the power concern applies most when effect sizes are small (<0.5
SD). For development tool interventions with large effects (e.g., a linter that
catches 30% of a violation class), 12 points may be sufficient. For small
effects, the method is likely underpowered.

**Contradiction 2: AI tool productivity claims** The METR 2025 RCT [24] found AI
tools increased completion time by 19% for experienced developers. The
quasi-experimental longitudinal study of 300 engineers [26] found 61% code
volume increase and 34% PR cycle time reduction for high adopters. These are
contradictory findings. The METR study used a controlled randomized design
(stronger); the 300-engineer study used self-selected adoption cohorts (weaker).
The contradiction may reflect selection bias (developers who adopt more are
already more productive) or task type (the METR study used open-source
maintenance tasks; the larger study used standard enterprise development). For
measurement purposes: these studies illustrate that different metrics (task
completion time vs. code volume shipped) can tell opposing stories, and the
choice of outcome metric matters enormously.

**Contradiction 3: PSP measurement validity** Humphrey's PSP research shows
consistent improvement in defect rates across PSP cohorts [18]. The 1998 IEEE
cautionary case study [19] disputes whether improvement reflects process change
or measurement familiarity / observer effect. This contradiction is unresolved
in the literature. The implication for solo developer measurement: automated
metrics should be preferred over self-reported defect logs wherever possible.

---

## Gaps

1. **No peer-reviewed studies directly applying ITS or SCED to solo developer
   tool adoption.** All ITS literature comes from epidemiology and policy
   evaluation. The translation is methodologically sound but lacks published
   precedent in the software engineering domain.

2. **Bayesian changepoint detection applied to small developer metric datasets
   (< 50 points) is not validated in published literature.** The method is
   technically applicable but its practical performance in this context is
   uncharacterized.

3. **Effect size thresholds for "meaningful improvement" in developer tool
   adoption are not established.** Cohen's d conventions (small = 0.2, medium =
   0.5, large = 0.8) come from psychology and may not translate. No
   domain-specific benchmarks exist for "small" vs. "large" improvement in
   violation rate, defect rate, or cycle time for individual developers.

4. **The learning curve confound and its typical duration for developer tools is
   unstudied.** The METR 2025 study hints at it (weeks of AI adoption overhead
   before productivity stabilizes) but does not quantify the typical
   stabilization period for linters, pattern checkers, or coding assistants.

5. **No academic research on "natural experiment" designs using retroactive
   commit-history scanning as a baseline.** This approach (described in
   Finding 5) is used informally by engineering teams but is not validated or
   published as a methodology.

6. **RDD in software tool adoption context** — no papers found applying this to
   individual developer scenarios. The gap likely reflects that RDD requires
   threshold-based treatment assignment, which is rare in deliberate tool
   adoption decisions.

---

## Serendipity

**Finding: The METR 2025 AI productivity study used a systematic 20-confound
checklist** [24]. This is a directly reusable artifact: a structured checklist
approach to documenting potential confounders at the time of intervention
introduction is a best practice that no study in the solo-developer measurement
literature appears to have formalized. A "confound documentation protocol" run
at the moment a new tool is introduced (recording concurrent changes, project
phase, skill level, workload) would substantially strengthen any subsequent
before/after comparison.

**Finding: ESLint's bulk suppressions system (2025)** [11] creates an artifact —
a violations-per-rule-per-file count at the moment a new rule is introduced —
that is a ready-made ITS baseline for any codebase using ESLint. This is an
underexploited measurement capability in the natural experiment sense.

**Finding: The Bayesian productivity benchmarking approach using credible
intervals for ratios** [27] was published as a software quality journal case
study in 2006 — suggesting this methodological approach has a 20-year precedent
in software quality specifically, though it appears rarely applied in practice
and is underutilized in the developer productivity measurement literature.

---

## Confidence Assessment

- HIGH claims: 6 (ITS applicability, SCED design validity, PSP precedent,
  confound taxonomy, ITS data requirements, DORA application)
- MEDIUM-HIGH claims: 3 (CausalImpact practical utility, natural experiment
  approach, Bayesian small-sample approach)
- MEDIUM claims: 3 (RDD limited applicability, SPACE individual-level metrics,
  PDCA as lightweight framework)
- LOW claims: 0
- UNVERIFIED claims: 0

**Overall confidence: MEDIUM-HIGH**

The methodological literature on ITS, SCED, and causal inference without control
groups is well-established (HIGH confidence from Tier 1 sources). The
translation of these methods to solo developer tool measurement specifically is
logical and supportable but lacks published direct precedent (caps the overall
assessment at MEDIUM-HIGH). All claims are supported by at least one Tier 1 or
Tier 2 source.
