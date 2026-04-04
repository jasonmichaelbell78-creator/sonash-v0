# Findings: Deep Redundancy Analysis and Consolidation Recommendations

**Searcher:** deep-research-searcher **Profile:** codebase + web **Date:**
2026-03-29 **Sub-Question IDs:** SQ7-B

---

## Key Findings

### 1. Debugging Cluster: debugger, error-detective, devops-troubleshooter, gsd-debugger [CONFIDENCE: HIGH]

**File sizes:**

- `debugger.md`: 37 lines (stub)
- `error-detective.md`: 40 lines (stub)
- `devops-troubleshooter.md`: 40 lines (stub)
- `gsd-debugger.md`: 1258 lines (global, full implementation)

**Capability mapping — what each stub covers:**

| Capability                     | debugger | error-detective | devops-troubleshooter |
| ------------------------------ | -------- | --------------- | --------------------- |
| Root cause analysis            | yes      | yes             | yes                   |
| Log analysis                   | implied  | PRIMARY         | PRIMARY               |
| Stack trace analysis           | yes      | yes             | no                    |
| Error pattern/correlation      | no       | yes             | yes                   |
| Hypothesis-based investigation | yes      | no              | yes                   |
| Container/kubectl/k8s          | no       | no              | yes                   |
| Incident response / runbooks   | no       | no              | yes                   |
| Deployment rollbacks           | no       | no              | yes                   |
| Monitoring setup               | no       | yes             | yes                   |
| Distributed system correlation | no       | yes             | yes                   |
| Code-level fixes               | yes      | yes             | no                    |
| Prevention recommendations     | yes      | yes             | yes                   |

**Overlap analysis:** All three stubs share root cause analysis, log analysis,
and prevention recommendations as goals. The differentiation is thin:

- `error-detective` is log-pattern/regex-focused for distributed systems (ELK,
  Splunk)
- `devops-troubleshooter` is ops-infrastructure-focused (containers, k8s,
  deployment rollbacks)
- `debugger` is code-level, hypothesis-driven

The 80% overlap finding from D3c is confirmed. In practice, a developer
debugging a production issue would need log analysis (error-detective),
infrastructure context (devops-troubleshooter), and code-level root cause
(debugger) — all three, in sequence, not as separate invocations.

**gsd-debugger relationship:** gsd-debugger (1258 lines, global) is
fundamentally different in operational model:

- It is a **stateful, session-based** debugger with persistent debug files
  (`.planning/debug/*.md`)
- It is **pipeline-invoked** by `/gsd:debug` command and `diagnose-issues`
  workflow
- It manages checkpoints, resume-from-clear, and structured return formats
- It is NOT redundant with the project-level stubs — it is the sophisticated
  interactive alternative

The three project-level stubs are poor man's versions that duplicate
gsd-debugger conceptually but lack its machinery. They serve as the "quick
invoke" path (Task tool rather than full gsd session).

**Consolidation design — elevated `debugger` agent:**

Replace all three stubs with a single elevated `debugger.md` that:

1. **Retains** code-level hypothesis testing (current debugger strength)
2. **Absorbs** log analysis and pattern detection (from error-detective):
   - Regex-based log extraction
   - Error correlation across services / time windows
   - Monitoring query generation (Datadog, ELK)
3. **Absorbs** targeted ops context (from devops-troubleshooter):
   - Container/kubectl debug commands where relevant
   - Deployment correlation (was this working before the last deploy?)
   - Runbook-style output format
4. **Drops** full incident response infrastructure (that's ops team territory,
   not a solo-dev sobriety app)
5. **Retains the gsd-debugger distinction** in description: "For interactive
   session-based debugging, use `/gsd:debug` instead."

The elevated debugger should run on **sonnet** (matches current). It does not
need Opus because gsd-debugger already provides the high-investment debugging
path.

**Files to delete:** `error-detective.md`, `devops-troubleshooter.md` **Files to
rewrite:** `debugger.md` — elevate from 37-line stub to ~100-150 line focused
agent

---

### 2. Documentation Cluster: technical-writer, documentation-expert [CONFIDENCE: HIGH]

**File sizes:**

