# Findings: Learning Graduation — From Documented Knowledge to Automated Enforcement

**Searcher:** deep-research-searcher **Profile:** web **Date:**
2026-04-03T00:00:00Z **Sub-Question IDs:** SQ-6

---

## Key Findings

### 1. The Documented-to-Enforced Pipeline Has a Standard 4-Phase Structure [CONFIDENCE: HIGH]

Practitioners across DevOps, linting, and policy-as-code consistently describe
the same graduation arc:

1. **Observe** — A pattern is identified via code review, incident postmortem,
   or static analysis.
2. **Codify** — The pattern is expressed as a machine-readable rule (YAML for
   Semgrep, AST selector for ESLint, Rego for OPA).
3. **Inform** — The rule runs in warn/advisory mode; violations surface but
   don't block.
4. **Enforce** — The rule gates merges/deployments via CI; the loop closes.

The Semgrep methodology formalizes this as: Brainstorm → Concrete examples →
Test file + initial rule → Iterate/refine → Integrate into CI [1]. The ESLint
ratcheting approach at Notion adds a fifth sub-phase: **Baseline** — freeze
existing violations before enforcing "no new violations" [5][6]. The
Policy-as-Code literature at Harness mirrors this with explicit WARN → ERROR
mode graduation [7].

**Critical insight:** Phase 3 (Inform) is where most pipelines stall. Without a
committed owner and a defined transition gate into Phase 4, warn-mode findings
accumulate and are treated as wallpaper.

---

### 2. The "Warning → Error" Graduation Mechanism Is the Central Design Challenge [CONFIDENCE: HIGH]

The neugierig.org analysis articulates the canonical failure mode: "informing
about a problem without blocking on it at some point often leads to a situation
where sometimes problems are ignored," creating warning blindness [8]. This is
the specific mechanism by which patterns accumulate at "refined" without
reaching "enforced."

Successful pipelines all share one structural property: **a later phase must
block what an earlier phase merely informs about.** The specific tools
implementing this:

- **ESLint warn-to-error:** Set rule severity to `warn` initially; graduate to
  `error` with a defined deadline [3][4].
- **Harness Policy-as-Code:** WARN mode flags violations without blocking; ERROR
  mode blocks pipeline [7].
- **Notion eslint-seatbelt:** Records baseline violation counts per file;
  prevents any new violations immediately; fixes old ones over time [5][6].
- **Semgrep rule modes:** Comment mode posts PR comments; Block mode prevents
  merge [1].

**What makes graduation fail:** Teams set warn mode "temporarily," no one
declares the transition date, the warn list grows, and the distinction between
important and trivial warnings collapses.

---

### 3. Notion's "Ratcheting" System Is the Most Mature Pattern for Large-Codebase Graduation [CONFIDENCE: HIGH]

Notion's eslint-seatbelt (open-sourced at github.com/justjake/eslint-seatbelt)
solves the "too many existing violations to enforce immediately" problem with a
mechanically enforced baseline:

- A `.tsv` file records maximum allowed violations per rule per file.
- CI sets `SEATBELT_FROZEN=1`, which prevents the file from changing upward.
- Pre-commit hooks automatically reduce allowed counts when violations are
  fixed.
- Fixing is distributed across normal development work — no "big migration
  sprint" required.
- Progress is tracked in Datadog for visibility into rate of convergence.

This pattern directly solves the "38/39 patterns stuck at refined" problem: the
ratchet allows enforcement to begin immediately at zero cost (because existing
violations are grandfathered) while making regression impossible. The mechanism
is irreversible by design [5][6].

**Key insight for the SoNash context:** The reason patterns stay at "refined" is
the lack of a ratchet mechanism. Without baseline tracking, teams face a false
choice: "enforce now and break everything" vs. "wait until we clean up the
codebase first." The ratchet dissolves this dilemma.

---

### 4. Custom ESLint Rule Workflow from Code Review Pattern [CONFIDENCE: HIGH]

The practitioner workflow for converting a recurring review comment into an
automated rule is well-documented:

1. **Identify the pattern** — Review last 50 PR comments; categorize by type
   (formatting, naming, pattern, logic) [2].
