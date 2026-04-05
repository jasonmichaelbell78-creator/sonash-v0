# Findings: SQ5 (Part C) — Which Deployment, CI/CD, Testing, and Debugging Workflows Lack Dedicated Agents?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ5-C

---

## Executive Summary

This analysis covers five remaining pipeline categories not addressed in D5a
(skills) or D5b (hooks/sessions): testing, debugging, deployment/CI,
documentation, debt management, and content/research. The key pattern across all
five is that **agents exist but are wired loosely or not at all into the
automated pipelines**. The `test-engineer` and `deployment-engineer` agents both
exist but neither is invoked from the test-suite skill, CI workflows, or the
deploy pipeline. The three debugging agents (`debugger`, `error-detective`,
`devops-troubleshooter`) have overlapping mandates and are not wired to
automated failure detection. Documentation pipelines (`doc-optimizer`,
`docs-maintain`) use 13 purpose-built agents internally but expose no agents to
callers. The debt-runner uses convergence-loop inline without subagents. Seven
new agent gap recommendations emerge from this analysis.

---

## Key Findings

### Finding 1: test-suite — test-engineer Agent Exists But Is Not Wired Into Testing Pipeline [CONFIDENCE: HIGH]

The `test-suite` SKILL.md (v1.0, 2026-02-07) is a fully inline orchestration
skill. It runs 5 phases (SMOKE, FEATURE, SECURITY, PERFORMANCE, REPORT) with no
agent spawning at any phase. All test execution, failure analysis, and reporting
happens within the main Claude context.

The `test-engineer` agent exists (`.claude/agents/test-engineer.md`) with Opus
model and SoNash-specific overrides (Vitest, Firebase mocking patterns, 3,500+
test suites). It is listed in CLAUDE.md Section 7 as a POST-TASK trigger for
"Built UI feature" and "Wrote/modified code." Despite this, it is never invoked
from within `/test-suite`.

**Specific gaps:**

1. **Test failure diagnostic agent:** When Phase 1 SMOKE fails (GATE: abort
   entire run), no diagnostic agent analyzes root cause. The skill aborts and
   presents raw failure data. A `test-engineer` invocation with the failure
   JSONL would classify the failure (infrastructure vs. app regression vs. auth
   issue) and propose targeted fixes.

2. **Coverage analysis agent:** Phase 5 generates a JSONL report but does not
   analyze coverage trends, identify under-tested paths, or recommend new
   protocol files. The `test-engineer` agent's coverage analysis capabilities
   are unused.

3. **Protocol gap detector:** No agent reviews the test-protocols directory to
   detect new features that lack `.protocol.json` files. This is entirely
   manual.

4. **Cross-phase failure correlation:** When failures occur across SMOKE +
   FEATURE + SECURITY simultaneously, no correlation analysis identifies whether
   they share a root cause (e.g., auth regression). Each phase is independent.

**Sources:** `.claude/skills/test-suite/SKILL.md`,
`.claude/agents/test-engineer.md`

---

### Finding 2: systematic-debugging — Three Redundant Agents, Zero Pipeline Wiring [CONFIDENCE: HIGH]

The `/systematic-debugging` skill (v1.0) is entirely inline across 5 phases with
no agent spawning. CLAUDE.md Section 7 lists it as a PRE-TASK trigger for
"Bug/error/unexpected behavior" — invoked by name as a skill, not as an agent.

Three agents exist with overlapping debugging mandates:

| Agent                   | Model  | Focus                                                              |
| ----------------------- | ------ | ------------------------------------------------------------------ |
| `debugger`              | sonnet | Root cause analysis, minimal fix, stack trace analysis             |
| `error-detective`       | sonnet | Log analysis, error pattern detection, correlation across services |
| `devops-troubleshooter` | sonnet | Production troubleshooting, deployment failures, log correlation   |