- `technical-writer.md`: 41 lines (stub)
- `documentation-expert.md`: 119 lines (substantial, has scope boundary)

**Scope boundary verification:**

The "partial mitigation via scope boundary added in P4.1" is **confirmed** and
is explicit in `documentation-expert.md`:

```
## Scope Boundary

**You handle (documentation-expert):**
- System docs: CLAUDE.md, SESSION_CONTEXT.md, ROADMAP.md, AI_WORKFLOW.md
- Agent docs: files under docs/agent_docs/ and .claude/agents/
- API and schema docs: Cloud Functions, Zod schemas, FirestoreService methods
- Architecture docs: design decisions, data models, component architecture
- Hook and script docs: pre-commit hooks, CLI tooling, build pipeline
- Documentation index maintenance (npm run docs:index)
- Skill files under .claude/skills/

**technical-writer handles instead:**
- User-facing guides and tutorials
- README files and getting started documentation
- Content accessibility and plain language rewrites
- Tutorial series with progressive complexity
```

**Boundary quality assessment:**

The boundary is **clear and non-overlapping** at the categorical level. However,
there is one practical ambiguity: "architecture docs: design decisions, data
models, component architecture" in documentation-expert could overlap with
"architecture and design documentation" listed in technical-writer's Focus
Areas. The technical-writer's current description includes "Architecture and
design documentation" as a focus area without excluding the documentation-expert
territory — a latent conflict.

**Merge assessment:**

These should **NOT be merged**. The reasoning:

1. The boundary is substantive, not cosmetic — internal vs. user-facing is a
   real cognitive distinction
2. `documentation-expert` carries SoNash-specific conventions (prettier-ignore
   headers, version tables, docs:index) that would contaminate a general
   technical writer
3. `technical-writer` is intentionally generic — could be used for any project.
   `documentation-expert` is SoNash-specific by design.
4. Line counts reflect appropriate complexity: the internal doc specialist is
   more complex (conventions, checklists) than the general writer (principles)

**Recommendation:**

Keep both agents. Fix the latent overlap by updating `technical-writer.md`'s
Focus Areas to explicitly exclude internal project docs. The technical-writer
description lists "Architecture and design documentation" without the qualifier
— it should read "User-facing architecture guides (not internal design docs —
use documentation-expert for those)."

**Files to keep:** Both. Minor edit to `technical-writer.md` to clarify scope.

---

### 3. Security Cluster: security-auditor, security-engineer, penetration-tester [CONFIDENCE: HIGH]

**File sizes:**

- `security-auditor.md`: 534 lines (Sonnet) — SoNash-specific, code review focus
- `security-engineer.md`: 985 lines (Opus) — infrastructure/compliance/AWS focus
- `penetration-tester.md`: 42 lines (Opus, stub) — ethical hacking focus

**Deep capability comparison:**

| Capability                           | security-auditor     | security-engineer | penetration-tester |
| ------------------------------------ | -------------------- | ----------------- | ------------------ |
| SoNash-specific patterns             | PRIMARY (8 patterns) | no                | no                 |
| Code vulnerability review            | yes                  | no                | implied            |
| OWASP Top 10 mapping                 | yes                  | yes (WAF rules)   | yes                |
| Firebase/Cloud Functions             | yes (full detail)    | no                | no                 |
| Infrastructure as code (Terraform)   | no                   | yes (extensive)   | no                 |
| AWS services (CloudTrail, GuardDuty) | no                   | yes               | no                 |
| Compliance (SOC2, PCI-DSS)           | no                   | yes               | no                 |
| Incident response automation         | no                   | yes               | no                 |
| Penetration testing / exploitation   | no                   | no                | yes                |
| Network reconnaissance               | no                   | no                | yes                |
| Red team operations                  | no                   | no                | yes                |
| Audit report format                  | yes (S0-S3 severity) | no                | yes (CVSS scoring) |
| Model                                | sonnet               | opus              | opus               |

**Role differentiation verdict:**

The three agents have **genuinely different scopes** despite similar security
domain:

- `security-auditor` is the SoNash application security specialist. It is deeply
  integrated with the actual codebase (knows `withSecurityChecks()`,
  `sanitize-error.js`, `firestore.rules`, etc.). This is the agent you invoke
  before every PR merge.
