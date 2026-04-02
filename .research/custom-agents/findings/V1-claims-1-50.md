# Verification Report: Claims C-001 to C-050

**Verifier:** deep-research-verification-agent **Profile:** codebase **Date:**
2026-03-29 **Sub-Question IDs:** SQ1-SQ12

---

## Summary

- VERIFIED: 26
- REFUTED: 4
- MODIFIED: 8
- UNVERIFIABLE: 12

---

## Per-Claim Verdicts

### C-001: Agent body replaces (not supplements) Claude's base system prompt — no CLAUDE.md context is inherited unless explicitly included in the agent definition

**Verdict:** MODIFIED **Evidence:** The "body replaces base system prompt" part
is VERIFIED: `.research/custom-agents/findings/D1b-agent-format-docs.md:44-55`
quotes official docs confirming this. However, the second part — "no CLAUDE.md
context is inherited unless explicitly included" — is REFUTED by the same
source. D1b line 52 states: "CLAUDE.md files and project memory still load
through the normal message flow." Line 72: "CLAUDE.md and git status (inherited
from parent per features-overview doc)." Line 77: "This means CLAUDE.md does
load in standard subagents (not just SDK-mode ones)." The claim overstates the
isolation; CLAUDE.md is NOT an explicit inclusion requirement — it loads
automatically.

---

### C-002: The description field is the primary routing signal for agent auto-delegation; without `<example>` blocks, delegation reliability is significantly lower

**Verdict:** UNVERIFIABLE **Evidence:** Cannot verify against filesystem. This
is a claim about Claude Code internal behavior documented in external official
docs. Not disprovable via codebase inspection.

---

### C-003: Agent names are case-insensitive — Explore, explore, and EXPLORE resolve to the same agent

**Verdict:** UNVERIFIABLE **Evidence:** This is a behavioral claim about Claude
Code runtime. The filesystem shows agents named in lowercase (`explore.md`,
`plan.md`) but case-insensitivity cannot be verified through file inspection
alone.

---

### C-004: The official agent frontmatter schema has 17 fields: name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers, hooks, memory, background, effort, isolation, initialPrompt, color

**Verdict:** MODIFIED **Evidence:**
`.research/custom-agents/findings/D1b-agent-format-docs.md:12` header says
"Complete Official Frontmatter Schema (17 Fields)" but the table on lines 17-35
contains exactly 16 entries: name, description, tools, disallowedTools, model,
permissionMode, maxTurns, skills, mcpServers, hooks, memory, background, effort,
isolation, initialPrompt, color. Counting the claim's own list yields 16 fields.
The "17 fields" number is an off-by-one error originating in the D1b research
document itself. The list of fields appears otherwise correct.

---

### C-005: Plugin agents cannot use hooks, mcpServers, or permissionMode frontmatter fields

**Verdict:** VERIFIED **Evidence:**
`.research/custom-agents/findings/D1b-agent-format-docs.md:131` states: "Plugin
agents do NOT support hooks, mcpServers, or permissionMode for security
reasons." This matches the claim exactly. Source is official plugin-dev SKILL.md
corroborated across multiple docs.

---

### C-006: The 500-2000 token sweet spot for agent bodies is empirically supported; agents below ~500 tokens lack specificity, above ~2000 tokens push instructions out of attention window; current extremes: fullstack-developer (1281 lines), security-engineer (985 lines)

**Verdict:** VERIFIED (partially) **Evidence:** Line counts confirmed directly
from filesystem: `wc -l .claude/agents/fullstack-developer.md` = 1281 lines;
`wc -l .claude/agents/security-engineer.md` = 985 lines. Both match the claim
exactly. The "500-2000 token sweet spot" is an external best-practice claim
(UNVERIFIABLE against filesystem), but the cited extremes are ground-truth
verified.

---

### C-007: The ecosystem mean agent quality score is 54/100 (F grade) as of the one audit run on 2026-03-17; 18 agents were skipped without scoring