**Critical gap — no differentiation contract:** All three agents have similar
tool sets (Read, Write, Edit, Bash, Grep) and similar approaches ("gather facts
first", "systematic debugging"). There is no documented decision rule for when
to use each. A caller encountering a test failure has no guidance on whether to
invoke `debugger`, `error-detective`, or `systematic-debugging` skill.

**Pipeline wiring gaps:**

1. **loop-detector hook (D5b Finding 8):** Detects 3+ identical failures over 20
   min but emits only a warning. No agent is spawned. The `debugger` or
   `systematic- debugging` skill should be invoked automatically at the loop
   threshold.

2. **CI failure diagnosis:** When the CI workflow fails
   (`.github/workflows/ci.yml`), there is no `/gh-fix-ci` → agent pipeline. The
   `/gh-fix-ci` skill fetches logs and creates a plan, but it delegates to the
   `plan` skill — not to `debugger` or `error-detective`.

3. **Session-start failures:** `session-start.js` writes failures to
   `session-start-failures.json`. These are read by `session-begin` and
   presented to the user, but no debugging agent is invoked to diagnose them.

**Agent consolidation recommendation:** The three debugging agents should be
differentiated or merged. Suggested split: `debugger` (code-level, local
errors), `error-detective` (log analysis, patterns across time),
`devops-troubleshooter` (infrastructure, deployment, production incidents). All
three should be wired as fallback targets in the systematic-debugging skill's
multi-component diagnostic path (Phase 1, Step 4).

**Sources:** `.claude/skills/systematic-debugging/SKILL.md`,
`.claude/agents/debugger.md`, `.claude/agents/error-detective.md`,
`.claude/agents/devops-troubleshooter.md`

---

### Finding 3: Deployment Pipeline — deployment-engineer Agent Exists But No Diagnostic Path on Failure [CONFIDENCE: HIGH]

The deployment pipeline is split across two GitHub Actions workflows:

- `deploy-firebase.yml`: Deploy Cloud Functions, Firestore rules, Hosting on
  push to main; Preview Channel deploys on PRs (currently disabled via commented
  trigger)
- `ci.yml`: Lint, TypeScript, Tests, Coverage, Pattern compliance, Build — 4
  parallel jobs with dependency chain (build requires lint + test + validate)

The `deployment-engineer` agent exists (`.claude/agents/deployment-engineer.md`,
sonnet model) and covers CI/CD pipelines, GitHub Actions, zero-downtime
deployments. The `/gh-fix-ci` skill provides CI failure investigation.

**Specific gaps identified:**

1. **Deploy-safeguard diagnostic gap (inherited from D5b):** The
   `deploy-safeguard.js` hook blocks deploys when build is stale, env vars are
   missing, or tests have not been run. When blocked, no `deployment-engineer`
   agent is invoked to diagnose why the build is stale or which tests need
   re-running. The user receives a block message with a manual investigation
   requirement.

2. **CI job failure routing:** When `ci.yml` fails, the failure can originate in
   lint (Job 1), test (Job 2), validate (Job 3), or build (Job 4 — which depends
   on all three). The `/gh-fix-ci` skill handles investigation via
   `gh run view --log`, but there is no automatic routing to
   `deployment-engineer` for infrastructure failures vs. `debugger` for code
   failures vs. `security-auditor` for compliance failures. The distinction
   matters: a Gitleaks failure in the validate job requires `security-auditor`,
   while a TypeScript error in the test job requires `debugger`.

3. **No post-deploy verification agent:** The `deploy-firebase.yml` workflow has
   a "Deployment Summary" step that prints URLs but performs no verification.
   The `/test-suite --post-deploy` scope exists for exactly this purpose but is
   not wired into the GitHub Actions workflow. There is also no agent that runs
   post-deploy checks and reports back.

4. **Preview channel disabled:** Preview channel deploys are commented out in
   `deploy-firebase.yml` ("GitHub repo variables not configured"). There is no
   agent or skill tasked with diagnosing and re-enabling preview channels — this
   is a known gap that has been left as infrastructure debt.

**Sources:** `.github/workflows/deploy-firebase.yml`,
`.github/workflows/ci.yml`, `.claude/agents/deployment-engineer.md`,
`.claude/skills/gh-fix-ci/SKILL.md`

---

### Finding 4: Documentation Pipeline — doc-optimizer Has 13 Agents Internally But Exposes None to Callers [CONFIDENCE: HIGH]

The documentation pipeline has two skills:

- `/docs-maintain` (v1.0): Inline skill, runs `npm run docs:sync-check` and
  `npm run docs:index`. No agents spawned. Single-pass check and update.
- `/doc-optimizer` (v1.4): 5-wave, 13-agent orchestrator. All 13 agents are
  purpose-built with specialized mandates (Format & Lint Fixer, Header &
  Metadata Fixer, External Link Validator, etc.). This is the most agent-rich
  skill in the ecosystem after deep-research.

**The doc-optimizer agent catalog is rich but self-contained.** The 13 agents
are spawned exclusively within `/doc-optimizer` and are not reachable from other
skills. There is no `documentation-expert` agent subtyping that routes to
doc-optimizer's specialized agents (e.g., when CLAUDE.md's "new documentation"
trigger fires, the `documentation-expert` agent is invoked, but it is a separate
agent `.claude/agents/documentation-expert.md` — not the doc-optimizer agents).