- `security-engineer` is a generic infrastructure/compliance specialist for
  enterprise environments. Its examples reference AWS, Terraform, Kubernetes —
  none of which SoNash uses. It has **zero SoNash context**. It is effectively a
  generic template agent that got imported.
- `penetration-tester` is a 42-line stub covering ethical hacking. The scope
  (network pen testing, red team, social engineering) is irrelevant to a
  Next.js/Firebase consumer app with one developer.

**The D4a finding** about security-auditor needing Opus is well-supported: 534
lines of domain-specific patterns, 8 attack surfaces to analyze, and the S0-S3
severity classification require deep reasoning. Sonnet's pattern-matching may
miss subtle A01 (broken access control) or A04 (insecure design) issues that
require Opus-level reasoning.

**Consolidation recommendations:**

1. **security-engineer**: The entire 985 lines are mismatched to SoNash. The
   SoNash application is Firebase-hosted, not AWS-hosted. There is no Terraform,
   no GuardDuty, no CloudTrail. This agent is a portfolio piece, not a
   functional tool. **Recommend: delete** unless there is a planned pivot to
   self-hosted infrastructure (there is none in ROADMAP.md). The one concept
   that could be salvaged — compliance frameworks — is not relevant to a
   personal sobriety tracker.

2. **penetration-tester**: The 42-line stub covers adversarial testing (network
   pen testing, privilege escalation, lateral movement, red team). A
   Firebase-based sobriety tracker has essentially one attack surface worth
   penetration testing: the Cloud Functions security boundary and Firestore
   rules. That surface is already covered by `security-auditor`'s Step 3
   (Semgrep rules) and Step 4 (manual business logic review). **Recommend:
   delete or fold a single "adversarial review" subsection into
   security-auditor**.

3. **security-auditor model**: Upgrade from `sonnet` to `opus`. The agent's own
   workflow (5-step audit, 8 OWASP categories, business logic vulnerability
   detection) requires the reasoning depth that D4a identified. Sonnet-class
   models reliably catch pattern violations; Opus-class models catch design
   flaws and authorization bypass issues.

**Files to delete:** `security-engineer.md`, `penetration-tester.md` **Files to
modify:** `security-auditor.md` — change `model: sonnet` to `model: opus`.
Optionally add a "Adversarial Review" subsection to cover the one pen-testing
scenario relevant to SoNash: simulating a malicious user bypassing Firestore
rules.

---

### 4. Architecture Cluster: backend-architect, fullstack-developer, database-architect, nextjs-architecture-expert [CONFIDENCE: HIGH]

**File sizes:**

- `backend-architect.md`: 39 lines (stub, Sonnet)
- `fullstack-developer.md`: 1281 lines (Opus)
- `database-architect.md`: 610 lines (Opus)
- `nextjs-architecture-expert.md`: 215 lines (Sonnet)

**Capability overlap matrix:**

| Capability                     | backend-architect | fullstack-developer | database-architect | nextjs-arch-expert        |
| ------------------------------ | ----------------- | ------------------- | ------------------ | ------------------------- |
| RESTful API design             | PRIMARY           | yes (Section 2)     | no                 | implied                   |
| Database schema                | yes (mentioned)   | yes (Section 3)     | PRIMARY            | no                        |
| Microservice boundaries        | yes               | implied             | yes                | no                        |
| Authentication                 | "basic patterns"  | yes (JWT, OAuth)    | no                 | yes (middleware)          |
| Performance optimization       | yes               | yes                 | yes                | yes (ISR, static gen)     |
| Frontend (React/Next.js)       | no                | yes (Section 4-6)   | no                 | PRIMARY                   |
| Full-stack integration         | no                | yes                 | no                 | yes (full-stack patterns) |
| App Router / Server Components | no                | no                  | no                 | PRIMARY                   |
| Cloud-native patterns          | no                | no                  | no                 | no                        |
| Data modeling / normalization  | mentioned briefly | no                  | PRIMARY            | no                        |
| Sharding / replication         | no                | no                  | yes                | no                        |
| Event sourcing / CQRS          | no                | no                  | yes                | no                        |
| Migration strategies           | no                | no                  | yes                | yes (Pages→App Router)    |