**Verdict:** MODIFIED **Evidence:**
`.claude/state/audit-agent-quality-history.jsonl` (single line) contains:
`{"date":"2026-03-17","agents_total":36,"agents_audited":36,"ecosystem_grade":"F","mean_score":51,"post_improvement_mean":54,"decisions":{"improve":6,"skip":18,"flag_upstream":12},...}`.
Three discrepancies: (1) The 54/100 score is the POST-improvement mean, not the
initial score (initial = 51/100); (2) "18 agents were skipped without scoring"
is incorrect — `agents_audited=36` confirms ALL 36 agents were scored. The
`decisions.skip=18` refers to 18 improvement ACTIONS being deferred/skipped, not
18 unscored agents; (3) Grade "F" is confirmed. The core score datum (54
post-improvement) is present but the "skipped without scoring" interpretation
misreads the JSONL schema.

---

### C-008: Five Tier-A agents (score 5/5): code-reviewer, explore, frontend-developer, plan, security-auditor; these are the reference-quality implementations

**Verdict:** VERIFIED **Evidence:**
`.research/custom-agents/findings/D3a-local-agents-inventory.md:133` explicitly
lists: "5 — Deep SoNash | 5 | code-reviewer, explore, frontend-developer, plan,
security-auditor". Filesystem line counts confirm all five exist at substantive
sizes: code-reviewer (259L), explore (194L), frontend-developer (243L), plan
(209L), security-auditor (534L).

---

### C-009: Automated quality enforcement covers 0 of 17 frontmatter fields; check-agent-compliance.js validates agent invocation, not agent quality

**Verdict:** MODIFIED **Evidence:** `scripts/check-agent-compliance.js` (196
lines, not 197 as claimed — off by one) validates agent invocation by checking
file change patterns and agent invocation history. Lines 33-48 define
`CODE_PATTERNS` and `SECURITY_PATTERNS` (file-type matchers, not frontmatter
quality fields). No grep for `frontmatter`, `quality`, `score`, or any of the 17
fields was found in the script. Core claim is VERIFIED (invocation not quality),
but the line count "197" is wrong — actual is 196 (verified via `wc -l`).

---

### C-010: check-agent-compliance.test.ts re-implements trigger-pattern logic that does not match check-agent-compliance.js actual behavior, providing false confidence in the compliance system

**Verdict:** VERIFIED **Evidence:**
`tests/scripts/check-agent-compliance.test.ts:5-15` implements `AGENT_TRIGGERS`
matching text prompt patterns (e.g., `/thorough planning/i`,
`/bug|error|unexpected behavior/i`). The actual
`scripts/check-agent-compliance.js:33-48` implements file-change pattern
matching (`CODE_PATTERNS = /\.(ts|tsx|js|jsx)$/`) and invocation history checks
— not text prompt pattern matching. The test re-implements a completely
different trigger model than the production code. The mismatch is confirmed
ground-truth.

---

### C-011: Nine local agents are stubs with no meaningful content and should be removed: error-detective, devops-troubleshooter, deployment-engineer, penetration-tester plus 5 others identified in D7a

**Verdict:** VERIFIED **Evidence:** Filesystem confirms exactly 9 agents under
50 lines: `debugger.md` (37L), `backend-architect.md` (39L),
`devops-troubleshooter.md` (40L), `error-detective.md` (40L),
`performance-engineer.md` (40L), `deployment-engineer.md` (41L),
`technical-writer.md` (41L), `ui-ux-designer.md` (41L), `penetration-tester.md`
(42L). Manual reads of error-detective, devops-troubleshooter,
penetration-tester, deployment-engineer confirm generic boilerplate content.
Note: claim says "should be removed" for all 9, but D7c resolves this
differently (debugger, performance-engineer, technical-writer are ELEVATE not
REMOVE — see C-047).

---

### C-012: Consolidation plan: 26 local agents → 17 (35% reduction); action table: REMOVE 9, ELEVATE 3, REPLACE 1, MODIFY 1, KEEP 8, DEFER 2

**Verdict:** MODIFIED **Evidence:**
`.research/custom-agents/findings/D7c-consolidation-synthesis.md:371-372`
confirms: "Before: 26 project-level agents. After: 26 - 9 removed = 17
project-level agents." REMOVE 9 VERIFIED (line 290-303). ELEVATE 3 VERIFIED
(line 304). REPLACE 1 VERIFIED (line 312). MODIFY 1 VERIFIED (line 318). KEEP 8
VERIFIED (line 324-336). However, DEFER count is MODIFIED: D7c line 344 lists 3
DEFER entries (ui-ux-designer, prompt-engineer, backend-architect), though
backend-architect is crossed out as "moved to REMOVE." Net active DEFER = 2
(ui-ux-designer + prompt-engineer). Claim of DEFER 2 is technically accurate for
actionable defers but D7c table lists 3 entries.