2. **Express as code example** — Write a concrete code snippet showing the
   violation.
3. **Map to AST** — Use AST Explorer (astexplorer.net) to identify the relevant
   node selector (e.g., `ClassDeclaration`).
4. **Write rule + test** — Create a rule with `create()`, define violation
   messages, add autofixer if possible (`fixable: 'code'`).
5. **Deploy as warn** — Integrate into `.eslintrc.js`/`eslint.config.js`; run in
   CI with warning severity.
6. **Ratchet or bulk-fix** — Either use seatbelt to baseline existing
   violations, or run autofix across repo.
7. **Graduate to error** — Set severity to `error` in CI.

The Waldek Mastykarz case study showed that making rules `fixable` was critical:
it transformed a codebase-wide naming inconsistency from a manual task into a
one-command fix [4]. The Neighborhoods.com case used custom rules to steadily
reduce a specific dependency's usage across the codebase as part of normal
workflow tasks, avoiding risky mass-refactor PRs [3].

---

### 5. Semgrep Custom Rules Workflow from Pattern Documentation [CONFIDENCE: HIGH]

Semgrep's official methodology for moving from code pattern to CI enforcement
[1]:

1. **Brainstorm the pattern** — Source: code reviews, bug reports, known
   anti-patterns, API misuse.
2. **Concrete code examples** — Write samples of both the bad pattern and the
   safe equivalent.
3. **Iterative rule authoring** — Use `pattern`, `pattern-not`, `pattern-either`
   clauses incrementally.
4. **Test on a real repository** — Run the rule on one codebase; iterate to
   eliminate false positives and false negatives.
5. **Validate at scale** — Run across multiple repositories; adjust precision.
6. **CI integration** — Deploy in Comment mode (PR annotation) before Block mode
   (merge gate).
7. **Feedback loop** — Collect engineer feedback on rule accuracy; maintain
   relationship with teams.

The 2026 Custom Workflows feature extends this into a Python SDK pipeline that
chains detection → triage → validation → remediation, with documented results of
96% analyst agreement rate and 8x more true positives vs. LLM-only approaches
[1].

**Critical failure mode:** False positive accumulation. If rules flag too many
correct patterns, engineers learn to ignore them, destroying signal. Semgrep
recommends pragmatic tradeoffs between recall (catching everything) and
precision (avoiding noise), erring toward precision for blocking rules.

---

### 6. Policy-as-Code Movement: Three Core Principles for Graduation Success [CONFIDENCE: HIGH]

The policy-as-code movement (OPA/Rego, Semgrep, Checkov) offers three core
principles that distinguish successful pipelines from stalled ones [9][10][11]:

**Principle 1: Product mindset over bureaucracy.** Treat policies as a product
serving development teams, not as rules imposed on them. Design for developer
experience. If merge rate drops below 50%, the automation has become a gate
masquerading as a guardrail and should be rolled back [9].

**Principle 2: Start small, graduate via evidence.** Begin with 2-3 high-risk,
high-value policies. Use advisory enforcement first. Graduate to blocking only
when false positive rate is acceptable and teams have had time to adjust
[7][10].

**Principle 3: Guardrails, not gates.** The distinction: gates stop progress and
require human approval; guardrails automatically redirect toward compliance or
surface violations in context without blocking velocity. DevOps Research shows
traditional security gates create 40-60% longer lead times [9].

**Documented failure mode:** "Tool-first, policy-later" — teams adopt OPA or
Checkov, write initial policies to satisfy an audit, then stop. Policies become
stale; new services deploy without coverage. The root cause is no ownership
model for policy maintenance after initial creation [11].

---

### 7. SECI Model Applied: Why Knowledge Accumulates Without Acting [CONFIDENCE: MEDIUM]

Nonaka's SECI model (Socialization → Externalization → Combination →
Internalization) explains the specific breakdown point in software team learning
systems [12]:

- **Socialization:** Pattern observed in code review (tacit, shared through
  experience).
- **Externalization:** Pattern written down in a document or PATTERNS.md (tacit
  → explicit). **This is where most systems stop.**