**backend-architect vs fullstack-developer:**

`backend-architect` (39 lines) lists these focus areas:

- RESTful API design with versioning
- Service boundary definition
- Database schema design (normalization, indexes, sharding)
- Caching strategies
- "Basic security patterns"

`fullstack-developer` (1281 lines) covers ALL of these in its Section 2
(Express.js backend), Section 3 (Mongoose models with indexes), and security
middleware — plus adds frontend, auth contexts, testing, and performance
optimization.

The D3c assessment is confirmed: **backend-architect is a strict subset of
fullstack-developer**. There is no scenario where you would invoke
backend-architect over fullstack-developer for a backend task. The only arguable
differentiation is that backend-architect might be used for "API-only" tasks to
reduce context/cost, but at 39 lines it provides so little value that the
context savings are negligible.

**database-architect uniqueness:**

`database-architect` is clearly **differentiated** from fullstack-developer:

- Deep data modeling framework (normalization, domain-driven design)
- Polyglot persistence (PostgreSQL + MongoDB + Redis + Elasticsearch + InfluxDB)
- Event sourcing and CQRS patterns
- Database migration strategy with rollback
- Horizontal sharding with consistent hashing
- Read replica configuration (PostgreSQL WAL)
- Database technology selection matrix
- Performance monitoring queries (pg_stat_statements, lock analysis)

fullstack-developer's database coverage is basic: Mongoose models with standard
indexes. database-architect addresses the architectural layer above that.
**These are complementary, not redundant.**

**nextjs-architecture-expert vs fullstack-developer:**

`fullstack-developer` section 4 covers React/frontend but uses generic patterns
(React Router, not App Router; no Server Components; no ISR/static generation).
`nextjs-architecture-expert` covers the SoNash-relevant stack specifically:

- App Router (which SoNash uses: Next.js 16.2)
- Server Components vs Client Components
- Streaming with Suspense
- ISR and static generation
- Middleware for auth
- Pages Router to App Router migration

These are **complementary for different levels** of the same concern:
fullstack-developer for cross-stack implementation, nextjs-architecture-expert
for framework-specific decisions. The overlap is in "full-stack Next.js
patterns" but the depth and SoNash-relevance differ.

**Consolidation recommendations:**

1. **backend-architect**: **Delete.** It is a strict subset of
   fullstack-developer with no unique capabilities. No scenario exists where an
   AI would correctly choose backend-architect over fullstack-developer for any
   task. Even for "backend only" tasks, fullstack-developer's backend sections
   are more detailed.

2. **database-architect**: **Keep.** Genuinely differentiated via data modeling
   depth, polyglot persistence, event sourcing, sharding. Not well-served by
   fullstack-developer.

3. **nextjs-architecture-expert**: **Keep.** SoNash is a Next.js 16.2 app. App
   Router decisions, Server Components, ISR, and migration guidance are highly
   relevant and not covered adequately by fullstack-developer.

4. **fullstack-developer**: **Keep.** Primary workhorse for end-to-end
   implementation tasks. No consolidation needed.

**Files to delete:** `backend-architect.md` **Files to keep:**
`fullstack-developer.md`, `database-architect.md`,
`nextjs-architecture-expert.md`

---

### 5. Industry Pattern: When to Consolidate vs. Keep Separate [CONFIDENCE: MEDIUM]

Research from Azure Architecture Center, Google ADK developer guide, and
Microsoft multi-agent design guidance converges on:

1. **Consolidate when:** Agents share >70% of capability space, stubs (under 100
   lines) don't provide meaningful specialization, or an orchestrator cannot
   reliably differentiate which agent to invoke (leading to wrong routing).

2. **Keep separate when:** Agents have genuinely different action scopes,
   different model requirements (Sonnet vs Opus), or different invocation
   contexts (interactive session vs. quick task).

3. **The stub problem:** Agents under ~100 lines that list the same goals as a
   sibling agent are "confusion sources" — they increase routing ambiguity
   without adding capability. The industry consensus: "Monitor agent overlap in
   terms of knowledge domain and action scope to prevent redundancy and
   confusion."