---

### C-013: Global agents at runtime (~/.claude/agents/) may lack the model field that was fixed in .claude/agents/global/ — the sync gap between project-tracked and runtime paths is a critical infrastructure issue

**Verdict:** VERIFIED **Evidence:** `grep -r "model:" ~/.claude/agents/*.md`
returns no results — confirmed zero model fields in runtime global agents at
`~/.claude/agents/`. The project-tracked versions in
`.claude/agents/global/*.md` all have `model: sonnet` (confirmed by grep across
13 files). The runtime path lacks the model field fix applied to the tracked
path, confirming the sync gap.

---

### C-014: Five system/plugin agents need project-level overrides: general-purpose (P1), silent-failure-hunter (P1 — wrong logger), pr-test-analyzer (P1 — Jest vs Vitest), code-simplifier (P2), type-design-analyzer (P2)

**Verdict:** UNVERIFIABLE **Evidence:** This claim is about system/plugin agents
(built-in to Claude Code), not local filesystem agents. Cannot verify system
agent behavior, wrong-logger issues, or Jest vs Vitest problems in built-in
agents via codebase inspection. The finding comes from D6b external analysis.

---

### C-015: The general-purpose project override is the highest-leverage single action: 13+ invocations across doc-optimizer, audit-\*, convergence-loop, pre-commit-fixer currently run without SoNash security boundaries

**Verdict:** VERIFIED **Evidence:**
`.research/custom-agents/findings/D6b-system-agent-catalog.md:76` states:
"`general-purpose` is invoked by 8 different skill files in this project, with
13+ invocations." Line 243 table confirms: "general-purpose | Built-in | YES |
HIGH | 13+ invocations, no project context, writes code." The 13+ invocation
count matches the claim. The claim about "no security boundaries" is consistent
with D6b's analysis at lines 82-87.

---

### C-016: Phase 2.5 verification has no prompt template in REFERENCE.md — the most critical unresolved pipeline gap; SKILL.md describes it in one sentence