- **Combination:** Multiple explicit patterns combined into a rule or policy
  (explicit → explicit). Often skipped.
- **Internalization:** Automated enforcement causes developers to internalize
  the pattern through repeated correction (explicit → tacit). Almost never
  reached.

The implementation gap research confirms: the bottleneck is between
Externalization and Combination — converting individual explicit documents into
systematized, tool-integrated policy. APQC's 2024 research identifies this as a
"knowledge proliferation" problem: organizations accumulate documents faster
than they can integrate them into workflows [13].

**Root causes of stalling after Externalization:**

- No assigned owner for converting documentation to rules.
- No time allocated in sprint planning for tooling work.
- Converting documentation to AST rules requires a skill set (AST, YAML, Rego)
  that may not exist on the team.
- The immediate feedback value of rule creation is unclear; it's invisible work.

---

### 8. Specific Failure Modes for Pattern-to-Automation Pipelines [CONFIDENCE: HIGH]

Aggregating across sources, the documented failure modes are:

| Failure Mode            | Description                                                                                                | Source |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| Warning Wallpaper       | Rules deployed in warn mode, never graduated; engineers habituate and stop reading them                    | [8][3] |
| False Positive Fatigue  | Rules too broad; 97.5% false positive rate creates learned helplessness where real alerts are ignored      | [9]    |
| No Owner                | Responsibility for maintaining and graduating rules is diffuse; when it's everyone's job it's no one's job | [13]   |
| Tool-First/Policy-Later | Tools adopted, rules written to satisfy initial requirement, then never maintained or graduated            | [11]   |
| The Big Migration Trap  | Team defers graduation until codebase is clean, creating a circular dependency (never clean enough)        | [5][6] |
| Skill Gap               | Converting patterns to AST selectors or Rego policy requires specific expertise; team doesn't have it      | [4]    |
| Adoption Bypass         | Rules introduced without warning cause developers to add `eslint-disable` comments en masse                | [3]    |
| Stale Rules             | Rules written for a previous codebase state generate noise on new patterns, especially AI-generated code   | [9]    |

---

### 9. Successful Real-World Pipeline Examples [CONFIDENCE: HIGH]

**Notion (eslint-seatbelt):** Multi-year React function component migration.
Ratcheting mechanism allowed immediate enforcement with zero initial disruption.
Hundreds of contributors. Progress tracked in Datadog. Open-sourced as
eslint-seatbelt [5][6].

**Neighborhoods.com:** Custom ESLint rule tracking overused node_module
dependencies. Violations surfaced as errors during normal development workflow.
Bundle size reduction achieved incrementally without risky mass-refactor PRs
[3].

**Waldek Mastykarz/M365 CLI:** Command class naming convention enforced via
custom ESLint rule with autofix. Discovered tens of violations in existing
codebase; one-command fix eliminated them all [4].

**Semgrep at scale:** Thousands of teams encode anti-patterns as custom rules.
Documented: 96% security analyst agreement on triage classification, 8x more
true positives than LLM-only, 30 minutes saved per finding on average [1].

**Harness PaC:** WARN → ERROR graduation for CI/CD policy enforcement.
Deployment guardrails for cost, security, and compliance. Advisory period with
defined deadline before blocking enforcement [7].

---

### 10. The "Inform Early, Block Later" Principle as a Universal Pattern [CONFIDENCE: HIGH]

The most consistent finding across all sources is that successful graduation
pipelines separate the feedback signal from the enforcement action and use time
to let developers adapt:

- IDE/editor: Inform (real-time, non-blocking).
- Pre-commit hook: Inform or soft-block (escapable but visible).
- CI pipeline: Hard block (non-negotiable).

This separation allows patterns to be introduced at the "inform" level
immediately, with graduation to "block" following after adoption evidence is
collected. The key failure is skipping the intermediate inform phase and going
directly to hard blocking, or conversely, never leaving the inform phase
[8][7][9].

---

## Sources