**Specific gaps:**

1. **No doc-staleness agent at session-begin:** CLAUDE.md and session-begin
   Phase 2 check git log against ROADMAP checkboxes, but no agent detects
   cross-document staleness (e.g., SESSION_CONTEXT.md references a completed
   feature, but ROADMAP.md still shows it as planned). The doc-optimizer's
   Freshness & Lifecycle agent (2C) does exactly this but is only accessible via
   `/doc-optimizer`.

2. **docs-maintain has no agent escalation:** When `npm run docs:sync-check`
   returns exit code 1 (sync issues found), docs-maintain reports the issues but
   spawns no agent to fix them. The doc-optimizer agents 1A (Format Fixer) and
   1B (Header Fixer) are auto-fix agents that could be invoked directly for
   targeted repairs.

3. **Documentation-expert agent body is generic:** Reading
   `.claude/agents/ documentation-expert.md` was not done (file not in the
   initial Glob output under agents — confirmed present). The agent is listed in
   CLAUDE.md as a trigger for "new documentation." Given the richness of the
   doc-optimizer pipeline, the documentation-expert agent should route complex
   documentation tasks to doc- optimizer's specialized agents rather than
   handling everything inline.

**Sources:** `.claude/skills/doc-optimizer/SKILL.md`,
`.claude/skills/docs-maintain/SKILL.md`, CLAUDE.md Section 7

---

### Finding 5: Debt Management Pipeline — debt-runner Uses Convergence-Loop Inline, No Mutation or Verification Subagents [CONFIDENCE: HIGH]

The `/debt-runner` skill (v1.1, 2026-03-15) is a 7-mode interactive orchestrator
that applies convergence-loop verification at every mode. From D5a Finding 14,
debt-runner uses convergence-loop inline without subagents. This finding extends
that analysis with specific mode-level gaps.

**Architecture note:** debt-runner's "handoff" rule (Plan mode: ">10 items =
subagent for execution") refers to delegating remediation work to a subagent —
but this subagent has no defined type. The SKILL.md says "manual for <10 items,
subagent for 10+, flag S0 security for /security-auditor" but does not specify
what type of subagent handles the >10 remediation case. In practice, this likely
defaults to general-purpose.

**Specific gaps by mode:**