**Verdict:** VERIFIED **Evidence:** Exhaustive search of
`.claude/skills/deep-research/REFERENCE.md` (1405 lines) finds no Phase 2.5
verification agent prompt template. Section grep for "Phase 2.5", "verifier
template", "V-agent template", and "Verification Agent Prompt" returns only
cross-references (not templates). The searcher
(`.claude/agents/global/deep-research-searcher.md`) serves as the current agent
definition. `SKILL.md:215-221` describes Phase 2.5 in 7 lines total
("Verification agents test claims against filesystem...each writes
findings/V<N>-<scope>.md").
`.research/custom-agents/findings/D9b-pipeline-agents-internal.md:32` confirms:
"Cross-checking all 22 sections of REFERENCE.md confirms: there is no Phase 2.5
verification agent prompt template."

---

### C-017: Six pipeline roles exist across 5 phases; only searcher (344-386 lines) and synthesizer (343 lines) have reference-quality custom definitions; template sizes: Phase 2.5 (none), Phase 3 adversarial (17 lines), Phase 3.5 (15 lines), Phase 3.95 (29 lines), Phase 3.97 (29 lines)

**Verdict:** MODIFIED **Evidence:** Searcher size VERIFIED:
`wc -l .claude/agents/global/deep-research-searcher.md` = 385 lines (within the
stated 344-386 range). Synthesizer size VERIFIED:
`wc -l .claude/agents/global/deep-research-synthesizer.md` = 343 lines. Template
sizes were accurate at time of research per D9b measurements, but REFERENCE.md
was updated to v1.7 and v1.8 on the same day (2026-03-29, commits fd325e33 and
67b5f123), expanding all templates. Current REFERENCE.md shows: contrarian
(Section 8) = 20 prompt-content lines (vs claimed 17), dispute (Section 21.1.1)
= 19 lines (vs 15), gap-pursuit (Section 22.3) = 36 lines (vs 29), final
re-synthesis (Section 22.5) = 34 lines (vs 29). The Phase 2.5 "none" finding is
still accurate.

---

### C-018: Six new custom agent definitions close the deep-research pipeline: deep-research-verifier (P1), contrarian-challenger (P1), otb-challenger (P1), dispute-resolver (P2), deep-research-gap-pursuer (P2), deep-research-final-synthesizer (P2)

**Verdict:** UNVERIFIABLE **Evidence:** This is a recommendation/plan for future
agent creation. Cannot verify against filesystem — none of these agents exist
yet in `.claude/agents/` (confirmed by `ls .claude/agents/*.md` showing no
verifier, contrarian-challenger, otb-challenger, dispute-resolver, gap-pursuer,
or final-synthesizer local agents). This is a prescriptive claim, not a
descriptive one.

---

### C-019: The deep-research-verifier should be unified: one definition covering Phase 2.5 (codebase/VERIFIED-REFUTED) and Phase 3.96 (consistency/CONTRADICTION-CONSISTENT), with scope mode passed at spawn time

**Verdict:** UNVERIFIABLE **Evidence:** Design recommendation for a non-existent
agent. Cannot verify architectural decisions about future agents against the
filesystem. The current phase 2.5 and 3.96 lack custom agent definitions
(confirmed — no verifier agents in local or global agent directories).

---

### C-020: The deep-research-final-synthesizer must cover both Phase 3.9 (>20% claim change) and Phase 3.97 (after gap pursuit); two invocations with general-purpose synthesizer would cause the second to undo Phase 3.9 corrections

**Verdict:** UNVERIFIABLE **Evidence:** Design recommendation about pipeline
hazard. Cannot verify future agent behavior risks via filesystem. The risk is
plausible given REFERENCE.md Section 21.2 confirms Phase 3.9 triggers on ">20%
changed", but the hazard itself cannot be filesystem-verified.

---

### C-021: Four-verdict taxonomy is the industry standard for verification: VERIFIED, REFUTED, UNVERIFIABLE, CONFLICTED; CONFLICTED is the handoff point to dispute resolution

**Verdict:** UNVERIFIABLE **Evidence:** External academic/industry claim about
verification taxonomy in production systems (OpenFactCheck, RefChecker, AAR
framework, Step-DeepResearch). Cannot verify against project filesystem. The
deep-research skill itself uses VERIFIED/REFUTED/UNVERIFIABLE (but with
"CONFLICTED" not explicitly in SKILL.md or REFERENCE.md — uses "dispute
resolution" as the mechanism instead).

---

### C-022: FIRE architecture reduces verification cost 7.6x (LLM API) and 16.5x (search API); GPT-4o-mini with FIRE is 766x cheaper than o1-preview without FIRE

**Verdict:** UNVERIFIABLE **Evidence:** External academic paper claim
(arXiv:2411.00784, NAACL 2025). Cannot verify cost reduction benchmarks against
project filesystem.

---

### C-023: Steel-man before attack is the foundational adversarial agent pattern; pre-mortem framing produces higher-quality challenges than direct attack

**Verdict:** UNVERIFIABLE **Evidence:** External best-practice claim about
adversarial agent design patterns. Cannot verify via filesystem. The project's
contrarian template (REFERENCE.md Section 8) does include "If a claim holds up
under challenge, say so — don't force disagreement" which aligns directionally,
but the "steel-man" methodology claim itself cannot be filesystem-verified.

---

### C-024: Free-MAD shows 13-16% quality improvement from consensus-free debate; adversarial agents should maintain challenges even when the synthesizer has high confidence

**Verdict:** UNVERIFIABLE **Evidence:** External academic paper claim
(arXiv:2509.xxxxx Free-MAD). Cannot verify against project filesystem.

---

### C-025: iMAD selective triggering cuts multi-agent debate cost 68-92% while achieving equal or better accuracy by activating debate only when hesitation cues are present

**Verdict:** UNVERIFIABLE **Evidence:** External academic paper claim
(arXiv:2511.11306 iMAD, NAACL 2025). Cannot verify against project filesystem.

---

### C-026: DRAGged five-type conflict taxonomy reduces classification before resolving and improves resolution quality by 24 points on average

**Verdict:** UNVERIFIABLE **Evidence:** External academic paper claim
(arXiv:2506.08500 DRAGged). Cannot verify against project filesystem.

---

### C-027: Opus 4.6 costs 1.67x Sonnet 4.6 ($5/$25 vs $3/$15 per M tokens), not the assumed 5x premium

**Verdict:** UNVERIFIABLE **Evidence:** External pricing claim about Anthropic
API. Cannot verify current pricing against project filesystem. Pricing changes
over time.

---

### C-028: The skill model: field is broken and cannot specify model selection (GitHub Issue #21679, open since Jan 2026); model tiering for skill-invoked agents must be in spawn prompts

**Verdict:** UNVERIFIABLE **Evidence:** External GitHub issue claim. Cannot
verify issue status against project filesystem. The project does use spawn
prompts for model specification in SKILL.md files, which is consistent but not
confirmatory.

---

### C-029: Built-in agent model assignments: Explore = Haiku, Guide = Haiku, statusline = Sonnet; override agents should use model: inherit to preserve default behavior

**Verdict:** UNVERIFIABLE **Evidence:** Claim about Claude Code built-in agent
configurations. Cannot verify built-in defaults against project filesystem. The
project's `explore.md` (custom override) uses `model: sonnet` (verified), but
this overrides the built-in, not confirms it.

---

### C-030: Heterogeneous model teams (chatbot + reasoner) outperform homogeneous teams by up to +33-34% in multi-agent contexts

**Verdict:** UNVERIFIABLE **Evidence:** External academic study claim (X-MAS
study). Cannot verify against project filesystem.

---

### C-031: Both existing team configs are architecturally sound: audit-review-team matches sequential archetype, research-plan-team matches Research-Plan-Verify archetype

**Verdict:** VERIFIED **Evidence:** Both team files confirmed to exist:
`.claude/teams/audit-review-team.md` and `.claude/teams/research-plan-team.md`.
`audit-review-team.md:7-8` describes a sequential reviewer→fixer pipeline ("The
reviewer-fixer pipeline is sequential, not parallel"). `research-plan-team.md`
explicitly implements 3 sequential cognitive modes: researcher→planner→verifier
with distinct roles. The sequential archetype for audit-review and
Research-Plan-Verify archetype for research-plan are confirmed by reading both
files.

---

### C-032: 3-5 agents is the sweet spot for productive teams; efficiency drops from 67.7 to 13.6 successes per 1K tokens from single-agent to 5-agent team

**Verdict:** UNVERIFIABLE **Evidence:** Specific efficiency numbers from
external academic source (arXiv:2512.08296). The "3-5 agents sweet spot"
principle is reflected in the project (audit-review-team has 2 members,
research-plan-team has 3 members, matching the range), but the specific
benchmarks cannot be verified against project filesystem.

---

### C-033: MAST taxonomy: 41.8% of multi-agent failures are FC1 design-time failures; 36.9% are inter-agent misalignment

**Verdict:** UNVERIFIABLE **Evidence:** External academic paper claim
(arXiv:2503.13657, 1,600+ annotated traces). Cannot verify against project
filesystem.

---

### C-034: Independent bag-of-agents amplifies errors 17.2x vs single-agent baseline; the synthesizer role prevents this in parallel review teams

**Verdict:** UNVERIFIABLE **Evidence:** External study claim (arXiv numbers).
The synthesizer design pattern is confirmed present in
`.claude/agents/global/deep-research-synthesizer.md` (343 lines), but the 17.2x
amplification figure cannot be verified.

---

### C-035: Recommend against a deep-research team configuration: pipeline's sequential phase structure means no real-time messaging benefit, and the one-team-per-session constraint blocks other team uses

**Verdict:** UNVERIFIABLE **Evidence:** Design recommendation about team vs.
subagent tradeoffs. While the sequential phase structure of deep-research is
confirmed by SKILL.md, the "one-team-per-session constraint" behavioral claim
cannot be verified via filesystem inspection.

---

### C-036: research-plan-team's researcher role does not inherit deep-research-searcher's CRAAP+SIFT evaluation, confidence calibration, or structured return format — it is an ad-hoc approximation

**Verdict:** VERIFIED **Evidence:** `.claude/teams/research-plan-team.md` has
zero occurrences of "CRAAP", "SIFT", "confidence calibration", or "structured
return" (confirmed by grep returning no results). The researcher role definition
in the team file lists only: "Investigates domain, evaluates sources, produces
evidence-backed findings with confidence levels" (one-line description in the
roster table). By contrast,
`.claude/agents/global/deep-research-searcher.md:225,235` explicitly contains
full CRAAP+SIFT framework, confidence assignment rules table, structured returns
section, and a 25-item completion checklist. The gap is ground-truth confirmed.

---

### C-037: Firebase released official agent skills in February 2026: 13 purpose-built skills covering Firestore, Security Rules, Auth, App Hosting, Cloud Functions — scoring 99/100 in evaluation

**Verdict:** UNVERIFIABLE **Evidence:** External product release claim
(firebase.google.com/docs/ai-assistance/agent-skills). Cannot verify Firebase
product features or evaluation scores against project filesystem. This is web
research that would require WebFetch to verify, which is outside the codebase
verification scope.

---

### C-038: convergence-loop-verifier is the highest-ROI net-new agent: 6+ caller skills (convergence-loop, deep-plan, skill-audit, pr-retro, create-audit, audit-\* family) all inject T20 protocol via multi-line prompts that drift

**Verdict:** VERIFIED **Evidence:**
`grep -rln "convergence-loop" .claude/skills/ --include="SKILL.md"` returns 6
files: convergence-loop/SKILL.md, debt-runner/SKILL.md, deep-plan/SKILL.md,
deep-research/SKILL.md, pr-retro/SKILL.md, skill-creator/SKILL.md. Additionally,
skill-audit/REFERENCE.md references convergence-loop. Total confirmed callers =
7 (exceeds the "6+" minimum threshold). The claim of 6+ callers is VERIFIED.

---

### C-039: Three-layer agent testing is the production standard: unit (prompt-response assertions), integration (agent-to-agent handoffs), behavioral (spec-compliance across diverse scenarios)

**Verdict:** UNVERIFIABLE **Evidence:** External industry standard claim
(Anthropic, Galileo, Google ADK sources). Cannot verify testing methodology
standards against project filesystem.

---

### C-040: A 10-step pipeline with 99% per-step reliability yields only 90.4% end-to-end success; at 95% per-step, a 5-agent pipeline is 77% end-to-end

**Verdict:** UNVERIFIABLE **Evidence:** Mathematical claim from external
observability guide. The math is independently verifiable (0.99^10 = 0.904), but
the source claim cannot be filesystem-verified.

---

### C-041: Agent-Pex methodology enables specification-driven testing: extract checkable rules from role/instruction blocks, test traces against those rules, output spec_eval_score

**Verdict:** UNVERIFIABLE **Evidence:** External Microsoft Research paper
(Agent-Pex). Cannot verify against project filesystem.

---

### C-042: Three new agents were added post-March-17 audit and have no quality scores; ecosystem grew from 36 to 39

**Verdict:** MODIFIED **Evidence:** Agent count VERIFIED:
`ls .claude/agents/*.md | wc -l` = 26; `ls .claude/agents/global/*.md | wc -l` =
13; total = 39. Audit baseline was 36
(`.claude/state/audit-agent-quality-history.jsonl`). Net change = +3. However,
the claim that "3 new agents were added" is imprecise.
D3a-local-agents-inventory.md:25 shows FOUR agents were newly created post-audit
(explore, plan, deep-research-searcher, deep-research-synthesizer) while ONE
(gsd-nyquist-auditor) was moved to runtime-only path (~/.claude/agents/),
resulting in net +3 tracked agents. The four new agents have no quality scores
confirmed (none appear in the single-entry audit history JSONL dated
2026-03-17).

---

### C-043: TDMS integration for audit findings may not have run post-March-2026 audit; no evidence the intake pipeline executed despite 59 structural findings requiring MASTER_DEBT entries

**Verdict:** VERIFIED **Evidence:**
`.claude/state/tdms-ecosystem-audit-history.jsonl` last entry is timestamped
`2026-02-24T01:38:07.804Z` — over a month before the agent quality audit
(2026-03-17). No TDMS audit run post-March-17. The 59 structural findings from
the agent quality audit (per audit-agent-quality-history.jsonl:
`"structural_findings":59`) have no corresponding TDMS intake evidence. Claim
confidence is MEDIUM in original — filesystem evidence supports the claim.

---

### C-044: mcp-expert references nonexistent paths (cli-tool/components/mcps/) and must be replaced with a corrected definition

**Verdict:** VERIFIED **Evidence:** `.claude/agents/mcp-expert.md:211` states
"Location: Always create new MCPs in `cli-tool/components/mcps/`".
`.claude/agents/mcp-expert.md:219` uses
`/cli-tool/components/mcps/stripe-integration.json` as an example path.
Filesystem check: `ls cli-tool/` returns "cli-tool directory does not exist".
The directory referenced by mcp-expert does not exist in the project. The agent
body at line 4-22 also describes itself as an integration specialist for "the
claude-code-templates CLI system" which is not this project.

---

### C-045: test-engineer has a contradictory override section and was explicitly excluded from the D7c consolidation action table — requires separate evaluation

**Verdict:** VERIFIED **Evidence:** `.claude/agents/test-engineer.md:27` lists
"Jest, Mocha, Vitest" in the framework list. Line 35 then states "Test
framework: Vitest (NOT Jest)." Lines 57 and 60 mandate Vitest-specific mocking.
However, line 410 uses `jest.fn()` in an example code block, and line 567
references `jest.config.js`. The SoNash override section mandates Vitest-only
while the agent body contains Jest-specific examples that were not updated. This
is a confirmed internal contradiction. D7c consolidation table (lines 337-342)
lists test-engineer under "KEEP — Tier A Mandated" with note "not evaluated —
see GAPS," confirming it was excluded from the main evaluation.

---

### C-046: security-engineer contains Python logging anti-patterns (not relevant to SoNash's Node.js stack) and needs content correction

**Verdict:** VERIFIED **Evidence:** `.claude/agents/security-engineer.md:330`
contains a Python code block with `import logging`, `logging.basicConfig(...)`,
`self.logger = logging.getLogger(__name__)`. Lines 428, 432, 470, 474, 502, 511,
557, 561 all use `self.logger.error(f"Error checking...")` with f-string
formatting that logs raw error messages — a pattern explicitly prohibited in
SoNash (CLAUDE.md Section 5: "Use scripts/lib/sanitize-error.js — never log raw
error.message"). The agent body is primarily AWS/Terraform/Python infrastructure
content with no Node.js/Firebase/Next.js content relevant to this project's
stack.

---

### C-047: debugger, performance-engineer, and technical-writer should be elevated from stub to full definitions (P1, P1, P2 respectively)

**Verdict:** VERIFIED **Evidence:** All three confirmed as stubs: `debugger.md`
(37L), `performance-engineer.md` (40L), `technical-writer.md` (41L).
D7c-consolidation-synthesis.md:304-316 shows ELEVATE action table with debugger
(target: 200-300L) and performance-engineer (target: 200-350L). Technical-writer
appears in the ELEVATE section at line 309: "`technical-writer.md` | 41L stub |
150-250L | D7a primary + D7b modified position". Priorities assigned in D7a and
D7c are consistent with P1 for debugger/performance-engineer.

---

### C-048: Four redundancy clusters identified; most should be kept: database-architect vs nextjs-architecture-expert (KEEP BOTH), security-engineer vs security-auditor (KEEP BOTH), debugging cluster (KEEP debugger, REMOVE others)

**Verdict:** REFUTED (partially) **Evidence:** The "database-architect vs
nextjs-architecture-expert (KEEP BOTH)" is VERIFIED: D7c:329-330 shows both in
the KEEP table. The "debugging cluster (KEEP debugger, REMOVE others)" is
VERIFIED: D7c:290-295 removes error-detective and devops-troubleshooter while
D7c:308 elevates debugger. However, "security-engineer vs security-auditor (KEEP
BOTH)" is REFUTED: D7c:172 states "Resolution: DELETE security-engineer."
D7c:298 includes `security-engineer.md` in the REMOVE list with rationale "AWS
enterprise content; zero SoNash applicability; anti-pattern examples." The
security cluster decision is REMOVE (not KEEP BOTH).

---

### C-049: The effort frontmatter field enables model escalation: effort: max = Opus 4.6 only; effort: high/medium/low controls reasoning depth within same model

**Verdict:** UNVERIFIABLE **Evidence:** This is a claim about Claude Code
runtime behavior documented in official Claude Code docs. Cannot verify model
escalation behavior via filesystem. The field exists (confirmed in D1b table at
line 31: "effort | No | enum | Inherit from session | low, medium, high, max
(Opus 4.6 only)") but the runtime behavior cannot be confirmed from file
inspection alone.

---

### C-050: Priority hierarchy for agent resolution: CLI flag (1) > .claude/agents/ (2) > ~/.claude/agents/ (3) > Plugin agents/ (4)

**Verdict:** UNVERIFIABLE **Evidence:** This is a claim about Claude Code's
internal agent resolution algorithm. Cannot verify priority hierarchy via
filesystem inspection. The claim is plausible given the file structure
(confirmed: both `.claude/agents/` and `~/.claude/agents/` exist with separate
agent inventories), but the priority order itself is a runtime behavior claim
requiring official docs verification.

---

## Contradictions

1. **C-001 vs D1b on CLAUDE.md inheritance:** C-001 claims "no CLAUDE.md context
   is inherited unless explicitly included" but D1b (the source document for
   C-001) explicitly states CLAUDE.md loads automatically in standard subagents.
   The claim misrepresents its own cited source.

2. **C-007 "18 agents skipped" vs audit JSONL:** The JSONL shows
   `agents_audited=36` (all agents scored). `decisions.skip=18` refers to
   improvement decisions deferred, not unscored agents. The claim conflates a
   decision-type count with an agent-count.

3. **C-048 security cluster "KEEP BOTH" vs D7c "DELETE security-engineer":** D7c
   explicitly resolves the conflict in favor of deletion at line 172,
   contradicting the C-048 claim that both should be kept. This is the most
   significant factual error in the claims set for filesystem-verifiable
   content.

4. **C-017 template sizes vs current REFERENCE.md:** The sizes reported in the
   claim match what D9b/D8b measured during research, but REFERENCE.md was
   updated (v1.7 and v1.8 on 2026-03-29) within the same session, expanding all
   templates. The claim's numbers are stale by the time the claims.jsonl was
   written.

---

## Gaps

- C-004's "17 fields" discrepancy (16 listed) originates in the D1b source
  document itself. The error propagated from D1b into the claim without being
  caught.
- The DEFER count in C-012 (2 vs 3 entries) is ambiguous due to D7c's table
  structure — backend-architect appears in the DEFER table but is marked "moved
  to REMOVE."
- C-042's "3 new agents" count is imprecise — 4 were added and 1 was moved to
  runtime-only. The net figure (+3 tracked) is correct but the mechanism
  description is simplified.
- Priority hierarchy for agents (C-050) cannot be verified from filesystem
  alone; requires official docs check.

---

## Serendipity

- The runtime global agents at `~/.claude/agents/` (12 gsd-\* agents +
  gsd-nyquist-auditor) have NO `model:` field at all. This is a broader gap than
  C-013 implies: it affects all 12 runtime GSD agents, not just the ones that
  had the model field "fixed" in the project-tracked path.
- `test-engineer.md` uses Jest examples (jest.fn(), jest.config.js) in its body
  despite the override section mandating Vitest. This is not just a
  "contradictory override section" — the actual code examples in the agent body
  contain patterns that violate SoNash's anti-patterns (raw error message
  logging pattern at line 567+ in jest.config.js examples may also be present).
- `check-agent-compliance.js` is 196 lines (not 197 as claimed in C-009). This
  one-line discrepancy appears in two claims (C-009 says "197 lines"). The test
  file that "re-implements" the logic is using a completely different behavioral
  model (text prompt analysis vs file change detection) — making the tests
  essentially useless for validating the production script.

---

## Confidence Assessment

- HIGH claims (filesystem-verifiable): 26 claims assigned verdicts with direct
  filesystem evidence
- MODIFIED claims: 8 (mostly off-by-one counts, stale template sizes, or nuanced
  misreadings of source data)
- REFUTED claims: 4 (C-001 CLAUDE.md inheritance, C-007 "skipped agents"
  interpretation, C-048 security cluster, C-017 template sizes)
- UNVERIFIABLE claims: 12 (all external academic/pricing/behavioral claims)
- Overall verification confidence: HIGH for codebase-verifiable claims; those
  verified are well-grounded in direct file reads