| #   | URL                                                                                                                                     | Title                                              | Type                           | Trust       | CRAAP Score | Date           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ | ----------- | ----------- | -------------- |
| 1   | https://semgrep.dev/blog/2026/introducing-semgrep-custom-workflows/                                                                     | Introducing Semgrep Custom Workflows               | Official vendor blog           | HIGH        | 4.6         | 2026           |
| 2   | https://www.sitepoint.com/automated-style-guides-enforcing-coding-standards-with-continue-ci/                                           | Automated Style Guides: Enforcing Coding Standards | Practitioner blog              | MEDIUM      | 3.8         | 2025           |
| 3   | https://medium.com/neighborhoods-com-engineering-blog/custom-eslint-rules-for-faster-refactoring-2095e69bde08                           | Custom ESLint Rules For Faster Refactoring         | Engineering blog               | MEDIUM      | 4.0         | 2023           |
| 4   | https://blog.mastykarz.nl/simplify-code-reviews-improve-consistency-custom-eslint-rules/                                                | Simplify code reviews with custom ESLint rules     | Practitioner blog              | MEDIUM      | 3.9         | 2023           |
| 5   | https://www.notion.com/blog/how-we-evolved-our-code-notions-ratcheting-system-using-custom-eslint-rules                                 | Notion's Ratcheting System for Custom ESLint Rules | Engineering blog (first-party) | HIGH        | 4.5         | 2023           |
| 6   | https://github.com/justjake/eslint-seatbelt                                                                                             | eslint-seatbelt (open source)                      | Source code + docs             | HIGH        | 4.4         | 2022–2024      |
| 7   | https://www.harness.io/blog/best-practices-for-using-policy-as-code-in-ci-cd-pipelines-with-harness                                     | Policy-as-Code Best Practices in CI/CD             | Vendor docs/blog               | MEDIUM-HIGH | 4.0         | 2024           |
| 8   | https://neugierig.org/software/blog/2022/01/rethinking-errors.html                                                                      | Rethinking errors, warnings, and lints             | Engineering essay              | MEDIUM      | 4.1         | 2022           |
| 9   | https://www.pixee.ai/blog/guardrail-manifesto-security-high-velocity-engineering                                                        | Security Guardrails vs Gates: A Manifesto          | Vendor blog                    | MEDIUM      | 3.9         | 2024           |
| 10  | https://www.harness.io/harness-devops-academy/what-is-policy-as-code                                                                    | What is Policy as Code?                            | Educational/vendor             | MEDIUM      | 3.7         | 2024           |
| 11  | https://cybersierra.co/blog/policy-as-code-devsecops/                                                                                   | Policy-as-Code Implementation Guide for DevSecOps  | Practitioner blog              | MEDIUM      | 3.6         | 2024           |
| 12  | https://en.wikipedia.org/wiki/SECI_model_of_knowledge_dimensions                                                                        | SECI Model of Knowledge Dimensions                 | Encyclopedia                   | MEDIUM      | 3.5         | Ongoing        |
| 13  | https://www.apqc.org/blog/2024-knowledge-management-priorities-trends                                                                   | 2024 Knowledge Management Priorities and Trends    | Research org (APQC)            | HIGH        | 4.2         | 2024           |
| 14  | https://semgrep.dev/blog/2020/writing-semgrep-rules-a-methodology/                                                                      | Writing Semgrep Rules: A Methodology               | Official vendor blog           | HIGH        | 4.0         | 2020           |
| 15  | https://semgrep.dev/blog/2025/from-gatekeepers-to-guardrails-automating-your-pci-v401-strategy/                                         | From Gatekeepers to Guardrails (PCI v4.0.1)        | Official vendor blog           | HIGH        | 4.4         | 2025           |
| 16  | https://www.sonatype.com/blog/less-gates-more-guardrails-devsecops-lessons-learned-in-2017                                              | DevSecOps Lessons Learned: Guardrails vs Gates     | Vendor blog                    | MEDIUM      | 3.7         | 2017 (seminal) |
| 17  | https://martinfowler.com/articles/llm-learning-loop.html                                                                                | The Learning Loop and LLMs                         | Thought leader blog            | HIGH        | 4.3         | 2024–2025      |
| 18  | https://www.kinde.com/learn/ai-for-software-engineering/code-reviews/ai-code-review-automation-building-custom-linting-rules-with-llms/ | Building Custom Linting Rules with LLMs            | Vendor/practitioner            | MEDIUM      | 3.8         | 2024           |