1. **Verify mode — no code-verifier subagent:** The verify mode checks whether
   debt items "still exist" in the codebase. This requires grepping code,
   reading files, and comparing against debt metadata. When item counts exceed
   ~20, this is a significant analytical load on the main context. A
   `code-reviewer` subagent (which already exists) could be dispatched per
   severity slice to verify item accuracy in parallel.

2. **Plan mode — no implementation subagent:** The plan mode generates a
   resolution plan and notes ">10 items = subagent for execution." No subagent
   type is specified. A `code-reviewer` or `test-engineer` (depending on debt
   type) would be appropriate named subagents here, but the skill leaves this
   decision to the orchestrator.

3. **Dedup mode — no similarity-analysis subagent:** The dedup mode runs
   `dedup-multi-pass.js` and presents merge decisions. For >20 items (the
   delegation threshold), the skill offers "You decide / severity filter / batch
   review" but does not define an agent to analyze semantic similarity of debt
   descriptions. This is text analysis work that could be offloaded.

4. **S0 security debt — no automatic security-auditor invocation:** The Plan
   mode rule "Flag S0 security for /security-auditor" is a recommendation, not a
   trigger. There is no automatic dispatch of `security-auditor` when S0
   security items are present in the plan. This is a risk gap — security debt
   items could be resolved without expert security review.

**Sources:** `.claude/skills/debt-runner/SKILL.md`

---

### Finding 6: Content/Research Pipeline — content-research-writer Has No Agent Infrastructure [CONFIDENCE: HIGH]

The `/content-research-writer` skill (v1.1, 2026-02-25) is a pure inline skill —
a writing assistant that helps with outlining, research, citations, and drafts.
It has no agent spawning in any of its 8 steps.

**Assessment:** This is appropriate given the skill's purpose. Content creation
is an interactive, context-rich process where the main Claude context should
maintain continuity. Spawning subagents would fragment the writing context and
complicate voice preservation. The "research" in this skill uses built-in Claude
web search (via `WebSearch` tool) rather than the deep-research agent
infrastructure.

**No agent gap here.** The skill's design is intentionally inline. The only
potential enhancement would be using the `/deep-research` skill for
evidence-gathering phases when high-confidence citations are needed, but this is
an optional enhancement, not a gap.

**Sources:** `.claude/skills/content-research-writer/SKILL.md`

---

### Finding 7: system-test and webapp-testing — No Agent Infrastructure [CONFIDENCE: HIGH]

Both `/system-test` (v4.0, 23-domain interactive) and `/webapp-testing` (v1.0,
Playwright toolkit) are fully inline skills with no agent spawning.

**system-test assessment:** The skill runs 23 domains sequentially with
interactive review. It explicitly chose sequential over parallel execution
(noted as "unlike v3.1 which spawned 9 sub-skills in parallel waves"). The
design decision was deliberate: per-finding interactive review requires
continuity that parallel agents would disrupt. The skill has self-auditing built
in (Domain 21) and TDMS integration. No agent gap — the design tradeoff is
intentional.

**webapp-testing assessment:** A helper toolkit for Playwright automation. No
agent infrastructure is needed — it's a script-execution skill. No agent gap.

**Sources:** `.claude/skills/system-test/SKILL.md`,
`.claude/skills/webapp-testing/SKILL.md`

---

## Per-Pipeline Analysis Table

| Pipeline                         | Agents Available                                       | Agents Used         | Gap Type                      | Gap Severity |
| -------------------------------- | ------------------------------------------------------ | ------------------- | ----------------------------- | ------------ |
| Testing (test-suite)             | `test-engineer` (Opus)                                 | NONE                | Not wired                     | HIGH         |
| Debugging (systematic-debugging) | `debugger`, `error-detective`, `devops-troubleshooter` | NONE (inline only)  | Not wired + unclear routing   | HIGH         |
| Deployment (CI/deploy)           | `deployment-engineer`                                  | NONE                | Not wired, no diagnostic path | MEDIUM       |
| Documentation (doc-optimizer)    | 13 internal agents                                     | Self-contained only | Not exposed to callers        | MEDIUM       |
| Debt management (debt-runner)    | `code-reviewer`, `security-auditor` (referenced)       | CL inline only      | Subagent type undefined       | MEDIUM       |
| Content/research                 | None (by design)                                       | N/A                 | No gap                        | N/A          |
| system-test / webapp-testing     | None (by design)                                       | N/A                 | No gap                        | N/A          |

