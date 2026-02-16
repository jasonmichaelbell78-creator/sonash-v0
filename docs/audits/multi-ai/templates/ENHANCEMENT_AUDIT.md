<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-11
**Status:** DRAFT
<!-- prettier-ignore-end -->

# Enhancement Audit Template (Multi-AI Injectable)

**Tier:** 3 (Planning) **Overall Completion:** 0%

> **Multi-Agent Capability Note:** This template assumes orchestration by Claude
> Code which can spawn parallel agents via the Task tool. Other AI systems
> (ChatGPT, Gemini, etc.) cannot call multiple agents and should execute
> sections sequentially or use external orchestration.

---

> **Shared Boilerplate:** Common sections (AI Models, Severity/Effort scales,
> JSONL schema, TDMS integration, Aggregation process) are canonicalized in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md). Domain-specific content
> below takes precedence.

---

## Purpose

This document serves as the **execution plan** for running a multi-AI
enhancement discovery audit on [Project Name]. This is fundamentally different
from other audit templates: it finds what could be **BETTER**, not what is
**WRONG**.

Use this template when:

- The codebase is stable and you want to find the next level of improvements
- You want fresh perspectives on product, DX, and architecture direction
- Competitor/peer projects have shipped features worth benchmarking against
- A quarterly "what are we missing?" sweep is due
- The team has bandwidth for improvement work (not firefighting)
- Before a major planning cycle to inform roadmap priorities

**Key Distinction:** Other audit templates (Code Review, Security, Performance,
Refactoring) focus on defects, debt, and risk. This template focuses on
**opportunity** -- things that are not broken but could be meaningfully better.

**Review Scope (10 Enhancement Categories):**

| #   | Domain                 | Location                               | Focus                                                  |
| --- | ---------------------- | -------------------------------------- | ------------------------------------------------------ |
| 1   | app-architecture       | `app/`, `lib/`, module structure       | Structural patterns, modularity, scalability headroom  |
| 2   | product-ux             | `components/`, `app/`, styles          | User experience gaps, accessibility, feature polish    |
| 3   | content                | `app/`, copy files, help text          | Copy, messaging, help text, onboarding flows           |
| 4   | devx-automation        | `scripts/`, `.claude/`, `package.json` | Developer experience, tooling, workflow friction       |
| 5   | infrastructure         | `.github/`, `firebase.*`, hosting      | Hosting, CI/CD, monitoring, cost optimization          |
| 6   | testing-strategy       | `tests/`, coverage configs             | Coverage strategy, test quality, testing gaps          |
| 7   | documentation-strategy | `docs/`, `*.md` in root                | Docs architecture, discoverability, maintenance burden |
| 8   | workflow-lifecycle     | CI/CD, deploy scripts, release flow    | Feature lifecycle, deploy pipeline, release process    |
| 9   | external-services      | `lib/`, API clients, integrations      | Third-party integrations, API usage, vendor fitness    |
| 10  | meta-tooling           | `.claude/`, `scripts/`, MCP configs    | AI tooling, scripts, automation opportunities          |

**Expected Output:** Ranked enhancement findings with impact/effort analysis,
competitor benchmarks, strengths documentation, and prioritized improvement
roadmap ingested to TDMS.

---

## Status Dashboard

| Step   | Description                          | Status  | Completion |
| ------ | ------------------------------------ | ------- | ---------- |
| Step 1 | Prepare audit context and scope      | PENDING | 0%         |
| Step 2 | Run multi-AI enhancement audit (4-6) | PENDING | 0%         |
| Step 3 | Collect and validate outputs         | PENDING | 0%         |
| Step 4 | Run aggregation with strengths merge | PENDING | 0%         |
| Step 5 | Create canonical findings doc        | PENDING | 0%         |
| Step 6 | Generate enhancement roadmap         | PENDING | 0%         |
| Step 7 | Ingest to TDMS                       | PENDING | 0%         |

**Overall Progress:** 0/7 steps complete

---

## Audit Context

### Repository Information

```
Repository URL: [GITHUB_REPO_URL]
Branch: [BRANCH_NAME or "main"]
Commit: [COMMIT_SHA or "latest"]
Last Enhancement Audit: [YYYY-MM-DD or "Never"]
```

### Tech Stack

```
- Framework: [e.g., Next.js 16.1 (App Router)]
- UI Library: [e.g., React 19.2.3]
- Language: [e.g., TypeScript 5.x]
- Styling: [e.g., Tailwind CSS v4]
- Backend: [e.g., Firebase Auth, Firestore, Cloud Functions]
- Testing: [e.g., Node test runner, c8 coverage]
- Monitoring: [e.g., Sentry, Vercel Analytics]
- CI/CD: [e.g., GitHub Actions]
```

### Scope