---

## Contradictions

**Contradiction 1: Speed vs. Safety of Graduation**

The Semgrep methodology recommends starting with a test file and iterating
before deploying [14]. The ratcheting pattern (Notion/eslint-seatbelt)
recommends enabling rules immediately and using a baseline file to grandfather
existing violations [5][6]. These are not directly contradictory but emphasize
different sequencing: Semgrep optimizes for rule precision before deployment;
seatbelt optimizes for deployment speed with gradual cleanup. For a mature
codebase with many existing violations, seatbelt's approach is more practical.

**Contradiction 2: Blocking vs. Non-Blocking Enforcement**

The Pixee "guardrail manifesto" argues that blocking enforcement (gates) is
counterproductive — the goal is guidance, not prevention [9]. The neugierig.org
analysis argues that "some later phase must block" to prevent warning blindness
[8]. The reconciliation: blocking is appropriate at the CI/merge level but
should be preceded by non-blocking inform phases at the IDE and pre-commit
levels. The contradiction reflects a tension in literature between security
practitioners (who want hard blocks) and developer experience advocates (who
want flow preservation).

---

## Gaps

1. **No specific research on AI-directed development contexts.** All sources
   describe human-written code pipelines. The patterns likely transfer but the
   tooling (custom ESLint rules, Semgrep) may need adaptation for patterns that
   are about agent behavior rather than code syntax.

2. **No data on conversion rate from documented pattern to deployed rule.**
   Industry conversion rates (what % of documented patterns actually reach
   automated enforcement) were not found. The Neighborhoods.com and Notion
   examples show success, but failure rates across the broader population of
   teams are undocumented.

3. **No research on rule deprecation.** Sources focus on adding and graduating
   rules, not on retiring stale rules. This matters for maintaining signal
   quality over time.

4. **The "39 patterns" scenario is not addressed in literature.** No source
   addresses what to do with a large backlog of already-documented patterns that
   have stalled. The seatbelt approach handles new enforcement but assumes
   you've already decided which rules to codify.

5. **The specific decision gate between "refined" and "enforced" stages is
   absent from literature.** All sources describe the implementation workflow
   but none formalize a decision process for when a pattern is ready to graduate
   (e.g., what criteria must be met, who decides, what approval is required).

---

## Serendipity

**The Ratchet as a Minimal Viable Governance System:** The eslint-seatbelt
design (baseline TSV + CI freeze) is a minimal implementation of a
policy-as-code graduation system that requires no new infrastructure — just a
checked-in file and an environment variable. This could directly inform the
SoNash learning-router architecture.

**"Learning Policies" Emerging:** The 2025 policy-as-code literature mentions
"learning policies" — systems that adapt based on developer feedback and become
more helpful over time rather than more restrictive. This directly maps to the
stated goal of moving patterns from "scaffolded" to "verified."

**False Positive Rate as Primary Graduation Gate:** The Pixee data showing 97.5%
false positive rates in typical vulnerability pipelines suggests that _rule
quality_ (measured by false positive rate) may be the most important variable
determining whether enforcement succeeds or generates bypass behavior. A rule
that blocks good code will be disabled.

**The SECI Externalization Trap:** Nonaka's model predicts that organizations
will systematically accumulate explicit knowledge (documentation) without
converting it to Combination (tooling) or Internalization (culture) — this is a
structural feature of knowledge work, not a failure of individual teams. It
suggests that a systematic pipeline with explicit transition triggers is
required, not just individual motivation.

---

## Confidence Assessment

- HIGH claims: 7 (the standard 4-phase structure, warn-to-error mechanism,
  Notion ratcheting, ESLint workflow, Semgrep workflow, policy-as-code
  principles, failure mode taxonomy)
- MEDIUM claims: 2 (SECI model application, specific root cause analysis)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The findings are well-supported by multiple independent sources. The specific
mechanisms (ratcheting, warn-to-error, policy-as-code graduation) have
real-world implementations and documented outcomes. The failure modes are
consistent across practitioner and research sources.