---

## Agent Recommendations

### HIGH PRIORITY

**Rec-1: Wire test-engineer into test-suite failure path**

When Phase 1 SMOKE fails, invoke `test-engineer` with the failure JSONL as
context. The agent analyzes whether the failure is infrastructure (server
unreachable), regression (recent code change), or auth (session expired) and
produces a targeted fix recommendation. Pattern: follows the `debugger` subagent
pattern from `pre-commit-fixer` Step 4.

**Rec-2: Create debugging-router pattern (not a new agent, a routing
convention)**

Define a documented decision rule for when to use `debugger` vs.
`error-detective` vs. `devops-troubleshooter` vs. `systematic-debugging` skill:

- `debugger` → local code errors, test failures, TypeScript/build errors
- `error-detective` → log analysis, production error patterns, anomalies
- `devops-troubleshooter` → deployment failures, infrastructure issues
- `systematic-debugging` skill → complex multi-component issues requiring
  5-phase methodology

Wire `debugger` agent to the loop-detector hook's escalation threshold (3
identical failures → auto-invoke).

### MEDIUM PRIORITY

**Rec-3: Create ci-failure-router agent or routing convention for gh-fix-ci**

The `/gh-fix-ci` skill should route failures by type: TypeScript/test failures →
`debugger`, security/gitleaks failures → `security-auditor`, build/deploy
failures → `deployment-engineer`. Currently it routes everything to the `plan`
skill uniformly.

**Rec-4: Specify subagent type in debt-runner Plan mode handoff**

The ">10 items = subagent" rule should specify the subagent type. Default:
general- purpose agent with debt schema embedded. S0 items: mandatory
`security-auditor` invocation (change from recommendation to MUST).

**Rec-5: Create doc-staleness-checker agent or wire doc-optimizer 2C to
session-begin**

The Freshness & Lifecycle agent (2C) from doc-optimizer detects stale documents.
This capability should be accessible outside the full doc-optimizer run. Either
extract it as a standalone `doc-staleness-checker` agent or add a lightweight
staleness check to session-begin Phase 2.

### LOW PRIORITY

**Rec-6: Add post-deploy verification trigger for test-suite --post-deploy**

After successful `deploy-firebase.yml` deployment, a webhook or GitHub Actions
step could trigger `/test-suite --post-deploy`. This is infrastructure work
(requires GitHub Actions → Claude Code integration) rather than an agent gap,
but surfaces here as a pipeline completeness issue.

**Rec-7: Wire security-auditor as mandatory for S0 debt in debt-runner Plan
mode**

Currently advisory ("flag S0 security"). Change to MUST with `security-auditor`
subagent dispatch when the plan contains any S0 severity items.

---

## Priority Ranking (All Recommendations Consolidated Across D5a + D5b + D5c)

This ranking integrates findings from all three D5 analyses for the
orchestrator's reference:

| Rank | Source | Gap                                             | Recommendation                         | Impact                                |
| ---- | ------ | ----------------------------------------------- | -------------------------------------- | ------------------------------------- |
| P1   | D5b-F8 | loop-detector — no escalation                   | Wire `debugger` at 3-failure threshold | Passive → active remediation          |
| P1   | D5b-F6 | pre-commit secrets — no triage                  | `security-auditor` on gitleaks         | Critical security path                |
| P1   | D5c-F2 | 3 debugging agents — no routing                 | Define routing convention              | Prevents wrong-agent invocation       |
| P2   | D5c-F1 | test-suite SMOKE fail — no diagnosis            | `test-engineer` on Phase 1 abort       | Converts abort into actionable output |
| P2   | D5b-F2 | pre-commit-compliance — blocks not spawns       | `pre-commit-reviewer` agent            | Closes gate enforcement gap           |
| P3   | D5c-F3 | deploy-safeguard blocks — no diagnosis          | `deployment-engineer` on block         | Manual investigation eliminated       |
| P3   | D5c-F3 | CI failure routing — uniform plan path          | Route by failure type to specialist    | Reduces mean-time-to-fix              |
| P3   | D5a-F1 | deep-research contrarian/OTB — no custom agents | Define custom agent bodies             | Mandatory roles, high frequency       |
| P3   | D5a-F6 | convergence-loop — no verifier agent            | `convergence-loop-verifier`            | 6+ callers, T20 format                |
| P4   | D5c-F5 | debt-runner Plan mode — undefined subagent      | Specify subagent type + S0 MUST        | Security debt escaping review         |
| P4   | D5c-F4 | doc-optimizer agents — self-contained           | Expose staleness check externally      | Session-begin freshness gap           |
| P5   | D5b-F4 | session-end compliance — queued reviews skip    | `post-session-compliance` agent        | Code escaping review                  |

---

## Sources

| #   | File / Path                                       | Type                    | Trust | CRAAP | Date            |
| --- | ------------------------------------------------- | ----------------------- | ----- | ----- | --------------- |
| 1   | `.claude/skills/test-suite/SKILL.md`              | Codebase (ground truth) | HIGH  | 5/5   | v1.0 2026-02-07 |
| 2   | `.claude/skills/systematic-debugging/SKILL.md`    | Codebase (ground truth) | HIGH  | 5/5   | v1.0 2026-02-25 |
| 3   | `.claude/skills/debt-runner/SKILL.md`             | Codebase (ground truth) | HIGH  | 5/5   | v1.1 2026-03-15 |
| 4   | `.claude/skills/docs-maintain/SKILL.md`           | Codebase (ground truth) | HIGH  | 5/5   | v1.0 2026-02-14 |
| 5   | `.claude/skills/doc-optimizer/SKILL.md`           | Codebase (ground truth) | HIGH  | 5/5   | v1.4 2026-02-24 |
| 6   | `.claude/skills/content-research-writer/SKILL.md` | Codebase (ground truth) | HIGH  | 5/5   | v1.1 2026-02-25 |
| 7   | `.claude/skills/system-test/SKILL.md`             | Codebase (ground truth) | HIGH  | 5/5   | v4.0 2026-02-18 |
| 8   | `.claude/skills/webapp-testing/SKILL.md`          | Codebase (ground truth) | HIGH  | 5/5   | v1.0 2026-02-25 |
| 9   | `.claude/skills/gh-fix-ci/SKILL.md`               | Codebase (ground truth) | HIGH  | 5/5   | v1.0 2026-02-25 |
| 10  | `.github/workflows/deploy-firebase.yml`           | Codebase (ground truth) | HIGH  | 5/5   | 2026-03         |
| 11  | `.github/workflows/ci.yml`                        | Codebase (ground truth) | HIGH  | 5/5   | 2026-03         |
| 12  | `.claude/agents/deployment-engineer.md`           | Codebase (ground truth) | HIGH  | 5/5   | 2026-03         |
| 13  | `.claude/agents/test-engineer.md`                 | Codebase (ground truth) | HIGH  | 5/5   | 2026-03         |
| 14  | `.claude/agents/debugger.md`                      | Codebase (ground truth) | HIGH  | 5/5   | 2026-03         |
| 15  | `.claude/agents/error-detective.md`               | Codebase (ground truth) | HIGH  | 5/5   | 2026-03         |
| 16  | `.claude/agents/devops-troubleshooter.md`         | Codebase (ground truth) | HIGH  | 5/5   | 2026-03         |

