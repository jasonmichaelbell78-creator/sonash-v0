# Creator View — Errors and Vulnerabilities in AI-Generated Code

**Source:** Local PDF | **Analyzed:** 2026-04-09 | **Depth:** Standard

---

## 1. What This Document Understands (+ Blindspots)

This is a dense 6-page reference table that catalogs 18 distinct error
categories in AI-generated code. Each category gets a row with description,
concrete examples, impact/risks, mitigation strategy, and academic citations.
It's not a paper arguing a thesis — it's a lookup table designed for
practitioners who want to know "what can go wrong and what do I do about it."

The taxonomy is comprehensive and well-organized. It spans from architectural
issues (inconsistency, structural entropy) through security (5 subcategories:
secrets, injection/XSS, access control, memory safety, prompt injection),
operational risks (deployment fragility, compilation errors, error handling),
process risks (requirements ambiguity, intentional vs unintentional debt,
context momentum), and compliance (supply chain, license, bias).

**What it gets right:** The "hallucinated dependencies" (slopsquatting) category
is particularly valuable — it's a risk class specific to AI code generation that
traditional security checklists miss entirely. The "intentional vs unintentional
debt" distinction is also sharp: AI creates a new class of unintentional debt
from training data gaps that looks different from the shortcuts humans take
knowingly.

**Blindspots:**

- **No severity ranking.** All 18 categories are presented as equal. In
  practice, hard-coded secrets and injection/XSS cause more damage faster than
  naming inconsistency or code bloat. A severity tier would make this more
  actionable.
- **No detection automation.** Mitigations are described but not automated. "Use
  static analysis" is mentioned but not mapped to specific tools beyond a few
  examples (SonarQube, TruffleHog, Snyk).
- **No AI-specific mitigations.** The mitigations are mostly standard security
  practices. The document doesn't discuss AI-specific approaches like CLAUDE.md
  enforcement, pattern compliance gates, or pre-commit hooks that catch
  AI-generated anti-patterns specifically.
- **Static snapshot.** No versioning, no update mechanism. As AI capabilities
  evolve, new failure modes will emerge. This table will go stale.

## 2. What's Relevant To Your Work

**Directly relevant — maps to existing SoNash systems:**

| Document Category                | SoNash Equivalent                                            | Coverage |
| -------------------------------- | ------------------------------------------------------------ | -------- |
| Architectural Inconsistency      | CLAUDE.md guardrails, code-reviewer agent                    | Covered  |
| Security: Hard-coded Secrets     | patterns:check, .env exclusion                               | Covered  |
| Security: Injection/XSS          | CODE_PATTERNS.md (path traversal, injection patterns)        | Covered  |
| Structural Entropy (Code Bloat)  | CLAUDE.md "don't add features beyond what was asked"         | Covered  |
| Compilation Errors               | TypeScript strict mode, CI build gate                        | Covered  |
| Error Handling / Resource Lapses | CODE_PATTERNS.md (file reads in try/catch)                   | Covered  |
| Prompt Injection                 | SECURITY_CHECKLIST.md (markdown injection, script injection) | Covered  |
| Naming Inconsistency             | TypeScript conventions, code-reviewer                        | Covered  |

**Gaps — not currently covered by SoNash:**

| Document Category                     | Gap                                                           | Priority                 |
| ------------------------------------- | ------------------------------------------------------------- | ------------------------ |
| **Hallucinated Dependencies**         | No automated check for non-existent packages in `npm install` | High — supply chain risk |
| **License Compliance**                | No automated license scanning of dependencies                 | Medium                   |
| **Intentional vs Unintentional Debt** | TDMS tracks debt but doesn't classify by origin (AI vs human) | Medium                   |
| **Context Momentum**                  | SESSION_CONTEXT.md + /clear mitigate but no explicit check    | Low — behavioral         |
| **Insecure Access Control**           | Firestore rules + Cloud Functions enforce, but no audit       | Low — covered by design  |
| **Bias**                              | Not applicable to SoNash (no ML models in the app)            | None                     |

## 3. Where Your Approach Differs

We're **ahead** in enforcement. The document says "use instruction files" and
"enforce coding standards" — we have 450 patterns in CODE_PATTERNS.md with
automated checking via `npm run patterns:check`. The document's mitigations are
aspirational; ours are gated.

We're **ahead** in context management. The document identifies "context
momentum" (early AI misinterpretations steering projects wrong) and suggests
"clear AI context periodically." We do this systematically: one feature per
session, `/clear`, `/compact`, SESSION_CONTEXT.md, checkpoint skills.

We're **behind** on hallucinated dependency detection and license compliance
scanning. These are genuine gaps.

## 4. The Challenge

Consider adding a **dependency verification step** to the pre-commit or pre-push
hook that checks whether newly-added npm packages actually exist in the registry
and have expected download counts. The slopsquatting risk is real and we have no
mitigation.

## 5. Knowledge Candidates

| Candidate                                        | Type         | Novelty | Effort | Relevance |
| ------------------------------------------------ | ------------ | ------- | ------ | --------- |
| 18-category AI error taxonomy                    | knowledge    | high    | E0     | high      |
| Hallucinated dependencies (slopsquatting)        | knowledge    | high    | E0     | high      |
| Intentional vs unintentional debt classification | knowledge    | medium  | E0     | high      |
| Context momentum pattern                         | knowledge    | medium  | E0     | high      |
| Structural entropy as ruthless editing           | anti-pattern | low     | E0     | high      |
| Deployment fragility (happy path only)           | anti-pattern | low     | E0     | medium    |

## 6. What's Worth Avoiding

- **Treating all 18 categories as equal priority.** Hard-coded secrets and
  injection are immediate security risks. Naming inconsistency is annoyance.
  Don't flatten severity when mapping to our systems.
- **Adding generic mitigations.** "Use static analysis" without specifying which
  tool, which rule, which gate. Our patterns:check approach is better — specific
  patterns with specific enforcement points.