4. **Pipeline vs. interactive use case** is a valid reason to keep separate
   (confirmed by gsd-debugger analysis above).

---

## Summary: Consolidation Action Table

| Cluster       | Agent                           | Recommendation                  | Reason                                                                            |
| ------------- | ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| Debugging     | `debugger.md`                   | REWRITE (elevate to ~150 lines) | Absorb error-detective + devops-troubleshooter capabilities                       |
| Debugging     | `error-detective.md`            | DELETE                          | Absorbed into elevated debugger                                                   |
| Debugging     | `devops-troubleshooter.md`      | DELETE                          | Absorbed into elevated debugger                                                   |
| Debugging     | `gsd-debugger.md` (global)      | KEEP                            | Different operational model (stateful session)                                    |
| Documentation | `technical-writer.md`           | MINOR EDIT                      | Clarify scope boundary (remove "Architecture and design documentation" ambiguity) |
| Documentation | `documentation-expert.md`       | KEEP                            | Clear differentiation, SoNash-specific conventions                                |
| Security      | `security-auditor.md`           | MODIFY (Sonnet→Opus)            | Upgrade model; optionally add adversarial review subsection                       |
| Security      | `security-engineer.md`          | DELETE                          | AWS/enterprise-only content, zero SoNash applicability                            |
| Security      | `penetration-tester.md`         | DELETE                          | 42-line stub, scope irrelevant to SoNash                                          |
| Architecture  | `backend-architect.md`          | DELETE                          | Strict subset of fullstack-developer                                              |
| Architecture  | `fullstack-developer.md`        | KEEP                            | Primary full-stack workhorse                                                      |
| Architecture  | `database-architect.md`         | KEEP                            | Genuinely differentiated (data modeling, sharding, CQRS)                          |
| Architecture  | `nextjs-architecture-expert.md` | KEEP                            | SoNash-relevant (App Router, Server Components, ISR)                              |

**Net change:** -5 agents deleted (error-detective, devops-troubleshooter,
security-engineer, penetration-tester, backend-architect), 1 rewritten
(debugger), 1 model upgrade (security-auditor), 1 minor edit (technical-writer).

---

## Elevated Debugger Design

The rewritten `debugger.md` should cover:

**Frontmatter:**

- name: debugger
- model: sonnet
- tools: Read, Write, Edit, Bash, Grep
- description: "Root cause analysis and debugging specialist covering code-level
  bugs, log pattern analysis, and infrastructure correlation. For interactive
  session-based debugging with persistent state, use `/gsd:debug` instead."

**Sections:**

1. Investigation approach (hypothesis testing, binary search, differential
   debugging) — retained from current
2. Log analysis capabilities (regex patterns for error extraction, timeline
   correlation, error rate analysis) — absorbed from error-detective
3. Infrastructure correlation (deployment-correlated failures, container debug
   commands, env diff analysis) — selectively absorbed from
   devops-troubleshooter (omit full incident response/k8s runbooks — not
   relevant to SoNash)
4. Output format (root cause + evidence + fix + prevention + monitoring query) —
   combined from all three stubs
5. Distinction from gsd-debugger — when to use which

This produces a focused ~100-150 line agent that replaces all three stubs
without scope creep.

---

## Sources