```
Include: [directories, e.g., app/, components/, hooks/, lib/, functions/, tests/, types/, scripts/]
Secondary: [optional, e.g., docs/, .github/]
Exclude: [directories, e.g., node_modules/, .next/, dist/]
```

### Current Product State

[Brief description of where the product stands today:]

- What is working well
- Recent milestones achieved
- Known areas the team already plans to improve
- User feedback themes (if available)

### Competitor / Peer Projects (Optional)

[List 2-5 comparable projects for benchmarking:]

- [Competitor 1]: [URL or name] -- [what they do well]
- [Competitor 2]: [URL or name] -- [what they do well]

---

## AI Models to Use

**Recommended configuration (4-6 models for consensus):**

| Model             | Capabilities                           | Enhancement Strength                                             |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Claude Opus 4.6   | browse_files=yes, run_commands=yes     | Deep architectural analysis, holistic improvement identification |
| Claude Sonnet 4.5 | browse_files=yes, run_commands=yes     | Cost-effective broad sweep, pattern recognition                  |
| GPT-5-Codex       | browse_files=yes, run_commands=yes     | DX tooling expertise, ecosystem best practices                   |
| Gemini 3 Pro      | browse_files=yes, run_commands=yes     | Fresh perspective, alternative approaches                        |
| GitHub Copilot    | browse_files=yes, run_commands=limited | Quick pattern spotting, IDE-level improvements                   |
| ChatGPT-4o        | browse_files=no, run_commands=no       | Broad ecosystem knowledge, UX best practices, web search         |

**Selection criteria:**

- At least 2 models with `run_commands=yes` for verification
- At least 1 model with web search for competitor benchmarking
- At least 1 model known for product/UX thinking
- Total 4-6 models for good consensus

---

## Enhancement Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are an Enhancement Advisor performing an improvement discovery audit on a
repository. You are NOT a bug finder. You are NOT looking for what is wrong. You
are looking for what could be BETTER.

Your mindset:

- The codebase works. Your job is to find the NEXT LEVEL.
- If an area is working well, SAY SO. Documenting strengths is as valuable as
  finding improvements.
- Every suggestion must include a counter_argument explaining why the current
  approach might be fine as-is.
- Think like a senior engineer joining the team with fresh eyes and broad
  industry experience.

REPO

[GITHUB_REPO_URL]

STACK / CONTEXT (treat as true)

- [Framework]: [Version]
- [UI Library]: [Version]
- [Language]: [Version]
- [Additional tech stack details...]
- Quality gates: npm run lint, npm test, npm run test:coverage

COMPETITOR / PEER CONTEXT (for benchmarking)

- [Competitor 1]: [URL or name]
- [Competitor 2]: [URL or name]
- [Competitor 3]: [URL or name]

PRE-REVIEW CONTEXT (REQUIRED READING)

> NOTE: The references below require repository access. If your AI model cannot
> browse files or run commands, skip to the CAPABILITIES section below.

Before beginning enhancement analysis, review these project-specific resources:

1. **AI Learnings** (<project_root>/claude.md Section 4): Critical lessons from
   past reviews -- understand what has already been tried or considered
2. **Architecture** (ARCHITECTURE.md): Current system design and rationale
3. **Development Guide** (DEVELOPMENT.md): Setup process, known conventions
4. **Pattern History** (../AI_REVIEW_LEARNINGS_LOG.md): Documented patterns from
   past reviews -- avoid re-suggesting what was already rejected
5. **Dependency Health**:
   - Circular dependencies: npm run deps:circular
   - Unused exports: npm run deps:unused
6. **Current Test Coverage**: npm run test:coverage
7. **npm Scripts Inventory**: npm run (list all available commands)
8. **CI/CD Workflows**: .github/workflows/ directory

These resources provide essential context. Enhancement suggestions that ignore
existing architectural decisions or repeat previously rejected ideas will have
LOW value.

SCOPE

Include: [directories] Secondary: [optional directories] Exclude: [excluded
directories]

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>,
repo_checkout=<yes/no>, web_search=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:

- Run in "NO-REPO MODE": Provide general enhancement suggestions only
- Flag all findings as SUSPECTED with confidence <= 40
- Still complete the audit but note limitation clearly
```

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:

- at least one concrete file path AND
- at least one specific indicator (code snippet, config value, missing
  capability, or measurable gap)

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

MANDATORY COUNTER-ARGUMENT RULE

Every finding MUST include a counter_argument field that explains:

- Why the current approach might be intentional
- What tradeoffs the proposed enhancement introduces
- Under what circumstances the enhancement would NOT be worth doing

A finding without a counter_argument is INVALID and must not be emitted.

CONFIDENCE THRESHOLD

- confidence >= 70: CONFIRMED finding (in FINDINGS_JSONL)
- confidence 41-69: CONFIRMED but lower priority -- include in FINDINGS_JSONL
  with a note about uncertainty
- confidence <= 40: SUSPECTED finding (in SUSPECTED_FINDINGS_JSONL)
- confidence < 70 with no file evidence: goes to INCONCLUSIVE section

Do NOT inflate confidence. If you are guessing based on general best practices
without repo-specific evidence, cap confidence at 50.

ENHANCEMENT DOMAINS (use ONLY these 10 categories)

1. app-architecture -- Structural patterns, modularity, scalability headroom
2. product-ux -- User experience gaps, accessibility, feature polish
3. content -- Copy, messaging, help text, onboarding flows
4. devx-automation -- Developer experience, tooling, workflow friction
5. infrastructure -- Hosting, CI/CD, monitoring, cost optimization
6. testing-strategy -- Coverage strategy, test quality, testing gaps
7. documentation-strategy -- Docs architecture, discoverability, maintenance
8. workflow-lifecycle -- Feature lifecycle, deploy pipeline, release process
9. external-services -- Third-party integrations, API usage, vendor fitness
10. meta-tooling -- AI tooling, scripts, automation opportunities
```

### Part 3: Review Domains

```markdown
DOMAIN-BY-DOMAIN ANALYSIS

For each of the 10 domains below, perform a thorough enhancement scan. For each
domain, you MUST output one of:

- One or more enhancement findings (with counter_arguments)
- An explicit "ADEQUATE" declaration with reasoning

Do NOT skip domains silently.

---

DOMAIN 1: app-architecture Purpose: Evaluate structural patterns for
scalability, modularity, and maintainability headroom.

LOOK FOR:

- Module boundaries that could be cleaner
- Coupling patterns that limit independent deployment or testing
- State management that could scale better
- Data flow patterns that could be simplified
- Opportunities for better code organization (colocation, feature folders)
- Patterns that would ease future feature additions
- Framework features not being leveraged (e.g., server components, streaming)

ADEQUATE IF: Clear module boundaries, consistent patterns, no obvious
scalability bottlenecks.

---

DOMAIN 2: product-ux Purpose: Identify user experience improvements and
accessibility gaps.

LOOK FOR:

- Loading states, error states, empty states that could be improved
- Accessibility gaps (ARIA labels, keyboard navigation, color contrast)
- Mobile responsiveness issues
- Animation/transition opportunities for polish
- Form validation UX (inline vs submit-time, error clarity)
- Navigation patterns that could be simplified
- Progressive disclosure opportunities
- Competitor features that users might expect

ADEQUATE IF: Good loading/error/empty states, reasonable accessibility, smooth
core flows.

---

DOMAIN 3: content Purpose: Evaluate copy, messaging, and user-facing text
quality.

LOOK FOR:

- Error messages that are technical rather than helpful
- Onboarding flows that could guide users better
- Help text or tooltips that are missing
- Inconsistent terminology across the app
- Placeholder text or TODO copy still in production
- Opportunities for better microcopy (button labels, confirmation dialogs)
- i18n readiness (hardcoded strings vs extraction)

ADEQUATE IF: Clear, consistent terminology, helpful error messages, no
placeholder text.

---

DOMAIN 4: devx-automation Purpose: Find developer experience friction and
automation opportunities.

LOOK FOR:

- Manual steps that could be scripted
- Missing npm scripts for common workflows
- Development server improvements (HMR, proxy config)
- Debugging aids that are missing (verbose mode, debug flags)
- Code generation opportunities (scaffolding, boilerplate)
- Editor/IDE integration improvements (.vscode settings, extensions)
- Git hooks that could catch more issues
- Environment setup friction

VERIFICATION COMMANDS (if run_commands=yes):

- npm run (list all scripts)
- ls scripts/
- cat .husky/pre-commit 2>/dev/null
- ls .vscode/ 2>/dev/null

ADEQUATE IF: Rich npm script inventory, automated quality gates, smooth
onboarding.

---

DOMAIN 5: infrastructure Purpose: Evaluate hosting, CI/CD, monitoring, and cost
optimization.

LOOK FOR:

- CI pipeline improvements (caching, parallelization, conditional runs)
- Build optimization opportunities (bundle analysis, tree shaking)
- Monitoring gaps (uptime, error rates, performance budgets)
- Cost optimization (unused resources, right-sizing)
- CDN and caching strategy improvements
- Environment parity issues (dev vs staging vs prod)
- Infrastructure-as-code opportunities

VERIFICATION COMMANDS (if run_commands=yes):

- ls .github/workflows/
- cat .github/workflows/\*.yml 2>/dev/null | head -200
- cat next.config.\* 2>/dev/null | head -50

ADEQUATE IF: CI is fast and reliable, monitoring covers critical paths, no
obvious waste.

---

DOMAIN 6: testing-strategy Purpose: Evaluate testing approach holistically (not
individual test bugs).

LOOK FOR:

- Coverage gaps in critical paths (auth, payments, data mutations)
- Testing pyramid imbalance (too many E2E, too few unit)
- Missing test categories (visual regression, accessibility, performance)
- Test data management improvements
- Snapshot testing overuse or underuse
- Contract testing opportunities (API boundaries)
- Test execution speed improvements
- Flaky test patterns

VERIFICATION COMMANDS (if run_commands=yes):

- npm test 2>&1 | tail -20
- npm run test:coverage 2>&1 | tail -30
- ls tests/ 2>/dev/null && ls tests/\*\*/ 2>/dev/null

ADEQUATE IF: Critical paths covered, pyramid balanced, tests run fast and
reliably.

---

DOMAIN 7: documentation-strategy Purpose: Evaluate docs architecture and
maintenance burden (not content accuracy -- that is DOCUMENTATION_AUDIT.md's
job).

LOOK FOR:

- Documentation that is hard to find or discover
- Docs maintenance burden that could be reduced (auto-generation)
- Missing architectural decision records (ADRs)
- API documentation gaps or auto-generation opportunities
- Stale docs detection automation
- Developer onboarding documentation gaps
- Runbook/playbook gaps for incident response

ADEQUATE IF: Docs are findable, reasonably current, and maintenance is
sustainable.

---

DOMAIN 8: workflow-lifecycle Purpose: Evaluate the feature development lifecycle
end to end.

LOOK FOR:

- PR workflow improvements (templates, size limits, required checks)
- Branch strategy improvements
- Release process automation opportunities
- Feature flag lifecycle management
- Rollback procedures and ease
- Deployment confidence improvements (canary, blue-green)
- Changelog generation automation

ADEQUATE IF: PRs are reviewed efficiently, releases are safe and automated,
rollbacks are easy.

---

DOMAIN 9: external-services Purpose: Evaluate third-party integrations and
vendor fitness.

LOOK FOR:

- Services approaching limits or cost thresholds
- Better alternatives to current vendors
- Missing retry/fallback patterns for external calls
- API versioning risks (deprecated endpoints)
- Rate limiting and quota management
- Service abstraction layers (ease of switching vendors)
- Missing health checks for external dependencies

VERIFICATION COMMANDS (if run_commands=yes):

- cat package.json | grep -E "firebase|sentry|stripe|auth0" (identify key
  vendors)
- grep -rn "fetch\|axios\|http" --include="\*.ts" lib/ | head -20

ADEQUATE IF: External calls have retries/fallbacks, vendor lock-in is
manageable, costs are reasonable.

---

DOMAIN 10: meta-tooling Purpose: Evaluate AI tooling, custom scripts, and
automation meta-layer.

LOOK FOR:

- AI assistant configuration improvements (claude.md, .cursorrules)
- Custom script consolidation or improvement opportunities
- MCP server opportunities for workflow acceleration
- Code review automation gaps (beyond what CodeRabbit/Qodo provide)
- Audit template improvements (meta -- improving the audit process itself)
- Data pipeline automation opportunities

ADEQUATE IF: AI tooling is well-configured, scripts are maintained, automation
layer is coherent.

---

After each domain: "Domain X ([name]) complete - Enhancements: [N], Adequate:
[yes/no]"
```

