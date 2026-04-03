# Findings: Can Learning System Effectiveness Be Measured Retroactively?

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-04-03 **Sub-Question ID:** SQ-4

**Context:** A project with 260+ sessions, 500+ PR reviews, 170+ review records
in JSONL, git history since Jan 2025. Can the learning system's effectiveness be
assessed retroactively WITHOUT adding new instrumentation?

---

## Key Findings

### 1. The SZZ Algorithm: Proven Retroactive Bug-Introduction Detection [CONFIDENCE: HIGH]

The SZZ algorithm (Sliwerski, Zimmermann, Zeller 2005) is the foundational
technique for retroactively identifying "violation introduced, then fixed"
cycles from git history alone. It works by:

1. Finding bug-fixing commits via keyword search in commit messages (fix, bug,
   closes #N)
2. Using `git blame` on modified lines to trace back to the commit that
   introduced each changed line
3. Mapping fix-commits back to their introducing commits automatically

Multiple open-source implementations exist: SZZUnleashed, B-SZZ, Neural SZZ. The
algorithm is well-validated in MSR literature and requires only git history
access — no new instrumentation.

**Applicability to the 260-session project:** The project's commit messages
(structured with conventional commits or session-log patterns) and hook
violation fix history make SZZ directly applicable. Running SZZ on the repo
would retroactively produce a dataset of "violation introduced at commit X,
fixed at commit Y" with timestamps for every bug/hook fix in the history.

**Limitation:** SZZ struggles with "tangled commits" (one commit fixes multiple
unrelated issues) and "ghost commits" (fixes with no traceable introduction).
Precision reported at ~60-80% in empirical studies. [1][2][3]

---

### 2. Git Pickaxe (-S/-G Flags): Direct Pattern Lifecycle Tracking [CONFIDENCE: HIGH]

Git's built-in "pickaxe" search (`git log -S <string>` and `git log -G <regex>`)
can retroactively track when any specific code pattern was introduced and when
it was removed across the full project history:

- `-S <string>`: Shows commits where the count of the string changed (introduced
  or removed)
- `-G <regex>`: Shows commits where any added/deleted line matches the pattern

This enables violation cycle detection for known anti-patterns. For example:

```
git log -S "error.message" --all --oneline --format="%H %ad %s"
```

would show every commit that introduced or removed a raw `error.message` leak,
giving a timeline of violation recurrence. Combined with date filtering, this
produces a trend line of anti-pattern introduction frequency over time — without
any new tooling or instrumentation.

**Applicability:** The project's `patterns:check` enforcement rules (from
CLAUDE.md Section 5) have specific detectable patterns. Each one can be
pickaxe-searched across the full history to measure: (a) when violations first
appeared, (b) how often they recurred after initial detection, (c) whether
recurrence frequency declined over time as a learning signal. [4][5]

---

### 3. PR Comment Recurrence Analysis From JSONL Is Feasible [CONFIDENCE: HIGH]

Academic research (arxiv 2508.16053, 2024) demonstrates that existing PR review
comment data can be classified and analyzed retroactively using NLP without any
new data collection. The method:

1. Extract comments from existing records (JSONL in this project's case)
2. Apply text preprocessing (tokenization, lemmatization)
3. Classify comments by category (type of issue flagged: security, style, logic,
   etc.)
4. Compute recurrence frequency of each category per time window

For the 170+ review records in JSONL with fields for comment text, type,
severity, and timestamps: a simple Python/pandas groupby over time windows
(e.g., monthly) can produce a trend line showing whether specific issue
categories appear less often in more recent PRs.

**The core signal:** If the learning system worked, the rate of HIGH-severity
recurring comment categories should decline over the 260-session span. If a
category appears 8x in sessions 1-50 but only 2x in sessions 200-260, that is
measurable evidence of learning.

**Tools needed:** pandas time-series groupby on existing JSONL. Linear
regression on category-frequency time series. No new data collection required.
[6][7]

---

### 4. Commit Message NLP Classification: Detect Recurring Defect Types [CONFIDENCE: MEDIUM-HIGH]

Multiple empirical studies demonstrate that commit messages can be classified by
defect type using NLP and ML without new instrumentation:

- **Keyword-based**: Commits containing "fix", "bug", "error", "revert" + a
  specific topic keyword (e.g., "fix: path traversal", "fix: error.message
  leak") can be extracted with `git log --grep="<pattern>"`
- **Bag-of-words / LDA**: Higher-accuracy classification (AUC ~0.74 for SATD
  detection) using existing commit text
- **BUGZY-style models**: SVM + topic modeling can classify commits as bug-fix
  type

For the 260-session project with structured conventional commits and session
numbering, a simpler approach is feasible: extract all fix-commits, group by
inferred type (based on keywords or file path affected), plot frequency over
session windows. A declining frequency of a specific fix type (e.g., "fix: hook
violation") is a direct learning signal.

**Limitation:** Commit message quality affects reliability. If commit messages
are inconsistent, recall drops significantly. The structured session logging in
this project (session #NNN patterns) improves signal quality above typical
open-source averages. [8][9]

---

### 5. "Time to Fix" Trends Are Extractable From Git Timestamps [CONFIDENCE: MEDIUM]

Academic research on bug resolution time (MDPI 2023, ScienceDirect 2020)
demonstrates that "time to fix" trends are computable retroactively from git
history using:

1. Bug-fix commit timestamp (from `git log`)
2. Bug-introduction commit timestamp (from SZZ or pickaxe)
3. Delta = time between introduction and fix

If the same category of bug (e.g., path traversal violations) is introduced and
fixed multiple times, the distribution of deltas over time should compress if
learning occurred. Earlier violations might take weeks to fix; later ones might
be fixed within the same session or PR.

**Challenge:** This requires pairing introducing commits with fixing commits
(SZZ dependency). For the project context, a simpler proxy exists: measure the
time between when a pre-commit hook first flags a violation type and when it
stops appearing. The hook-runs.jsonl file referenced in CLAUDE.md Section 4.13
is a direct, already-existing data source for this analysis — no new
instrumentation needed. [10][11]

---

### 6. Code Churn + Hotspot Trending: Health Trajectory [CONFIDENCE: MEDIUM]

CodeScene and similar tools (e.g., PyDriller, gitinspector) compute code churn
trends retroactively from git history. The key quality-trend metrics derivable
without new instrumentation:

- **Code churn rate per file/module over time**: High churn that stabilizes =
  quality improvement. Rising churn in specific modules = ongoing instability.
- **Churn after fix commits**: If the same lines are repeatedly churned, the fix
  didn't hold.
- **Knowledge distribution over time**: Who touches what, and does expertise
  concentration shift (relevant for AI-directed development where "developer" =
  Claude sessions).

For the project context, code churn tracking on files frequently touched by hook
violations would show whether those files become more stable over time after the
learning system flagged them.

**Tool:** PyDriller (Python, MIT license) can extract all of this from a local
git repo with no additional instrumentation. [12][13]

---

### 7. Existing Commercial Tools Support Retroactive Analysis [CONFIDENCE: MEDIUM-HIGH]

Several commercial and open-source tools support this exact use case from
existing git data:

| Tool                 | What It Measures Retroactively                             | Data Needed                  |
| -------------------- | ---------------------------------------------------------- | ---------------------------- |
| **CodeScene**        | Code health trends, knowledge distribution, churn hotspots | git history only             |
| **LinearB**          | PR size, review time, rework rate trends                   | git + PR API                 |
| **Pluralsight Flow** | Historical reporting, review latency, handoff delays       | git + PR API                 |
| **PyDriller**        | Raw commit/file metrics extraction framework               | git history only             |
| **gitinspector**     | Contribution patterns, churn per author                    | git history only             |
| **SZZUnleashed**     | Bug-introducing commit identification                      | git + issue tracker keywords |

CodeScene in particular computes "Code Health" scores (1-10 scale) across 25+
metrics and plots them over time from git history alone. A score trend line for
the project's codebase from Jan 2025 to present would provide an objective
health trajectory.

**Important caveat for this project:** Commercial tools (CodeScene, LinearB)
require pointing them at the git repository. They do not need new
instrumentation in the code — they read existing history. [14][15][16]

---

### 8. CAME / Temporal Code Metrics: Anti-pattern Lifecycle Detection [CONFIDENCE: MEDIUM]

The CAME paper (arxiv 1910.07658) demonstrates that using time-series of code
metrics mined from VCS increases anti-pattern detection precision compared to
static analysis. The key insight: the **trajectory** of metrics (how they
evolved over commits) contains signal that current state does not.

For the learning system question specifically: if an anti-pattern (e.g., a God
Class or the project's path-traversal violation pattern) is introduced, peaks,
and then declines, that U-shape in the metric timeline is detectable
retroactively. If violations stop being introduced after a certain session, that
inflection point marks when the learning system produced behavioral change. [17]

---

### 9. Lore Protocol and Session Logs: Inter-Session Knowledge Evidence [CONFIDENCE: MEDIUM]

The Lore protocol (arxiv 2603.15566, 2025) is a prospective proposal for
embedding decision rationale into git commit messages, but it surfaces a
relevant measurement insight: the **absence** of repeated constraint violations
in commit history is itself an observable signal of learning retention.

For the project's 260+ sessions:

- Count how many times a specific CLAUDE.md rule or pattern-check violation
  appears in commit messages or hook-runs.jsonl
- Plot that count by session number
- A declining slope = the learning system worked

This can be done right now from existing data. The project's structured session
commits (with session numbers in message headers) provide the time axis needed
for this analysis without any new data collection. [18]

---

### 10. Limitations and Threats to Validity [CONFIDENCE: HIGH]

Several methodological threats apply to all retroactive measurement approaches:

1. **Commit message quality**: All NLP-based methods degrade if commit messages
   are inconsistent, abbreviated, or non-structured. The project's conventional
   commit convention partially mitigates this.

2. **Confounding factors**: Code quality improvements may reflect scope changes,
   new files added, or rule-set changes rather than learning. Any trend analysis
   must control for: (a) changes to the rule set itself, (b) developer/agent
   changes, (c) codebase structural changes.

3. **SZZ tangled commits**: When one commit addresses multiple issues, the
   bug-introduction mapping is imprecise. Precision ~60-80% in best-case
   studies.

4. **Selection bias in JSONL data**: If the 170 JSONL review records are not
   comprehensive (some PRs not logged, some sessions untracked), trend analysis
   has sampling gaps that could mask or fabricate trends.

5. **Attribution problem**: In AI-directed development, "learning" could mean
   the AI model improved (model update) vs. the project's prompting/rules
   improved vs. genuine behavioral adaptation. Retroactive git analysis cannot
   distinguish these causes — it can only observe effects.

---

## Sources

| #   | URL                                                                               | Title                                                 | Type          | Trust  | CRAAP Avg | Date    |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------- | ------ | --------- | ------- |
| 1   | https://github.com/wogscpar/SZZUnleashed                                          | SZZUnleashed GitHub                                   | tool/code     | HIGH   | 4.1       | 2024    |
| 2   | https://link.springer.com/article/10.1007/s10664-024-10511-2                      | Refining SZZ with Bug Discussion Data                 | peer-reviewed | HIGH   | 4.4       | 2024    |
| 3   | https://arxiv.org/html/2308.05060v2                                               | Evaluating SZZ on Linux Kernel                        | academic      | HIGH   | 4.2       | 2023    |
| 4   | https://git-scm.com/book/en/v2/Git-Tools-Searching                                | Git Tools: Searching (Pickaxe)                        | official-docs | HIGH   | 4.8       | current |
| 5   | https://www.graphapp.ai/engineering-glossary/git/pickaxe                          | Git Pickaxe Definition                                | community     | MEDIUM | 3.5       | 2024    |
| 6   | https://arxiv.org/html/2508.16053v1                                               | Measuring Effectiveness of Code Review Comments       | academic      | HIGH   | 4.3       | 2025    |
| 7   | https://pandas.pydata.org/docs/getting_started/intro_tutorials/09_timeseries.html | pandas Time Series Docs                               | official-docs | HIGH   | 4.9       | current |
| 8   | https://www.mdpi.com/2076-3417/12/21/10773                                        | NLP on Commit Messages: HEP Case Study                | peer-reviewed | HIGH   | 4.0       | 2022    |
| 9   | https://arxiv.org/pdf/1903.01742                                                  | SZZ Unleashed Paper                                   | academic      | HIGH   | 4.1       | 2019    |
| 10  | https://www.mdpi.com/2076-3417/13/5/3150                                          | Factors Impacting Simple Bug Resolution Times         | peer-reviewed | HIGH   | 4.2       | 2023    |
| 11  | https://www.sciencedirect.com/science/article/abs/pii/S0164121220301266           | Developer Familiarity and Bug Fixing                  | peer-reviewed | HIGH   | 4.3       | 2020    |
| 12  | https://github.com/ishepard/pydriller                                             | PyDriller GitHub                                      | tool/code     | HIGH   | 4.2       | 2024    |
| 13  | https://codescene.io/docs/guides/technical/code-health.html                       | CodeScene Code Health Docs                            | official-docs | HIGH   | 4.5       | current |
| 14  | https://codescene.com/product/behavioral-code-analysis                            | CodeScene Behavioral Analysis                         | vendor-docs   | MEDIUM | 3.8       | 2024    |
| 15  | https://linearb.io/blog/git-analytics                                             | LinearB: Top 14 Git Analytics                         | vendor-blog   | MEDIUM | 3.4       | 2024    |
| 16  | https://github.com/ejwa/gitinspector                                              | gitinspector GitHub                                   | tool/code     | MEDIUM | 3.7       | 2024    |
| 17  | https://arxiv.org/abs/1910.07658                                                  | Deep Learning Anti-patterns from Code Metrics History | academic      | HIGH   | 4.0       | 2019    |
| 18  | https://arxiv.org/abs/2603.15566                                                  | Lore: Git Commit Messages as Knowledge Protocol       | academic      | HIGH   | 4.4       | 2026    |

---

## Contradictions

**Contradiction 1: VCS data sufficiency vs. confounded signals**

The MSR academic literature (SZZ, CAME, PyDriller studies) claims VCS history
provides sufficient signal to measure quality trends and developer learning.
However, the METR study (2025, measuring AI tool impact on developer
productivity) found "no clear learning effect across the first 30-50 hours of
Cursor usage," suggesting that behavioral change from AI tools may not surface
as measurable signals in git data within short timeframes. The reconciliation is
likely that: (a) 260 sessions is a much larger dataset than 30-50 hours, and (b)
rule-based hook violations are more precise signals than general productivity.

**Contradiction 2: "Time to fix" as a learning proxy**

ScienceDirect 2020 (developer familiarity study) found that more-familiar
developers fix bugs faster, suggesting time-to-fix compresses with experience.
However, MDPI 2023 (factors impacting resolution time) found that bug complexity
and reporter experience are stronger predictors than developer learning. This
means time-to-fix trends may conflate learning with scope change (earlier bugs
may have been simpler).

---

## Gaps

1. **No academic paper found** that specifically addresses measuring AI-directed
   development learning system effectiveness retroactively. The closest
   analogues are human developer learning studies and AI model self-improvement
   studies, neither of which map directly.

2. **PR comment recurrence as a learning signal**: No research was found
   specifically validating "declining recurrence of review comment categories"
   as a reliable learning metric. The arxiv 2508.16053 paper classifies comment
   effectiveness but does not track trends over time. This leaves the JSONL
   trend analysis approach theoretically sound but empirically unvalidated in
   the literature.

3. **Session log specificity**: No research addresses the specific format of
   Claude Code session logs (JSONL with session numbers, hook-runs.jsonl, etc.)
   as a measurement substrate. The analysis methodology must be adapted from
   general MSR techniques.

4. **Instrumentation baseline missing**: The lack of a pre-defined "learning
   system baseline" metric (what value indicates no learning?) makes trend
   interpretation subjective. A declining frequency of X% over Y sessions may be
   meaningful or noise — without a null hypothesis baseline, it is difficult to
   distinguish signal from drift.

---

## Serendipity

**Finding: hook-runs.jsonl is the highest-value retroactive data source in this
project**

The CLAUDE.md file references `hook-runs.jsonl` and `hook-warnings-log.jsonl` as
persistence stores for pre-commit/pre-push check data. This is exactly the kind
of structured, timestamped, typed violation log that MSR researchers would
design from scratch for this analysis. If these files have been populated across
260 sessions, they represent a purpose-built learning signal dataset that makes
formal retroactive measurement directly feasible without any additional tooling.
A simple groupby over these files (violation_type × session_window → count)
would produce the trend lines needed to answer the core question.

**Finding: GitClear's 2024-2025 research provides an accidental control group**

GitClear's large-scale analysis of AI-assisted coding (153M+ lines, 2020-2024)
found that code revision within 2 weeks of initial commit increased from 3.1% to
5.7% (2020-2024) — broadly, AI coding increases short-cycle rework. If this
project's short-cycle rework rate trends in the _opposite_ direction
(declining), it would be strong evidence that the learning system is effective
against the industry baseline.

**Finding: Lore protocol is directly applicable to this project's session
architecture**

The Lore protocol (2026) encodes decision rationale into git commit messages
using git trailers. The project's existing session commit structure (session
numbers, /session-end references) is architecturally compatible with Lore. If
the project adopts Lore going forward, future effectiveness measurement would
gain a structured retroactive audit trail that the current system lacks.

---

## Confidence Assessment

- HIGH claims: 4 (SZZ algorithm, git pickaxe method, PR JSONL analysis
  feasibility, limitations/threats)
- MEDIUM-HIGH claims: 2 (commit message NLP, commercial tools)
- MEDIUM claims: 3 (time-to-fix trends, code churn metrics, CAME/temporal
  metrics)
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The core answer is HIGH confidence: retroactive measurement IS feasible from
existing data without new instrumentation. The specific accuracy and reliability
of each method ranges from MEDIUM to HIGH depending on commit message quality,
data completeness, and the specific signal being measured. The project's
hook-runs.jsonl file is the single highest-confidence data source for this
analysis.