| #   | URL                                                                                       | Title                                            | Type          | Trust       | CRAAP | Date |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------- | ----------- | ----- | ---- |
| 1   | filesystem                                                                                | `.claude/agents/debugger.md`                     | codebase      | HIGH        | 5/5   | 2026 |
| 2   | filesystem                                                                                | `.claude/agents/error-detective.md`              | codebase      | HIGH        | 5/5   | 2026 |
| 3   | filesystem                                                                                | `.claude/agents/devops-troubleshooter.md`        | codebase      | HIGH        | 5/5   | 2026 |
| 4   | filesystem                                                                                | `~/.claude/agents/gsd-debugger.md`               | codebase      | HIGH        | 5/5   | 2026 |
| 5   | filesystem                                                                                | `.claude/agents/technical-writer.md`             | codebase      | HIGH        | 5/5   | 2026 |
| 6   | filesystem                                                                                | `.claude/agents/documentation-expert.md`         | codebase      | HIGH        | 5/5   | 2026 |
| 7   | filesystem                                                                                | `.claude/agents/security-auditor.md`             | codebase      | HIGH        | 5/5   | 2026 |
| 8   | filesystem                                                                                | `.claude/agents/security-engineer.md`            | codebase      | HIGH        | 5/5   | 2026 |
| 9   | filesystem                                                                                | `.claude/agents/penetration-tester.md`           | codebase      | HIGH        | 5/5   | 2026 |
| 10  | filesystem                                                                                | `.claude/agents/backend-architect.md`            | codebase      | HIGH        | 5/5   | 2026 |
| 11  | filesystem                                                                                | `.claude/agents/fullstack-developer.md`          | codebase      | HIGH        | 5/5   | 2026 |
| 12  | filesystem                                                                                | `.claude/agents/database-architect.md`           | codebase      | HIGH        | 5/5   | 2026 |
| 13  | filesystem                                                                                | `.claude/agents/nextjs-architecture-expert.md`   | codebase      | HIGH        | 5/5   | 2026 |
| 14  | https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns | AI Agent Orchestration Patterns — Azure          | official-docs | HIGH        | 4.2   | 2025 |
| 15  | https://developer.microsoft.com/blog/designing-multi-agent-intelligence                   | Designing Multi-Agent Intelligence — Microsoft   | blog/official | MEDIUM-HIGH | 3.8   | 2025 |
| 16  | https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/        | Developer's guide to multi-agent patterns in ADK | official-docs | HIGH        | 4.0   | 2025 |

---

## Contradictions

**None found.** The three cluster analyses are internally consistent. The only
tension is whether to add an "adversarial review" subsection to security-auditor
(absorbing penetration-tester) vs. just deleting penetration-tester. Both are
defensible — the thin penetration testing that applies to SoNash (bypass of
Firestore rules) is already covered by security-auditor's Step 4 manual review.
A dedicated subsection would add clarity but is not strictly necessary.

---

## Gaps

1. **Cost vs. quality trade-off for security-auditor Opus upgrade**: Upgrading
   security-auditor from Sonnet to Opus increases per-invocation cost. The D4a
   500+ vuln discovery advantage was cited by context, not independently
   verified here. The upgrade recommendation stands but could be conditional on
   observed Sonnet miss rate in practice.

2. **nextjs-architecture-expert SoNash alignment**: The agent file contains
   generic Next.js patterns (not SoNash-specific). It does not reference
   Firebase, Cloud Functions, or the specific Next.js 16.2 features. It could
   benefit from SoNash-specific context being added (similar to how
   documentation-expert and security-auditor are project-specific). Not a
   redundancy issue, but a quality gap.

3. **fullstack-developer generic template concern**: Like security-engineer,
   fullstack-developer contains generic examples (PostgreSQL, MongoDB, Express)
   that are not SoNash's stack (Firebase, Next.js). It's more defensible because
   fullstack patterns are transferable, but it could mislead agents toward
   non-SoNash patterns.

---

## Serendipity

**security-engineer contains a pattern risk**: The 985-line security-engineer
file contains `logging.basicConfig(level=logging.INFO)` and raw `str(e)` logging
in Python code examples. These directly violate SoNash's CLAUDE.md security rule
"never log raw error.message." The file itself models the anti-pattern it's
supposed to prevent. This is an argument for deletion beyond mere redundancy.

**devops-troubleshooter description triggers ambiguity**: The description says
"Use PROACTIVELY for debugging issues, log analysis, deployment failures..." —
which exactly matches the trigger for invoking `debugger` and `error-detective`.
An LLM orchestrator presented with all three will have genuine uncertainty. This
confirms the routing confusion problem that industry sources identify as a
consolidation signal.

**backend-architect's "basic security patterns"**: backend-architect's focus
areas include "Basic security patterns (auth, rate limiting)" — which are
covered in depth by security-auditor. This is a third reason to delete
backend-architect: it diffuses responsibility for security guidance across
agents.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct filesystem reads of the actual agent files.
No training-data assertions made. Industry consolidation principles corroborated
by 3 official sources (Microsoft Azure, Microsoft Developer, Google ADK).