### Part 4: Output Format

````markdown
OUTPUT FORMAT (STRICT)

Return 4 sections in this exact order.

NO CODE FENCES: Output raw JSONL lines directly -- do NOT wrap FINDINGS_JSONL,
SUSPECTED_FINDINGS_JSONL, or STRENGTHS_JSONL in Markdown fenced code blocks
(including ```json blocks). The schema examples below are for reference only.

---

1. FINDINGS_JSONL (one JSON object per line, each must be valid JSON)

**NOTE (MANDATORY):** The `category` field MUST be one of the 10 enhancement
domain values: "app-architecture", "product-ux", "content", "devx-automation",
"infrastructure", "testing-strategy", "documentation-strategy",
"workflow-lifecycle", "external-services", "meta-tooling".

Schema: { "category": "<one of 10 enhancement domains>", "title": "short,
specific enhancement title", "fingerprint":
"<category>::<primary_file_or_scope>::<enhancement_slug>", "impact":
"I0|I1|I2|I3", "effort": "E0|E1|E2|E3", "confidence": 0-100, "files":
["path/to/relevant/file.ts"], "line": 1, "current_approach": "1-3 sentences
describing what exists today and how it works", "proposed_outcome": "1-3
sentences describing the desired future state", "why_it_matters": "1-3 sentences
explaining the value of the enhancement", "counter_argument": "REQUIRED. 1-3
sentences explaining why the current approach might be fine",
"concrete_alternatives": [ "Alternative A: description with specific
tool/pattern/library", "Alternative B: description with specific
tool/pattern/library" ], "suggested_fix": "The recommended path forward (pick
the best alternative)", "acceptance_tests": ["How to verify the enhancement
delivers value"], "competitor_reference": "optional: how a competitor/peer
handles this", "evidence": ["grep output, code snippet, or metric supporting the
gap"], "dependencies": ["fingerprint of prerequisite enhancement"], "notes":
"optional" }

Impact scale (enhancement-specific):

- I0: Transformative -- fundamentally changes capability or user experience
- I1: High -- significant measurable improvement to a core workflow
- I2: Medium -- noticeable improvement, good ROI
- I3: Low -- polish, marginal improvement, nice-to-have

Effort scale:

- E0: Minutes -- config change, flag flip, trivial addition
- E1: Hours -- single-session implementation
- E2: Days -- 1-3 days, possibly staged
- E3: Weeks -- multi-PR, multi-week initiative

REQUIRED FIELDS (non-negotiable):

- category (one of the 10 domains)
- title
- fingerprint
- impact
- effort
- confidence
- files (at least one path; use "N/A" only for domain-wide observations)
- line (use 1 if file-wide)
- current_approach
- proposed_outcome
- why_it_matters
- counter_argument (MUST be present -- findings without this are INVALID)
- concrete_alternatives (at least one)
- suggested_fix
- acceptance_tests (at least one)

---

2. SUSPECTED_FINDINGS_JSONL (same schema, confidence <= 40, evidence incomplete)

These are ideas worth exploring but lack concrete repo evidence. They still
require counter_argument.

---

3. STRENGTHS_JSONL (one JSON object per line)

MANDATORY SECTION. Document areas that are working well. Every domain where you
did NOT find significant enhancements MUST have at least one strength entry.
Domains WITH enhancements MAY also have strength entries.

Schema: { "category": "<one of 10 enhancement domains>", "title": "short
description of what is done well", "fingerprint":
"strength::<category>::<scope>::<strength_slug>", "files":
["path/to/exemplary/file.ts"], "description": "2-4 sentences explaining what is
good and why it works", "evidence": ["concrete indicator: code snippet, metric,
pattern"], "applicable_elsewhere": "optional: could this pattern be applied to
other areas?" }

Minimum: At least 5 strengths across the 10 domains. If the codebase is
genuinely strong in an area, say so clearly. Audit credibility depends on
balanced assessment.

---

4. HUMAN_SUMMARY (markdown)

Structure:

- **Strengths Overview**: Top 5 things the codebase does well (from STRENGTHS)
- **Enhancement Highlights**: Top 5 highest-impact enhancements (I0/I1)
- **Quick Wins**: Enhancements with E0-E1 effort and I1-I2 impact
- **Competitor Benchmarks**: Key gaps vs. competitors/peers (if web search
  available)
- **Domain Scorecard**: For each of 10 domains, one-line assessment (Strong /
  Adequate / Needs Enhancement)
- **Recommended Roadmap**: Prioritized enhancement order (impact/effort ratio)
- **Estimated Total Effort**: Sum of effort estimates
````

### Part 5: Strengths Section Requirements

```markdown
STRENGTHS DOCUMENTATION (MANDATORY)

A credible enhancement audit must document what is ALREADY GOOD. Skipping this
makes the audit look like a complaint list rather than a balanced assessment.

Rules:

1. Every domain assessed as "ADEQUATE" MUST produce at least one strength entry
2. Strengths must cite specific files or patterns (not vague praise)
3. Strengths may note where a good pattern could be extended to other areas
4. The HUMAN_SUMMARY must lead with strengths before listing enhancements

Good strength example: { "category": "testing-strategy", "title": "Comprehensive
auth flow test coverage", "fingerprint":
"strength::testing-strategy::tests/auth::complete-auth-coverage", "files":
["tests/auth/login.test.ts", "tests/auth/signup.test.ts"], "description": "Auth
flows have thorough happy-path and error-path coverage with realistic mock data.
Test isolation is clean with no shared state between tests.", "evidence": ["14
test cases covering login, signup, password reset, token refresh, and session
expiry"], "applicable_elsewhere": "The auth test pattern could be replicated for
data mutation flows (journal CRUD, growth card submissions)" }

Bad strength example (too vague, no evidence): { "title": "Good test coverage",
"description": "Tests look fine." }
```

### Part 6: Tool Evidence and Competitor Benchmarking

```markdown
TOOL EVIDENCE (ONLY IF run_commands=yes AND repo_checkout=yes)

Run these to gather enhancement-relevant data:

1. Architecture overview:

- ls app/ components/ hooks/ lib/ types/ 2>/dev/null
- wc -l app/**/\*.tsx components/**/\*.tsx 2>/dev/null | tail -5

2. DX assessment:

- npm run (list all scripts -- look for gaps)
- cat package.json | grep -c "\"scripts\""
- ls scripts/ 2>/dev/null
- cat .husky/pre-commit 2>/dev/null

3. Testing landscape:

- npm run test:coverage 2>&1 | tail -20
- ls tests/ 2>/dev/null

4. Infrastructure:

- ls .github/workflows/ 2>/dev/null
- cat next.config.\* 2>/dev/null | head -30

5. External services:

- cat package.json | grep -E "firebase|sentry|stripe|auth0|@vercel" | head -10
- grep -rn "process.env" --include="_.ts" --include="_.tsx" | head -20

In evidence, paste only minimal excerpts (file paths + 1-3 lines per match). If
a command is unavailable, write "SKIPPED: <reason>" and continue.

---

COMPETITOR / PEER BENCHMARKING (ONLY IF web_search=yes)

If you have web search capability, research these for each enhancement finding
where relevant:

1. Search for "[competitor name] [feature area]" to understand peer approaches
2. Search for "[framework] best practices [domain]" for industry standards
3. Search for "[tool name] alternatives" when suggesting vendor changes

Include findings in the competitor_reference field of each finding.

If web_search=no:

- Use your training knowledge for general industry comparisons
- Clearly label these as "based on general knowledge, not current research"
- Cap confidence at 50 for competitor-dependent findings

BENCHMARKING CATEGORIES:

- Feature parity: What do competitors offer that this project does not?
- DX parity: What developer tooling do peer projects use?
- Infrastructure parity: What hosting/monitoring patterns are industry standard?
- Testing parity: What testing approaches are considered table-stakes?
```

### Part 7: AI Instructions (10-Step Workflow)

```markdown
ENHANCEMENT AUDIT WORKFLOW (10 STEPS)

Execute these steps in order. Do not skip steps.

STEP 1: CAPABILITIES DECLARATION Print your capabilities line. If NO-REPO MODE,
flag it and continue with reduced confidence.

STEP 2: CONTEXT ABSORPTION Read the PRE-REVIEW CONTEXT files. Understand:

- What architectural decisions have already been made (and why)
- What patterns have been established
- What has been tried and rejected in past reviews
- What the team already knows about and plans to fix

STEP 3: REPOSITORY SURVEY Map the codebase structure. Understand:

- Directory layout and organization patterns
- Key configuration files
- Service boundaries
- Test organization
- Script inventory At the end: "Step 3 complete - Repository surveyed"

STEP 4: DOMAIN-BY-DOMAIN ANALYSIS For each of the 10 enhancement domains: a.
Examine relevant files and patterns b. Identify enhancement opportunities (with
counter_arguments) c. Identify strengths worth documenting d. Mark domain as
having enhancements, adequate, or both At the end of each domain: "Domain X
complete - Enhancements: N, Strengths: M"

STEP 5: COMPETITOR BENCHMARKING (if web_search=yes) For top enhancement
findings: a. Research how competitors/peers handle the same area b. Add
competitor_reference to relevant findings c. Identify any patterns the industry
considers table-stakes At the end: "Step 5 complete - Benchmarks gathered: N"
(If web_search=no: "Step 5 skipped - no web search capability")

STEP 6: COUNTER-ARGUMENT REVIEW Review ALL findings and verify each has a
genuine counter_argument:

- Not a strawman (must be a real reason to keep the current approach)
- Not dismissive (must acknowledge the tradeoff honestly)
- Not generic ("this might not be worth it" is too vague) Remove or demote
  findings where you cannot articulate a real counter_argument. At the end:
  "Step 6 complete - Findings validated: N, Demoted: M"

STEP 7: IMPACT CALIBRATION Review all impact ratings:

- I0 should be rare (0-2 per audit). If you have more, re-evaluate.
- I3 should be the most common. If not, you may be inflating impact.
- Check that impact reflects value TO THE PROJECT, not abstract best practices.
  At the end: "Step 7 complete - Impact distribution: I0=N, I1=N, I2=N, I3=N"

STEP 8: STRENGTHS COMPILATION Ensure minimum 5 strengths across domains. For
each "ADEQUATE" domain, produce at least one explicit strength entry. Review
strength evidence quality. At the end: "Step 8 complete - Strengths documented:
N across M domains"

STEP 9: OUTPUT GENERATION Produce the 4 output sections in order:

1. FINDINGS_JSONL
2. SUSPECTED_FINDINGS_JSONL
3. STRENGTHS_JSONL
4. HUMAN_SUMMARY

Verify each JSONL line is valid JSON before emitting.

STEP 10: SELF-CHECK Before finalizing, verify:

- [ ] All 10 domains addressed (enhancement or adequate)
- [ ] Every finding has counter_argument
- [ ] At least 5 strengths documented
- [ ] Confidence threshold respected (>= 70 confirmed, <= 40 suspected)
- [ ] Impact distribution is realistic (not all I0/I1)
- [ ] Files field populated with real paths
- [ ] No findings that repeat what past reviews already identified
- [ ] HUMAN_SUMMARY leads with strengths

At the end: "Enhancement audit complete. Findings: N, Suspected: M, Strengths:
S, Domains covered: 10/10"
```

---

## Aggregation Process

### Step 1: Collect Outputs

For each AI model, save:

- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_strengths.jsonl`
- `[model-name]_summary.md`

### Step 2: Run Enhancement Aggregator

Use this aggregation prompt with a capable model:

```markdown
ROLE

You are the Enhancement Audit Aggregator. Your job is to merge multiple AI
enhancement audit outputs into one deduplicated, ranked enhancement roadmap.

NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR, not a fresh auditor
- You MUST NOT invent enhancements not in auditor outputs
- Preserve counter_arguments from the most thorough source
- Merge strengths by union (keep all unique strengths)

DEDUPLICATION RULES

1. Primary merge: fingerprint (exact match)
2. Secondary merge if ALL true:
   - same category (enhancement domain)
   - > = 1 shared file OR same scope area
   - titles + suggested_fix describe same enhancement
3. Never merge "similar vibes" without evidence overlap
4. When merging, take the BEST counter_argument (most specific)

CONSENSUS SCORING (per canonical enhancement)

- sources: contributing model names
- confirmations: count in FINDINGS_JSONL
- suspects: count in SUSPECTED_FINDINGS_JSONL
- consensus_score (0-5): +2 if >= 2 confirmed sources +1 if >= 3 total sources
  mention +1 if any tool-confirmed source +1 if shared evidence overlap
- final_confidence: Start with max(confidence), then adjust:
  - if only 1 source + no tool confirm: cap at 60
  - if all suspected: cap at 40
  - if >= 2 confirmed + evidence overlap: floor at 70
- Drop findings where no model provided confidence >= 50

STRENGTHS AGGREGATION

- Union all unique strengths across models
- If multiple models cite the same strength, increase credibility note
- Include strength count in human summary

RANKING

1. impact (I0 highest)
2. consensus_score (higher first)
3. final_confidence (higher first)
4. effort (lower first -- quick wins surface)

OUTPUT

1. PARSE_ERRORS_JSON { "parse_errors":
   [{"model":"...","line":"...","reason":"..."}], "dropped_count": <int> }

2. DEDUPED_FINDINGS_JSONL { "canonical_id": "ENH-0001", "category": "...",
   "title": "...", "impact": "I0|I1|I2|I3", "effort": "E0|E1|E2|E3", "status":
   "CONFIRMED|SUSPECTED", "final_confidence": 0-100, "consensus_score": 0-5,
   "sources": ["..."], "current_approach": "...", "proposed_outcome": "...",
   "why_it_matters": "...", "counter_argument": "...", "concrete_alternatives":
   ["..."], "suggested_fix": "...", "acceptance_tests": ["..."],
   "competitor_reference": "...", "files": ["..."], "evidence_summary": ["short
   bullets only"], "dependencies": ["ENH-0003", "..."] }

3. CONSOLIDATED_STRENGTHS_JSONL { "canonical_id": "STR-0001", "category": "...",
   "title": "...", "sources": ["..."], "description": "...", "evidence": ["..."]
   }

4. ENHANCEMENT_ROADMAP_JSON { "phases": [ { "phase_id": "P1", "title": "Quick
   Wins", "goal": "...", "included_ids": ["ENH-0007", "ENH-0012"],
   "estimated_effort": "E1", "risk_level": "low", "acceptance_tests": ["..."],
   "notes": "..." } ] }

5. HUMAN_SUMMARY (markdown)
   - Top 5 strengths (with STR ids)
   - Top 5 high-impact enhancements (with ENH ids)
   - Quick wins shortlist (<= 10 items, E0-E1 with I1-I2+ impact)
   - Domain scorecard (10 domains, one-line each)
   - Items demoted or dropped (and why)
   - Recommended implementation order
```

### Step 3: Create Canonical Findings Document

Create `docs/reviews/ENHANCEMENT_AUDIT_[YYYY]_Q[X].md` with:

- All DEDUPED_FINDINGS_JSONL converted to readable format
- CONSOLIDATED_STRENGTHS_JSONL as strengths section
- ENHANCEMENT_ROADMAP_JSON as implementation roadmap
- Domain scorecard
- Link back to this template

---

## TDMS Integration

### Automatic Intake

After aggregation, ingest findings to TDMS:

```bash
node scripts/debt/intake-audit.js \
  docs/audits/single-session/enhancement/ENHANCEMENT_AUDIT_YYYY_QX.jsonl \
  --source "multi-ai-enhancement-audit" \
  --batch-id "enhancement-audit-YYYYMMDD"
```

### Required TDMS Fields

Ensure all findings include these fields for TDMS compatibility:

| Audit Field      | TDMS Field    | Notes                                   |
| ---------------- | ------------- | --------------------------------------- |
| `category`       | `category`    | Map to enhancement domain (see below)   |
| `impact`         | `severity`    | Map: I0->S0, I1->S1, I2->S2, I3->S3     |
| `files[0]`       | `file`        | Primary file path                       |
| `line`           | `line`        | Line number (use 1 if file-wide)        |
| `title`          | `title`       | Short description                       |
| `why_it_matters` | `description` | Full description with enhancement value |

### Category Mapping (Enhancement Domain -> TDMS)

| Enhancement Domain     | TDMS Category |
| ---------------------- | ------------- |
| app-architecture       | code-quality  |
| product-ux             | code-quality  |
| content                | documentation |
| devx-automation        | process       |
| infrastructure         | process       |
| testing-strategy       | code-quality  |
| documentation-strategy | documentation |
| workflow-lifecycle     | process       |
| external-services      | code-quality  |
| meta-tooling           | process       |

### Completion Checklist

After TDMS intake:

- [ ] Findings ingested without errors
- [ ] DEBT-XXXX IDs assigned
- [ ] Views regenerated (`node scripts/debt/generate-views.js`)
- [ ] Audit History updated with TDMS Items count

---

## Audit History

| Date   | Type              | Trigger  | Models Used | Enhancements | Strengths | TDMS Items   |
| ------ | ----------------- | -------- | ----------- | ------------ | --------- | ------------ |
| [Date] | Enhancement Audit | [Reason] | [Models]    | [X findings] | [X items] | [X ingested] |

---

## AI Instructions

When using this template:

1. **Copy this template** to `docs/reviews/ENHANCEMENT_AUDIT_[YYYY]_Q[X].md`
2. **Fill in Audit Context** with project-specific details (tech stack, scope,
   competitors)
3. **Paste the audit prompt** (Parts 1-7) into each selected AI model
4. **For tool-capable models**, include the Tool Evidence section (Part 6)
5. **For web-capable models**, include competitor URLs for benchmarking
6. **Collect outputs** in the specified JSONL format (findings + strengths)
7. **Run aggregation** with the Enhancement Aggregator prompt
8. **Create canonical findings doc** from aggregated output
9. **Ingest to TDMS** using `node scripts/debt/intake-audit.js`
10. **Update [COORDINATOR.md](../COORDINATOR.md)** with audit results and
    trigger reset

**Quality checks before finalizing:**

- [ ] All 10 enhancement domains addressed
- [ ] Every finding has a counter_argument
- [ ] At least 5 strengths documented with evidence
- [ ] Impact ratings are realistic (not all I0/I1)
- [ ] Confidence threshold respected (70+ confirmed, 40- suspected)
- [ ] HUMAN_SUMMARY leads with strengths
- [ ] Competitor benchmarks included (if web search available)
- [ ] All JSONL outputs are valid JSON
- [ ] TDMS intake completed without errors
- [ ] DEBT-XXXX IDs assigned to all findings

---

## Related Documents

- **[SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md)** - Shared boilerplate
  for all audit templates
- **[JSONL_SCHEMA_STANDARD.md](../../templates/JSONL_SCHEMA_STANDARD.md)** -
  Canonical JSONL schema for all review templates
- **[COORDINATOR.md](../COORDINATOR.md)** - Master index and trigger tracking
- **[AGGREGATOR.md](./AGGREGATOR.md)** - Aggregation prompt and deduplication
  rules
- **[docs/technical-debt/PROCEDURE.md](../../technical-debt/PROCEDURE.md)** -
  TDMS intake and tracking procedures
- **[CODE_REVIEW_PLAN.md](./CODE_REVIEW_PLAN.md)** - Tactical code review
  (finding bugs/debt)
- **[REFACTORING_AUDIT.md](./REFACTORING_AUDIT.md)** - Large-scale refactoring
  (consolidation)
- **[ENGINEERING_PRODUCTIVITY_AUDIT.md](./ENGINEERING_PRODUCTIVITY_AUDIT.md)**
  - Engineering productivity (DX friction)
- **[PERFORMANCE_AUDIT_PLAN.md](./PERFORMANCE_AUDIT_PLAN.md)** -
  Performance-focused reviews
- **[SECURITY_AUDIT_PLAN.md](./SECURITY_AUDIT_PLAN.md)** - Security-focused
  reviews
- **[DOCUMENTATION_AUDIT.md](./DOCUMENTATION_AUDIT.md)** - Documentation quality
  audit
- **[PROCESS_AUDIT.md](./PROCESS_AUDIT.md)** - Process and automation audit

---

## Version History

| Version | Date       | Changes                                                                                         | Author |
| ------- | ---------- | ----------------------------------------------------------------------------------------------- | ------ |
| 1.1     | 2026-02-16 | AUDIT_STANDARDS compliance: Converted Review Domains to Review Scope table with Location column | Claude |
| 1.0     | 2026-02-11 | Initial template creation                                                                       | Claude |

---

**END OF ENHANCEMENT_AUDIT.md**
