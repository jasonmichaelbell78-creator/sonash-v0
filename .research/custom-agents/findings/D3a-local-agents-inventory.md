# Findings: Ground-Truth State of 24 LOCAL Project Agents in `.claude/agents/`

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ3-Part-A

---

## Summary Statistics

- **Total local agents (non-global):** 26 files
- **Prior inventory claimed:** 36 agents total (13 GSD agents now confirmed
  moved to `global/`)
- **New agents since last audit:** 2 (`explore.md`, `plan.md`)
- **Agents improved (P4.1, 2026-03-24):** 6 (`code-reviewer`,
  `dependency-manager`, `documentation-expert`, `frontend-developer`,
  `security-auditor`, `test-engineer`)
- **Agents frozen since 2026-01-12:** 16 (all others except
  `markdown-syntax-formatter`, `explore`, `plan`)
- **Sources read:** 26 agent files + AGENT_INVENTORY.md + CLAUDE.md +
  AGENT_ORCHESTRATION.md

---

## Key Findings

### 1. GSD Agents Relocated to `global/` Directory [CONFIDENCE: HIGH]

The prior inventory (Session #227) counted 36 agents with 13 GSD agents in
`.claude/agents/`. Current state: 13 GSD agents (`gsd-*`) plus 2 deep-research
agents (`deep-research-searcher`, `deep-research-synthesizer`) now live in
`.claude/agents/global/`. The local directory contains 26 agents. This is an
architectural migration, not deletion. The prior audit's "36 total" vs current
"26 local + 13 global" = 39 total, meaning 3 agents were added net (explore,
plan, deep-research-searcher, deep-research-synthesizer = 4 added,
gsd-nyquist-auditor presumably moved, net +3).

### 2. Six Agents Substantially Improved in Session #236 (P4.1) [CONFIDENCE: HIGH]

Commit `024ae700` (2026-03-24) "feat: agent-env P4.1 — improve 6 agents + model
field for all 13 global agents" upgraded the following local agents from
stub/light to substantially higher quality:

- `code-reviewer`: 37 lines (stub) → 259 lines (detailed). Now fully
  SoNash-specific with 10 named patterns, structured output format,
  CRITICAL/WARNING/SUGGESTION tiers, return protocol.
- `security-auditor`: 40 lines (stub) → 534 lines (comprehensive). Full OWASP
  mapping to SoNash patterns, 8 audit patterns with code examples, step-by-step
  audit workflow.
- `frontend-developer`: 39 lines (stub) → 243 lines (detailed). SoNash-specific
  stack versions, component patterns, Cloud Functions security boundary, Framer
  Motion patterns, return protocol.
- `documentation-expert`: 66 lines (light) → 119 lines (basic). SoNash project
  scope, doc header conventions, quality checklist, return protocol. Tools field
  also fixed.
- `dependency-manager`: 65 lines (light, no tools) → 114 lines (basic). Tools
  field added (Read, Bash, Grep). SoNash Firebase package alignment constraint,
  knip integration, return protocol.
- `test-engineer`: 990 lines (heavy, but generic) → 1051 lines (heavy). Vitest
  override section added with SoNash-specific mocking patterns; the bulk of
  content remains generic template code.

### 3. Two New Agents Added in P4.2-4.3 (2026-03-24) [CONFIDENCE: HIGH]

Commit `db1be621` added `explore.md` (194 lines) and `plan.md` (209 lines). Both
are:

- Fully SoNash-specific (reference exact file paths, stack versions, security
  patterns)
- READ-ONLY constrained (disallowedTools: Agent, Write, Edit)
- maxTurns: 25
- Structured return protocols with exact output formats
- Explicitly referenced in CLAUDE.md Section 7 as "Explore agent" and "Plan
  agent" pre-task triggers

These are the highest-quality new additions to the local ecosystem.

### 4. Sixteen Agents Frozen Since 2026-01-12 [CONFIDENCE: HIGH]

All of the following have not been updated since the 2026-01-12 commit "fix:
address Review #135 PR feedback":

`backend-architect`, `database-architect`, `debugger`, `deployment-engineer`,
`devops-troubleshooter`, `error-detective`, `fullstack-developer`,
`git-flow-manager`, `mcp-expert`, `nextjs-architecture-expert`,
`penetration-tester`, `performance-engineer`, `prompt-engineer`,
`react-performance-optimization`, `security-engineer`, `technical-writer`,
`ui-ux-designer`

Most of these are generic templates with minimal SoNash specificity.

### 5. Three Stub Agents Still Exist (No Improvement Since 2026-01-12) [CONFIDENCE: HIGH]

- `backend-architect` (39 lines): Generic API design. Zero SoNash references. No
  return protocol.
- `debugger` (37 lines): Generic 5-step debugger. No SoNash patterns. No return
  protocol.
- `deployment-engineer` (41 lines): Generic Docker/K8s. No SoNash deployment
  context (Firebase hosting, GitHub Actions). No return protocol.

The prior audit's 11-stub claim partially applies. Several former stubs were
upgraded, but the debugging group remains stubs.

### 6. mcp-expert Contains Wrong Project References [CONFIDENCE: HIGH]

`mcp-expert.md` (272 lines, frozen 2026-01-12) describes workflows for a
"cli-tool components system" and creates MCPs in `cli-tool/components/mcps/`.
This path does not exist in SoNash. The agent appears to have been copied from
another project without adaptation. It is substantially misaligned with SoNash's
MCP usage (context7, memory, sonarcloud as consumers, not producers of MCPs).

### 7. test-engineer Contains Contradictory Override Pattern [CONFIDENCE: HIGH]

`test-engineer.md` (1051 lines) has a "SoNash Overrides" section (lines 35-59)
explicitly warning that "The generic examples below predate SoNash patterns" —
yet the next 900+ lines contain Jest-based code examples using `execSync`,
`console.error("...", error.message)`, and other patterns that violate SoNash
rules. The overrides are declared but the body is not updated to match. This
creates a self-contradicting agent: it warns about violations and then
demonstrates them.

### 8. redundancy-detective Pattern: debugger / error-detective / devops-troubleshooter Still Unresolved [CONFIDENCE: HIGH]

All three stubs cover root-cause analysis. From the prior audit this was flagged
as "80%+ overlap" and recommended for consolidation. No change observed since
Session #227. All three remain at 37-40 lines, frozen since 2026-01-12.

---

## Per-Agent Assessment Table

| Agent                          | Lines | Tier          | Model  | Last Updated | SoNash Score (0-5) | Status             | Key Issues                                               |
| ------------------------------ | ----- | ------------- | ------ | ------------ | ------------------ | ------------------ | -------------------------------------------------------- |
| backend-architect              | 39    | Stub          | sonnet | 2026-01-12   | 0                  | Frozen             | Generic, no SoNash refs, no return protocol              |
| code-reviewer                  | 259   | Detailed      | sonnet | 2026-03-24   | 5                  | Improved P4.1      | None — excellent                                         |
| database-architect             | 610   | Comprehensive | opus   | 2026-01-12   | 0                  | Frozen             | Generic SQL templates, no Firestore context              |
| debugger                       | 37    | Stub          | sonnet | 2026-01-12   | 0                  | Frozen             | Generic, no SoNash, overlap w/ error-detective           |
| dependency-manager             | 114   | Basic         | sonnet | 2026-03-24   | 3                  | Improved P4.1      | Tools fixed, SoNash Firebase section added               |
| deployment-engineer            | 41    | Stub          | sonnet | 2026-01-12   | 0                  | Frozen             | Generic Docker/K8s, not Firebase hosting                 |
| devops-troubleshooter          | 40    | Stub          | sonnet | 2026-01-12   | 0                  | Frozen             | Overlaps debugger + error-detective                      |
| documentation-expert           | 119   | Basic         | sonnet | 2026-03-24   | 4                  | Improved P4.1      | SoNash-scoped, conventions correct                       |
| error-detective                | 40    | Stub          | sonnet | 2026-01-12   | 0                  | Frozen             | Overlaps debugger + devops-troubleshooter                |
| explore                        | 194   | Detailed      | sonnet | 2026-03-24   | 5                  | NEW P4.2           | Excellent — full SoNash arch, READ-ONLY                  |
| frontend-developer             | 243   | Detailed      | sonnet | 2026-03-24   | 5                  | Improved P4.1      | Strong SoNash-specific, return protocol                  |
| fullstack-developer            | 1281  | Comprehensive | opus   | 2026-01-12   | 0                  | Frozen             | Generic stack (Redux, Express, PostgreSQL), not Firebase |
| git-flow-manager               | 371   | Detailed      | sonnet | 2026-01-12   | 1                  | Frozen             | Generic GitFlow, minor SoNash commit format              |
| markdown-syntax-formatter      | 75    | Basic         | sonnet | 2026-03-19   | 0                  | Minor update       | Purely generic markdown formatting                       |
| mcp-expert                     | 272   | Detailed      | sonnet | 2026-01-12   | 0                  | Frozen             | WRONG project refs (`cli-tool/components/mcps/`)         |
| nextjs-architecture-expert     | 215   | Detailed      | sonnet | 2026-01-12   | 1                  | Frozen             | Generic Next.js patterns, not SoNash-specific            |
| penetration-tester             | 42    | Stub          | opus   | 2026-01-12   | 0                  | Frozen             | Generic pentesting                                       |
| performance-engineer           | 40    | Stub          | opus   | 2026-01-12   | 0                  | Frozen             | Generic profiling, no SoNash context                     |
| plan                           | 209   | Detailed      | sonnet | 2026-03-24   | 5                  | NEW P4.3           | Excellent — SoNash constraints, READ-ONLY                |
| prompt-engineer                | 121   | Basic         | opus   | 2026-01-12   | 0                  | Frozen             | Generic prompt engineering                               |
| react-performance-optimization | 76    | Basic         | sonnet | 2026-01-12   | 1                  | Frozen             | React patterns only, no SoNash stack specifics           |
| security-auditor               | 534   | Comprehensive | sonnet | 2026-03-24   | 5                  | Improved P4.1      | Excellent — full SoNash security patterns                |
| security-engineer              | 985   | Comprehensive | opus   | 2026-01-12   | 0                  | Frozen             | Generic Terraform/AWS infra, not Firebase                |
| technical-writer               | 41    | Stub          | sonnet | 2026-01-12   | 0                  | Frozen             | Generic, overlaps documentation-expert                   |
| test-engineer                  | 1051  | Comprehensive | opus   | 2026-03-24   | 2                  | Partially improved | SoNash override added but body contradicts it            |
| ui-ux-designer                 | 41    | Stub          | sonnet | 2026-01-12   | 0                  | Frozen             | Generic UX, no SoNash design tokens                      |

**SoNash Score Key:** 0 = no SoNash references; 1 = generic Next.js/React only;
2 = partial SoNash refs; 3 = some SoNash specifics; 4 = SoNash-scoped with
conventions; 5 = deep SoNash integration (specific files, patterns, return
protocols)

---

## Quality Distribution

| Tier          | Definition    | Count | Agents                                                                                                                                                                                    |
| ------------- | ------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stub          | <50 lines     | 8     | backend-architect, debugger, deployment-engineer, devops-troubleshooter, error-detective, penetration-tester, performance-engineer, technical-writer, ui-ux-designer (9 total — ui-ux=41) |
| Basic         | 50-150 lines  | 4     | dependency-manager (114), documentation-expert (119), markdown-syntax-formatter (75), prompt-engineer (121)                                                                               |
| Detailed      | 150-400 lines | 7     | code-reviewer (259), explore (194), frontend-developer (243), git-flow-manager (371), mcp-expert (272), nextjs-architecture-expert (215), plan (209), react-performance-optimization (76) |
| Comprehensive | 400+ lines    | 7     | database-architect (610), fullstack-developer (1281), security-auditor (534), security-engineer (985), test-engineer (1051)                                                               |

Note: Tier assignments by line count do not correlate with quality.
`database-architect` (610 lines, comprehensive) scores 0 on SoNash specificity;
`code-reviewer` (259 lines, detailed) scores 5.

**Stub count corrected from prior audit:** Prior inventory claimed 11 stubs.
Current count is 9 true stubs (<50 lines). `deployment-engineer` (41 lines) and
`ui-ux-designer` (41 lines) are stubs. The prior stub list included agents that
have since been upgraded (code-reviewer, security-auditor, frontend-developer).

---

## SoNash Specificity Distribution

| Score               | Count | Agents                                                                       |
| ------------------- | ----- | ---------------------------------------------------------------------------- |
| 5 — Deep SoNash     | 5     | code-reviewer, explore, frontend-developer, plan, security-auditor           |
| 4 — SoNash-scoped   | 1     | documentation-expert                                                         |
| 3 — Partial SoNash  | 1     | dependency-manager                                                           |
| 2 — Minimal SoNash  | 1     | test-engineer                                                                |
| 1 — Generic Next.js | 3     | git-flow-manager, nextjs-architecture-expert, react-performance-optimization |
| 0 — No SoNash refs  | 15    | All others                                                                   |

---

## Redundancy Clusters

### Cluster 1: Debugging Group (3 stubs, 80%+ overlap — UNRESOLVED since Session #227)

- `debugger` (37 lines): source code / stack trace analysis
- `error-detective` (40 lines): log parsing / error pattern detection
- `devops-troubleshooter` (40 lines): infrastructure / deployment failures

All three cover root-cause analysis with nearly identical output sections. The
prior recommendation to consolidate or clarify scope boundaries has not been
acted upon.

### Cluster 2: Documentation Group (partially resolved)

- `documentation-expert` (119 lines, improved): SoNash system docs, agent docs,
  API docs — now explicitly scoped
- `technical-writer` (41 lines, stub, frozen): generic user guides/tutorials

The documentation-expert improvement (P4.1) added explicit scope boundary
language distinguishing between the two agents. However, `technical-writer`
remains a stub with no improvement.

### Cluster 3: Security Overlap

- `security-auditor` (534 lines, improved): Application-level security,
  SoNash-specific patterns — excellent quality
- `security-engineer` (985 lines, frozen): Generic infrastructure security
  (Terraform, AWS, SOC2/PCI-DSS) — no Firebase/SoNash context

These don't truly overlap — one is app security (relevant) and one is infra
security (not relevant to SoNash's Firebase-hosted architecture). However,
`security-engineer` is essentially dead weight for this project.

### Cluster 4: fullstack-developer vs frontend-developer vs database-architect

- `frontend-developer` (243 lines, SoNash-specific): Excellent, strongly
  integrated
- `fullstack-developer` (1281 lines, generic): Generic React/Express/PostgreSQL
  — describes a completely different stack
- `database-architect` (610 lines, generic): Generic SQL schemas — Firestore is
  document-based NoSQL

`fullstack-developer` and `database-architect` are misaligned with SoNash's
Firebase architecture and represent bloat risk.

---

## Delta from Prior Audit (Session #236 / AGENT_INVENTORY.md)

| Change                                                        | Details                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| GSD agents relocated                                          | 13 GSD + 2 deep-research agents moved to `global/` subdirectory       |
| Agents added                                                  | `explore` (NEW, comprehensive SoNash-specific)                        |
| Agents added                                                  | `plan` (NEW, comprehensive SoNash-specific)                           |
| Agent improved: code-reviewer                                 | 37 → 259 lines; stub → detailed; SoNash score 0 → 5                   |
| Agent improved: security-auditor                              | 40 → 534 lines; stub → comprehensive; SoNash score 0 → 5              |
| Agent improved: frontend-developer                            | 39 → 243 lines; stub → detailed; SoNash score 0 → 5                   |
| Agent improved: documentation-expert                          | 66 → 119 lines; light → basic; SoNash score 1 → 4; tools field fixed  |
| Agent improved: dependency-manager                            | 65 → 114 lines; tools field fixed; SoNash section added               |
| Agent improved: test-engineer                                 | 990 → 1051 lines; SoNash override section added                       |
| Prior issue RESOLVED: documentation-expert missing tools      | Now has `tools: Read, Write, Edit, Grep`                              |
| Prior issue RESOLVED: dependency-manager missing tools        | Now has `tools: Read, Bash, Grep`                                     |
| Prior issue UNRESOLVED: debugging group redundancy            | debugger/error-detective/devops-troubleshooter remain unchanged stubs |
| Prior issue UNRESOLVED: gsd-nyquist-auditor YAML tools format | Agent moved to global/ — check global/ audit                          |
| NEW ISSUE DISCOVERED: mcp-expert wrong project context        | References non-existent `cli-tool/components/mcps/` directory         |
| NEW ISSUE DISCOVERED: test-engineer self-contradicting        | Override section warns about patterns the body still uses             |

---

## Sources

| #   | Path                                                      | Type           | Trust | Date       |
| --- | --------------------------------------------------------- | -------------- | ----- | ---------- |
| 1   | `.claude/agents/backend-architect.md`                     | codebase-file  | HIGH  | 2026-01-12 |
| 2   | `.claude/agents/code-reviewer.md`                         | codebase-file  | HIGH  | 2026-03-24 |
| 3   | `.claude/agents/database-architect.md`                    | codebase-file  | HIGH  | 2026-01-12 |
| 4   | `.claude/agents/debugger.md`                              | codebase-file  | HIGH  | 2026-01-12 |
| 5   | `.claude/agents/dependency-manager.md`                    | codebase-file  | HIGH  | 2026-03-24 |
| 6   | `.claude/agents/deployment-engineer.md`                   | codebase-file  | HIGH  | 2026-01-12 |
| 7   | `.claude/agents/devops-troubleshooter.md`                 | codebase-file  | HIGH  | 2026-01-12 |
| 8   | `.claude/agents/documentation-expert.md`                  | codebase-file  | HIGH  | 2026-03-24 |
| 9   | `.claude/agents/error-detective.md`                       | codebase-file  | HIGH  | 2026-01-12 |
| 10  | `.claude/agents/explore.md`                               | codebase-file  | HIGH  | 2026-03-24 |
| 11  | `.claude/agents/frontend-developer.md`                    | codebase-file  | HIGH  | 2026-03-24 |
| 12  | `.claude/agents/fullstack-developer.md`                   | codebase-file  | HIGH  | 2026-01-12 |
| 13  | `.claude/agents/git-flow-manager.md`                      | codebase-file  | HIGH  | 2026-01-12 |
| 14  | `.claude/agents/markdown-syntax-formatter.md`             | codebase-file  | HIGH  | 2026-03-19 |
| 15  | `.claude/agents/mcp-expert.md`                            | codebase-file  | HIGH  | 2026-01-12 |
| 16  | `.claude/agents/nextjs-architecture-expert.md`            | codebase-file  | HIGH  | 2026-01-12 |
| 17  | `.claude/agents/penetration-tester.md`                    | codebase-file  | HIGH  | 2026-01-12 |
| 18  | `.claude/agents/performance-engineer.md`                  | codebase-file  | HIGH  | 2026-01-12 |
| 19  | `.claude/agents/plan.md`                                  | codebase-file  | HIGH  | 2026-03-24 |
| 20  | `.claude/agents/prompt-engineer.md`                       | codebase-file  | HIGH  | 2026-01-12 |
| 21  | `.claude/agents/react-performance-optimization.md`        | codebase-file  | HIGH  | 2026-01-12 |
| 22  | `.claude/agents/security-auditor.md`                      | codebase-file  | HIGH  | 2026-03-24 |
| 23  | `.claude/agents/security-engineer.md`                     | codebase-file  | HIGH  | 2026-01-12 |
| 24  | `.claude/agents/technical-writer.md`                      | codebase-file  | HIGH  | 2026-01-12 |
| 25  | `.claude/agents/test-engineer.md`                         | codebase-file  | HIGH  | 2026-03-24 |
| 26  | `.claude/agents/ui-ux-designer.md`                        | codebase-file  | HIGH  | 2026-01-12 |
| 27  | `.planning/agent-environment-analysis/AGENT_INVENTORY.md` | internal-doc   | HIGH  | 2026-03-17 |
| 28  | `CLAUDE.md`                                               | project-config | HIGH  | 2026-03-24 |
| 29  | `docs/agent_docs/AGENT_ORCHESTRATION.md`                  | internal-doc   | HIGH  | (current)  |

---

## Contradictions

**Contradiction 1: Prior audit stub count vs. current state** Prior inventory:
"11 stubs." Current state: 9 stubs (several were improved in P4.1). The prior
inventory correctly identified these agents as needing improvement; the
improvement happened but the inventory was not updated to reflect it.

**Contradiction 2: test-engineer override section vs. body content** The "SoNash
Overrides" section at lines 35-59 explicitly states "The generic examples below
predate SoNash patterns" and warns developers to use `sanitizeError()` and
Vitest imports. Lines 101-963 contain Jest-based code with
`console.error("...", error.message)` — the exact anti-pattern warned against.
Both are present in the same file.

**Contradiction 3: mcp-expert `cli-tool/components/mcps/` path vs. actual
project structure** The agent instructs creating files at
`cli-tool/components/mcps/` and running
`npx claude-code-templates@latest --mcp=...`. Neither this directory nor this
command exists in SoNash. This is not a conflict between sources — it's a
factual error in the agent's content.

---

## Gaps

- **Usage frequency:** No invocation log for agents (confirmed by prior audit).
  Cannot determine which agents are actually invoked in practice.
- **Global agents not assessed:** `global/` directory contains 13 GSD + 2
  deep-research agents — these are out of scope for SQ3-Part-A.
- **fullstack-developer body not fully read:** Read first 80 lines only. The
  full 1281-line content follows the same generic pattern observed in those
  lines. Confidence is HIGH that it is generic, but a full read was not
  performed.
- **database-architect body not fully read:** Read first 80 lines. Same caveat
  applies.
- **security-engineer body not fully read:** Read first 80 lines. Same caveat.

---

## Serendipity

**mcp-expert misalignment is a deployment risk:** If the `mcp-expert` agent is
invoked in a SoNash context, it will attempt to create files in
`cli-tool/components/mcps/` which doesn't exist. The agent appears to be a
copied template from a separate project. This is more severe than "outdated" —
it will produce wrong artifacts if used.

**The P4.1/P4.2 investment created a tiered quality split:** The 6 improved
agents now form a clearly superior quality tier (score 4-5) while the 16 frozen
agents remain at score 0-1. This creates a predictable maintenance pattern:
future improvement cycles should target the frozen tier systematically.

**`explore` and `plan` are architectural additions, not quality fixes:** Unlike
P4.1 which improved existing agents, P4.2-4.3 added two new READ-ONLY specialist
agents that fill a gap (codebase investigation and planning without execution).
CLAUDE.md Section 7 now explicitly triggers both, meaning they are integrated
into the workflow. This represents a structural capability improvement.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are based on direct filesystem reads of agent files, git log
timestamps, and grep searches through referenced documentation. No claims rely
on training data or documentation alone.