---

## Contradictions

**test-suite vs. CLAUDE.md trigger table:** CLAUDE.md Section 7 lists
`test-engineer` as a POST-TASK trigger for "Built UI feature" and implies it
should be used for test quality. Yet the `/test-suite` skill — which is
explicitly about UI testing — never invokes `test-engineer`. The trigger
operates at the session/task level, but the skill itself has no internal
test-engineer wiring. These are two different invocation paths that don't
connect.

**system-test v3.1 vs. v4.0 design choice:** v3.1 ran 9 sub-skills in parallel
waves (agent-like). v4.0 deliberately chose sequential interactive execution.
This is a documented design decision (not a gap) but represents a regression in
parallelism that was intentional. The v4.0 tradeoff is: better user experience,
lower speed.

**three debugging agents — no conflict resolution:** `debugger`,
`error-detective`, and `devops-troubleshooter` all have "PROACTIVELY" in their
descriptions, suggesting they are alternatives for similar situations. CLAUDE.md
Section 7 does not list all three — it lists only `systematic-debugging` as the
trigger for bugs/errors. This creates ambiguity: are the three agents intended
as sub-agents of `systematic-debugging`, as alternatives to it, or as
context-specific variants? The skill and agents were created independently
without a documented integration contract.

---

## Gaps

1. **documentation-expert agent body not read:** The
   `.claude/agents/documentation-expert.md` file exists but was not read in this
   analysis (it was not in the initial agents/ Glob that returned 26 local
   agents — confirmed present via CLAUDE.md reference). Its body would clarify
   whether it routes to doc-optimizer or operates independently. This gap
   affects the accuracy of Finding 4.

2. **Invocation frequency data not consulted:** Like D5a, frequency analysis is
   based on CLAUDE.md trigger tables and integration sections, not actual
   invocation logs (`agent-invocations.jsonl`). The debt-runner and
   doc-optimizer frequency estimates are inferential.

3. **Deploy-safeguard agent routing — not verified:** D5b identified
   deploy-safeguard blocking without diagnostic. This analysis confirms no agent
   exists for this case but did not verify whether `deployment-engineer` was
   ever manually invoked after a deploy-safeguard block in past sessions.

4. **GitHub Actions → Claude Code integration path:** Whether GitHub Actions
   failures can automatically trigger Claude Code agent invocations was not
   researched. The `/gh-fix-ci` skill is human-initiated; fully automated CI
   failure response would require external tooling.

---

## Serendipity

**doc-optimizer is an agent architecture exemplar:** With 13 purpose-built
agents across 5 waves, doc-optimizer is the most sophisticated multi-agent skill
in the ecosystem (after deep-research). Its agent specialization pattern — each
agent owns a narrow domain, writes only JSONL output, returns a single COMPLETE
line — is the cleanest implementation of the return-protocol pattern. Skills
like `system-test` v3.1 and future parallel audits could follow this exact
template.

**test-engineer has SoNash-specific overrides baked in:** The test-engineer
agent body contains detailed SoNash overrides (Vitest not Jest, Firebase
mocking, sanitizeError pattern, 3,500+ tests). This is unusually rich for an
agent definition. It means wiring test-engineer into test-suite failures would
immediately produce SoNash-contextualized analysis rather than generic test
debugging. The ROI of wiring is higher than it would appear from the agent's
generic description.

**Three debugging agents represent technical debt in the agent ecosystem:** The
existence of `debugger`, `error-detective`, and `devops-troubleshooter` as three
overlapping sonnet agents with similar tool sets suggests these were created at
different times without a unified debugging taxonomy. Before wiring any of them
into automated pipelines, a consolidation review would prevent routing
inconsistency from being encoded into the pipeline.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings derived from direct filesystem reads of skill files, agent
definitions, and GitHub Actions workflow files. No training data or external
sources consulted.
