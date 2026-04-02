# W4a: Internal Gap Synthesis

<!-- prettier-ignore-start -->
**Wave:** 4a (Internal Synthesis)
**Synthesizer:** Claude Opus 4.6 (1M context)
**Date:** 2026-03-24
**Source Findings:** SQ1, SQ2, SQ3, SQ4, SQ5, SQ6, SQ10
**Status:** COMPLETE
**Confidence methodology:** HIGH = convergent evidence from 3+ source findings; MEDIUM = evidence from 2 source findings or strong inference from 1; LOW = single-source inference or extrapolation.
<!-- prettier-ignore-end -->

---

## 1. Capability Map: What Research/Discovery Capabilities Exist Today

### Tier 1: Quick Lookup (minutes, single source, minimal orchestration)

| Capability                       | Tool/System                                            | Source |
| -------------------------------- | ------------------------------------------------------ | ------ |
| Codebase file search             | Grep (content), Glob (paths, mod-time sorted)          | SQ5    |
| File reading and analysis        | Read tool (text, PDF, images, notebooks)               | SQ5    |
| Library documentation lookup     | Context7 MCP (resolve-library-id + query-docs)         | SQ5    |
| Past conversation search         | Episodic Memory MCP (semantic search + date filtering) | SQ5    |
| Past review/decision search      | Memory server MCP (entity/relation graph)              | SQ5    |
| Git history analysis             | git log, git blame, git diff, git show (via Bash)      | SQ5    |
| SonarCloud code quality snapshot | SonarCloud MCP (get_issues, get_quality_gate)          | SQ5    |
| Health metric spot check         | Individual health checkers via npm run (11 checkers)   | SQ5    |
| Explore agent dispatch           | explore agent (read-only, 25-turn max, sonnet)         | SQ3    |
| Pattern compliance check         | `npm run patterns:check` (script)                      | SQ5    |
| Documentation health check       | `npm run docs:check` (script)                          | SQ5    |

### Tier 2: Focused Investigation (30-60 minutes, multiple sources, some orchestration)

| Capability                          | Tool/System                                                   | Source   |
| ----------------------------------- | ------------------------------------------------------------- | -------- |
| Structured codebase exploration     | Explore agent with return protocol                            | SQ3      |
| Implementation planning             | Plan agent (read-only, 25-turn max)                           | SQ3      |
| Scientific method debugging         | /systematic-debugging skill (5-phase)                         | SQ2      |
| Code quality investigation          | code-reviewer agent (anti-pattern scan + checklist)           | SQ2, SQ3 |
| Security posture assessment         | security-auditor agent (SoNash-customized)                    | SQ3      |
| Single-domain ecosystem audit       | 4 ecosystem audit skills (hook, session, doc, health)         | SQ2      |
| Health scoring and triage           | /alerts skill (18 or 42 categories) + /ecosystem-health skill | SQ2      |
| Convergence-loop verification       | /convergence-loop skill (2-8 agents, composable behaviors)    | SQ1, SQ2 |
| Web research (single topic)         | WebSearch + WebFetch tools                                    | SQ5      |
| GSD phase research                  | gsd-phase-researcher agent + gsd-plan-checker                 | SQ3      |
| Deep-plan Phase 0 context gathering | DIAGNOSIS.md production with 7 quality gates                  | SQ1      |

### Tier 3: Full Research Campaign (2+ hours, structured multi-agent, formal output)

| Capability                       | Tool/System                                                     | Source   |
| -------------------------------- | --------------------------------------------------------------- | -------- |
| Multi-agent domain research      | /deep-research skill (5-17+ agents, 5 phases, 14 quality gates) | SQ1, SQ5 |
| Structured multi-phase planning  | /deep-plan skill (6 phases, CL-integrated)                      | SQ1      |
| Plan execution verification      | CL-PROTOCOL (D1-D4/V1-V4, opus-mandated, 12 quality gates)      | SQ1      |
| Multi-domain ecosystem audit     | /comprehensive-ecosystem-audit (9 agents, 4 stages)             | SQ2      |
| GSD project research             | /gsd:new-project (4 parallel researchers + synthesizer)         | SQ3      |
| Research-claims convergence loop | convergence-loop research-claims preset (6 behaviors)           | SQ1      |
| Cross-model verification         | Gemini CLI integration in deep-research Phase 3                 | SQ1      |

### Tier 4: Campaign Orchestration (multi-session, team-scale)

| Capability                     | Tool/System                                                                    | Source   |
| ------------------------------ | ------------------------------------------------------------------------------ | -------- |
| Research-to-plan pipeline team | research-plan-team (3 members: researcher + planner + verifier)                | SQ4      |
| Multi-target audit team        | audit-review-team (2 members: reviewer + fixer)                                | SQ4      |
| Batch skill auditing           | /skill-audit with audit-review-team for 3+ targets                             | SQ2, SQ4 |
| GSD full project lifecycle     | /gsd:new-project -> /gsd:plan-phase -> /gsd:execute-phase -> /gsd:verify-phase | SQ3      |

### Cross-Cutting Infrastructure

| Capability                    | Tool/System                                                                      | Source   |
| ----------------------------- | -------------------------------------------------------------------------------- | -------- |
| Research artifact persistence | .research/ directories with findings, claims.jsonl, sources.jsonl, metadata.json | SQ1      |
| Cross-session research index  | .research/research-index.jsonl (staleness, overlap detection)                    | SQ1      |
| Source reputation tracking    | .research/source-reputation.jsonl (cross-session)                                | SQ1      |
| Strategy logging              | .research/strategy-log.jsonl (allocation decisions)                              | SQ1      |
| Agent invocation tracking     | .claude/state/agent-invocations.jsonl + track-agent-invocation.js hook           | SQ3, SQ6 |
| Session state persistence     | .claude/state/ files per skill (compaction-resilient)                            | SQ1, SQ2 |
| Hook-based trigger detection  | user-prompt-handler.js (6 priority tiers)                                        | SQ6      |
| CLAUDE.md behavioral triggers | Section 7 PRE-TASK and POST-TASK tables                                          | SQ6      |
| SWS CANON integration pathway | Ecosystem registration, 16-item checklist, 4-layer enforcement                   | SQ10     |

---

## 2. Gap Inventory

### 2A. Underused Agents (from SQ3)

| Agent                      | Research Classification | Evidence of Underuse                                             | Impact if Activated                                     |
| -------------------------- | ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| error-detective            | PRIMARY                 | 0 skill references, no CLAUDE.md trigger, overlaps with debugger | LOW -- debugger + /systematic-debugging covers this     |
| penetration-tester         | PRIMARY                 | 0 skill references, opus model but no trigger                    | MEDIUM -- could add value for focused pen-test research |
| backend-architect          | SECONDARY               | Referenced in AGENT_ORCHESTRATION.md but no trigger              | MEDIUM -- useful for API design research                |
| nextjs-architecture-expert | SECONDARY               | No trigger, but SoNash IS a Next.js app                          | MEDIUM -- architecture research for Next.js 16          |
| performance-engineer       | SECONDARY               | Referenced in AGENT_ORCHESTRATION.md but no trigger              | MEDIUM -- bottleneck identification research            |
| dependency-manager         | SECONDARY               | SoNash-customized but no trigger                                 | MEDIUM -- npm audit research workflows                  |
| prompt-engineer            | NONE (opus)             | No trigger, high-cost model for niche use                        | MEDIUM -- agent/skill prompt quality research           |
| devops-troubleshooter      | SECONDARY               | 0 references, solo dev on Firebase                               | LOW -- no production ops workflow                       |
| deployment-engineer        | NONE                    | 0 references, Firebase handles deployment                        | LOW                                                     |
| fullstack-developer        | NONE (opus)             | 0 references, 33KB generic                                       | LOW -- redundant with frontend-developer + plan         |
| git-flow-manager           | NONE                    | 0 references, user manages git manually                          | LOW                                                     |

**Cross-reference with SQ5:** 7 definitively underused agents + 6 potentially
underused = 13 of 27 project-level agents (48%) have no structured invocation
pathway.

### 2B. Underused Tools (from SQ5)

| Tool/Capability                  | Available Via                    | Current Use                                             | Research Potential                                                   |
| -------------------------------- | -------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| Sequential Thinking MCP          | mcp\_\_sequential-thinking       | ZERO invocations by any skill or agent                  | HIGH -- purpose-built for research decomposition, hypothesis testing |
| Memory Knowledge Graph           | Memory server (9 tools)          | Used for project memory only                            | HIGH -- could store research ontologies, tool-capability mappings    |
| Context7                         | context7 MCP (2 tools)           | Only in 4 agents (deep-research-searcher, 3 GSD agents) | HIGH -- library docs for all research-adjacent agents                |
| Chrome Superpowers auto-capture  | superpowers-chrome MCP           | ZERO research use                                       | MEDIUM -- auto-captured markdown from web pages                      |
| Grep count mode                  | Grep tool (output_mode: "count") | Rarely used                                             | HIGH -- instant quantitative pattern prevalence                      |
| Glob mod-time sorting            | Glob tool                        | Never exploited for research                            | MEDIUM -- "what changed recently?" answerable instantly              |
| Bash run_in_background           | Bash tool parameter              | Almost never used                                       | MEDIUM -- parallel script execution during research                  |
| Firebase rule validation         | firebase MCP                     | ZERO research use                                       | MEDIUM -- automated security rule verification                       |
| SonarCloud MCP                   | sonarcloud MCP (4 tools)         | Only via /sonarcloud skill                              | MEDIUM -- code quality baselines for research                        |
| WebFetch prompt-based extraction | WebFetch tool                    | Simple prompts only                                     | MEDIUM -- targeted multi-query extraction on cached URLs             |
| Episodic Memory mid-research     | episodic-memory MCP              | Session-start only                                      | HIGH -- "have we researched this before?" checks                     |

**Quantitative summary (from SQ5):** Of ~200 total research tool surface area,
~25% actively used, ~40% underused, ~35% never invoked for research.

### 2C. Never-Spawned Teams (from SQ4)

| Team                                      | Status                        | Evidence                                                   | Impact of Gap                                                              |
| ----------------------------------------- | ----------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| audit-review-team (formalized)            | **Never spawned**             | 0 invocation records in state files; created 2026-03-24    | MEDIUM -- cross-target pattern recognition lost in sequential audits       |
| research-plan-team (formalized)           | **Never spawned**             | 0 invocation records; created 2026-03-24                   | HIGH -- progressive handoff and adversarial verification unavailable       |
| Development Team (CLAUDE.md reference)    | **No definition file exists** | CLAUDE.md Section 7 trigger with no backing implementation | HIGH -- trigger is un-actionable; multi-file feature work defaults to solo |
| Review Team (AGENT_ORCHESTRATION.md)      | **Conceptual only**           | Described in docs, no .claude/teams/ file                  | LOW -- 20+ item PRs are rare for solo dev                                  |
| Exploration Team (AGENT_ORCHESTRATION.md) | **Conceptual only**           | Described in docs, no file                                 | LOW -- Explore agent as subagent works for most cases                      |

**Root causes for non-spawning (from SQ4):** (1) complexity assessment is
implicit, not measured; (2) token cost bias toward cheaper options; (3) team
spawn is opt-in, not opt-out; (4) no feedback loop confirming team value.

### 2D. Zero Hook Detection for Research (from SQ6)

| Gap                                 | Signal That Should Trigger Research                        | Current Detection                             | Impact                                           |
| ----------------------------------- | ---------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| G1: Unfamiliar code navigation      | First read of new directory subtree + modification request | NONE                                          | HIGH -- AI guesses at architecture               |
| G2: New domain/technology questions | Technology + version number + "how to" / "best practice"   | NONE                                          | HIGH -- training data is May 2025, stack is 2026 |
| G3: Conflicting information         | Content contradicts previously read content                | NONE                                          | MEDIUM-HIGH -- silent contradiction resolution   |
| G4: Security-sensitive design       | Security keywords + design keywords in combination         | PARTIAL (P1 triggers auditor, not research)   | MEDIUM                                           |
| G5: Multi-session work starting     | Complexity signals + duration indicators                   | PARTIAL (plan banner, no research suggestion) | HIGH                                             |
| G6: Repeated debugging failures     | Multiple failed fix attempts, uncertainty expressions      | NONE                                          | MEDIUM                                           |
| G7: First external integration      | Import/package not in package.json                         | NONE                                          | MEDIUM                                           |

**Key finding (from SQ6):** The word "research" appears NOWHERE in any hook
detection logic. Research is entirely in the behavioral-rule layer (CLAUDE.md
Section 7), making it fragile to compaction, rationalization, and context loss.

---

## 3. Pattern Conflicts

### Conflict 1: Incompatible Confidence Scales (from SQ1)

**Severity: HIGH | Sources: SQ1 Section 5.3**

| System            | Confidence Scale                                                         | Basis                         |
| ----------------- | ------------------------------------------------------------------------ | ----------------------------- |
| deep-plan Phase 0 | Binary: verified / [UNVERIFIED]                                          | Command output verification   |
| deep-research     | 4-level: HIGH / MEDIUM / LOW / UNVERIFIED                                | Source quality (CRAAP+SIFT)   |
| CL-PROTOCOL       | 3-level: HIGH / MEDIUM / LOW (findings)                                  | Evidence directness           |
| CL-PROTOCOL       | 3-level: CONFIRMED / WEAKENED / FALSE-POSITIVE (contrarian)              | Challenge outcome             |
| CL-PROTOCOL       | 4-level: FIXED / PARTIALLY-FIXED / NOT-FIXED / REGRESSION (verification) | Fix status                    |
| convergence-loop  | 3-level: HIGH / MEDIUM / LOW (output)                                    | Process outcome (pass counts) |
| convergence-loop  | 4-category: Confirmed / Corrected / Extended / New (T20 tally)           | Per-pass state                |

**Impact:** When findings flow between systems (e.g., deep-research -> deep-plan
adapter, convergence-loop -> calling skill), confidence levels must be manually
mapped. There is no shared vocabulary for "how confident are we in this claim?"

### Conflict 2: CL-PROTOCOL vs convergence-loop Structural Isomorphism (from SQ1)

**Severity: HIGH | Sources: SQ1 Sections 3 and 5.3**

CL-PROTOCOL implements its own D1-D4/V1-V4 multi-pass verification structure
that is structurally isomorphic to convergence-loop (multi-pass with contrarian
challenges, re-synthesis triggers, graduated assessment). However:

- CL-PROTOCOL does NOT invoke convergence-loop
- CL-PROTOCOL mandates opus; convergence-loop is model-agnostic
- CL-PROTOCOL has no persistent artifacts; convergence-loop has state files
- Both use a >20% re-synthesis threshold independently

This creates parallel implementations of the same pattern with potential for
drift.

### Conflict 3: Contrarian Verification -- Three Implementations (from SQ1 + SQ2)

**Severity: MEDIUM | Sources: SQ1 Section 5.2**

| System                | Contrarian Implementation                       | Prompt Source           |
| --------------------- | ----------------------------------------------- | ----------------------- |
| deep-research Phase 3 | Dedicated contrarian agent(s), depth-scaled 1-3 | REFERENCE.md L379-399   |
| CL-PROTOCOL D3/V3     | general-purpose opus contrarian, 1-2 per phase  | CL-PROTOCOL.md L133-147 |
| convergence-loop      | fresh-eyes behavior (composable)                | SKILL.md L47-57         |

All three do "challenge the findings from an adversarial perspective," but with
different prompts, different models, and different output formats. No shared
contrarian protocol exists.

### Conflict 4: Artifact Persistence Inconsistency (from SQ1)

**Severity: MEDIUM | Sources: SQ1 Section 5.3**

| System           | Writes to Disk     | State File | Persistent Artifacts                                                         |
| ---------------- | ------------------ | ---------- | ---------------------------------------------------------------------------- |
| deep-research    | YES (7+ files)     | YES        | RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json, 3 registries |
| deep-plan        | YES (DIAGNOSIS.md) | YES        | DIAGNOSIS.md, PLAN.md, DECISIONS.md                                          |
| CL-PROTOCOL      | NO                 | NO         | NOTHING -- all verification results are transient                            |
| convergence-loop | OPTIONAL (report)  | YES        | State file; report is optional                                               |

**Impact:** CL-PROTOCOL verification results cannot be audited, recalled, or
referenced in retrospectives. Ecosystem audits that re-run verification cannot
compare against prior results.

### Conflict 5: Ecosystem Audits Don't Use Convergence Loops (from SQ2)

**Severity: MEDIUM | Sources: SQ2 Gaps section**

All 4 ecosystem audit skills (hook, session, doc, health) do Phase 6 re-run
verification but NONE invoke the convergence-loop skill. This is a natural
integration point where verified patterns already exist. Meanwhile, /alerts
skill DOES use CLs in Phase 5, and /skill-creator uses CLs in Phase 5 for
Complex tier. The gap is in the audit family specifically.

### Conflict 6: Team Default Is Opt-In When Rules Say Otherwise (from SQ4 + SQ6)

**Severity: MEDIUM | Sources: SQ4 Section 6, SQ6 Section 2**

CLAUDE.md Section 7 says "Multi-file feature (3+ files) -> Development team ->
Team" (a PRE-TASK trigger), but: (a) no Development Team definition file exists,
and (b) the AI consistently defaults to solo execution even when team triggers
are met. The behavioral rule and the implementation are misaligned.

### Conflict 7: Citation Standards Range from None to Formal (from SQ1)

**Severity: LOW | Sources: SQ1 Section 5.1**

| System            | Citation Practice                                                            |
| ----------------- | ---------------------------------------------------------------------------- |
| deep-plan Phase 0 | No formal citations                                                          |
| deep-research     | Numeric inline [1][2] + CRAAP scores + 3-tier source organization            |
| CL-PROTOCOL       | Line numbers + 2-3 lines quoted code (code evidence, not source attribution) |
| convergence-loop  | "Evidence required" but no format specified                                  |

---

## 4. Highest-Impact Standardization Targets (Ranked)

### Rank 1: Unified Confidence Scale

**Impact: CRITICAL | Sources: SQ1 + SQ2**

Standardize on a 4-level scale (HIGH / MEDIUM / LOW / UNVERIFIED) across ALL
research/discovery systems. Define assignment rules once, adapted per context:

- Source-based (deep-research style): 2+ independent sources = MEDIUM minimum,
  authoritative source = HIGH eligible
- Evidence-based (CL-PROTOCOL style): direct code evidence = HIGH, inferred =
  MEDIUM, uncertain = LOW
- Process-based (convergence-loop style): 0 corrections in 2+ passes = HIGH,
  extensions only = MEDIUM

This enables seamless claim handoff between systems without manual mapping.

### Rank 2: CL-PROTOCOL Artifact Persistence

**Impact: HIGH | Sources: SQ1 + SQ2**

CL-PROTOCOL is the only multi-agent verification system that writes NOTHING to
disk. Add minimal persistence:

- D4 verified inventory -> `.planning/<plan>/cl-discovery-{step}.json`
- V4 verification report -> `.planning/<plan>/cl-verification-{step}.json`

This enables cross-session auditing, retrospective analysis, and trend tracking.

### Rank 3: Hook-Based Research Detection (Phase 1)

**Impact: HIGH | Sources: SQ6**

Add research keyword detection to user-prompt-handler.js as a new Priority 5.5:

- Trigger words: "research", "investigate", "compare approaches", "best practice
  for", "recommended way to"
- Output: stderr hint suggesting /deep-research
- Anti-fatigue: compound signal thresholds (2+ signals), cooldown per topic per
  session

This is the lowest-effort change with highest impact -- ~30 lines of code to
bridge the zero-detection gap.

### Rank 4: Sequential Thinking MCP Integration

**Impact: HIGH | Sources: SQ5**

Sequential Thinking MCP is purpose-built for structured reasoning
(decomposition, branching, hypothesis testing, revision) and has ZERO current
invocations. Integrate into:

- deep-research Phase 0 (research decomposition)
- deep-plan Phase 0 (problem decomposition before DIAGNOSIS)
- systematic-debugging Phase 1 (hypothesis generation)

Zero-cost integration -- the tool is already available.

### Rank 5: Context7 Expansion to Research-Adjacent Agents

**Impact: HIGH | Sources: SQ5**

Context7 is available but only in 4 agents' tool lists. Add it to:
security-auditor, code-reviewer, explore, debugger, frontend-developer,
performance-engineer. These agents frequently need library documentation and
currently default to WebSearch.

### Rank 6: Development Team Definition File

**Impact: HIGH | Sources: SQ4**

CLAUDE.md Section 7 references "Development team" for multi-file features (3+
files) but no `.claude/teams/development-team.md` exists. This is a direct
compliance gap in the canonical reference document. Create the definition
following audit-review-team and research-plan-team patterns.

### Rank 7: Universal Contrarian Protocol

**Impact: MEDIUM | Sources: SQ1**

Extract the contrarian verification pattern from its 3 independent
implementations (deep-research, CL-PROTOCOL, convergence-loop fresh-eyes) into a
shared protocol:

- Common prompt structure with domain-specific hooks
- Standard output format (CONFIRMED / WEAKENED / FALSE-POSITIVE)
- Configurable model (default sonnet, override to opus for CL work)
- Line-number citation requirement from CL-PROTOCOL

### Rank 8: Episodic Memory Pre-Research Check

**Impact: MEDIUM | Sources: SQ5**

Before Phase 0 of /deep-research, search episodic memory for informal prior
research on the topic. Currently, /deep-research only checks
research-index.jsonl (formal research). Informal research done in conversation
but never formalized is invisible.

### Rank 9: Invert Team Decision Default

**Impact: MEDIUM | Sources: SQ4**

Change skill text from "consider spawning a team" to "spawn the team UNLESS one
of these exceptions applies." Apply to: /skill-audit (3+ targets),
/deep-research (L/XL complexity), /deep-plan (--research flag). This changes the
cognitive default from opt-in to opt-out.

### Rank 10: Interactive Triage Standard

**Impact: MEDIUM | Sources: SQ2**

The finding-by-finding walkthrough pattern appears in 7+ skills (all ecosystem
audits, alerts, ecosystem-health, skill-audit) with nearly identical structure
but copy-pasted implementations. Standardize:

- Impact-weighted sorting
- Context card format (severity, domain, impact score, message, evidence)
- Decision options per severity
- Batch shortcuts (3+ similar findings)
- Delegation protocol ("you decide" handling)
- Progress tracking ("Finding N of M")
- Scope explosion guard (>30 findings)

---

## 5. Natural Invocation Gaps: Unified "When Should Research Happen but Doesn't?" List

This section combines SQ6 hook gaps, SQ2 skill trigger gaps, and SQ3 agent
trigger gaps into a single prioritized inventory.

### Priority A: No Detection Mechanism Exists

These situations should trigger research but have ZERO automated or behavioral
detection:

| #   | Situation                                                                                    | What Should Happen                                                         | Why It Doesn't                                                                                                  | Sources           |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------- |
| A1  | AI enters unfamiliar codebase area for the first time in a session and is asked to modify it | Explore agent dispatch or /deep-research suggestion                        | post-read-handler tracks file count but not directory novelty; no "unfamiliar territory" signal                 | SQ6 G1, SQ3       |
| A2  | User asks about technology/API with version newer than training cutoff (May 2025)            | Context7 lookup or WebSearch + /deep-research suggestion                   | No hook detects version-specific questions; stack version table in CLAUDE.md warns but doesn't trigger research | SQ6 G2, SQ5 GAP-4 |
| A3  | AI reads files that contradict each other or contradict prior session context                | Pause and surface contradiction, suggest investigation                     | No contradiction detection exists anywhere in the system                                                        | SQ6 G3            |
| A4  | Debugging stalls after 3+ failed fix attempts                                                | Escalate to /deep-research or architectural review                         | P2 bug detection triggers systematic-debugging on FIRST mention only; no escalation for stalled debugging       | SQ6 G6, SQ2       |
| A5  | Task involves integrating with external API/library not in package.json                      | Suggest /deep-research or Context7 lookup                                  | No detection for new external dependencies                                                                      | SQ6 G7, SQ5 GAP-4 |
| A6  | Research is needed but /deep-research is not invoked; user simply asks a domain question     | Suggest formal research when question complexity exceeds quick-lookup tier | "research", "investigate", "what are the options" are not trigger keywords in ANY hook                          | SQ6 Section 1.1   |

### Priority B: Partial Detection, Incomplete Response

These situations have some detection but the response doesn't include research:

| #   | Situation                                                     | Current Detection                               | What's Missing                                                                                                                  | Sources              |
| --- | ------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| B1  | Multi-session project starting                                | Plan Mode Suggestion banner fires               | Banner suggests /deep-plan but NOT /deep-research first; research-before-plan is not surfaced                                   | SQ6 G5, SQ1          |
| B2  | Security-sensitive design decisions (new features)            | P1 security detection triggers security-auditor | Auditor reviews existing code, not research on best practices for new designs; no trigger for /deep-research on security topics | SQ6 G4, SQ3          |
| B3  | Ecosystem audits completing Phase 6 re-run verification       | Re-run script executes                          | Ecosystem audits don't use convergence-loop for verification -- 4 skills independently re-run scripts without CL structure      | SQ2 Gap 1            |
| B4  | Code-reviewer and systematic-debugging use episodic memory    | Pre-search for past context                     | Other skills that could benefit (pr-review, skill-audit) don't use episodic memory pre-search                                   | SQ2 Gap 2, SQ5 GAP-1 |
| B5  | /deep-research checks research-index.jsonl for prior research | Formal research index check                     | Does NOT search episodic memory for informal prior research done in conversation                                                | SQ5 GAP-1            |

### Priority C: Trigger Exists but Implementation Missing or Fragile

These have documented triggers in CLAUDE.md or skills but the trigger is
un-actionable or behavioral-only:

| #   | Situation                                                             | Documented Trigger                              | Why It Fails                                                                          | Sources         |
| --- | --------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- | --------------- |
| C1  | Multi-file feature work (3+ files)                                    | CLAUDE.md Section 7: "Development team -> Team" | No .claude/teams/development-team.md exists; trigger is un-actionable                 | SQ4 Gap 3, SQ6  |
| C2  | Domain/technology research needed                                     | CLAUDE.md Section 7: "deep-research skill"      | BEHAVIORAL only, no hook enforcement; after compaction AI may forget                  | SQ6 Section 2.2 |
| C3  | /skill-audit with 3+ targets should spawn audit-review-team           | skill-audit SKILL.md team trigger               | Team has never been spawned; AI defaults to solo execution due to token cost bias     | SQ4 Gap 1       |
| C4  | /deep-research -> /deep-plan pipeline should spawn research-plan-team | research-plan-team spawn criteria               | Team has never been spawned in formalized form; ALL criteria must be met (too strict) | SQ4 Gap 2       |
| C5  | CL-PROTOCOL work should spawn teams for 5+ file groups                | CL-PROTOCOL.md L47-53                           | Protocol created in Session #237; likely not yet exercised with team spawning         | SQ4 Gap 4       |
| C6  | 19 agents exist with no CLAUDE.md trigger                             | Agents defined in .claude/agents/               | 48% of project-level agents have no structured invocation pathway                     | SQ3 Section 6   |

### Priority D: Capability Available but Unknown to Research Workflows

These represent tool/capability gaps where the infrastructure exists but
research doesn't use it:

| #   | Capability                        | Available Via           | Currently Known By                 | Should Be Known By                                             | Sources    |
| --- | --------------------------------- | ----------------------- | ---------------------------------- | -------------------------------------------------------------- | ---------- |
| D1  | Structured multi-step reasoning   | Sequential Thinking MCP | NOBODY                             | deep-research Phase 0, deep-plan Phase 0, systematic-debugging | SQ5 GAP-3  |
| D2  | Library documentation             | Context7 MCP            | 4 agents only                      | All research-adjacent agents (23+)                             | SQ5 GAP-4  |
| D3  | Research knowledge graph          | Memory server           | Session management only            | All research workflows                                         | SQ5 GAP-2  |
| D4  | Auto-captured web page markdown   | Chrome Superpowers      | NOBODY for research                | deep-research-searcher, documentation research                 | SQ5 GAP-7  |
| D5  | Quantitative pattern prevalence   | Grep count mode         | Rarely used                        | All research baselines, audit skills                           | SQ5 GAP-10 |
| D6  | Health check baselines            | 11 health checkers      | /alerts and /ecosystem-health only | Any research assessing code quality, security, debt            | SQ5 GAP-5  |
| D7  | Firebase security rule validation | Firebase MCP            | NOBODY                             | security-auditor, audit skills                                 | SQ5 GAP-9  |

---

## 6. Cross-Cutting Themes

### Theme 1: The Behavioral-Only Research Trigger Problem

Research is the ONLY major capability in the system that relies ENTIRELY on
behavioral rules (CLAUDE.md Section 7) with ZERO hook enforcement. Compare:

| Capability          | Hook Enforcement                         | Behavioral Rules            |
| ------------------- | ---------------------------------------- | --------------------------- |
| Security audit      | P1 stdout DIRECTIVE (strong)             | CLAUDE.md trigger           |
| Bug debugging       | P2 stdout DIRECTIVE                      | CLAUDE.md trigger           |
| Code review         | Pre-commit gate (blocking)               | CLAUDE.md POST-TASK trigger |
| UI/Frontend routing | P4 stdout DIRECTIVE                      | CLAUDE.md trigger           |
| Planning            | P5 stderr HINT (weak) + Plan Mode Banner | CLAUDE.md trigger           |
| Exploration         | P6 stderr HINT (weak)                    | CLAUDE.md trigger           |
| **Research**        | **NOTHING**                              | **CLAUDE.md trigger only**  |

This means research invocation is fragile to: compaction (behavioral rules
preserved but situational judgment lost), rationalization ("I know enough to
proceed"), and cognitive load (AI prioritizes explicit directives over
behavioral guidelines).

_Sources: SQ6 Sections 1, 6.2_

### Theme 2: The 48% Agent Waste Problem

13 of 27 project-level agents (48%) have no structured invocation pathway. Of
those, 7 are "definitively underused" (zero skill references, no triggers). This
represents significant configuration overhead with no return.

However, some of these agents have genuine research value if activated:

- penetration-tester (opus model) for security research
- nextjs-architecture-expert for Next.js 16 architecture research
- performance-engineer for bottleneck identification

The solution is not necessarily more triggers -- it may be consolidation (merge
redundant agents) combined with targeted activation for the valuable ones.

_Sources: SQ3 Section 6, SQ5 Section 4_

### Theme 3: The Team Adoption Failure

Both formalized teams (audit-review-team, research-plan-team) have ZERO
invocations. The Development Team referenced in CLAUDE.md has no definition
file. Ad hoc teams were used during agent-env analysis (Sessions #225-236) but
those patterns were formalized into definitions that have never been executed.

The 4 root causes identified in SQ4 (implicit complexity assessment, token cost
bias, opt-in default, no value feedback loop) suggest that team adoption
requires structural changes, not just documentation.

_Sources: SQ4 Sections 3, 6_

### Theme 4: The SWS Integration Opportunity

The Research & Discovery standard is assessed at L1 (Identified) on the CANON
maturity scale. The 16-item checklist shows: 2 items PRESENT, 5 PARTIAL, 9
ABSENT. The target is L3 (Monitored). Six existing SWS tenets directly govern
research/discovery behavior (T19, T20, T22, T23, T15, T13).

The integration pathway is clear but requires a user decision on D67 sequence
amendment (whether R&D gets its own ecosystem slot or folds into Skills).

_Sources: SQ10 Sections 2, 4, 7_

### Theme 5: The Standardization Debt in Verification

43 total quality gates exist across the 4 core systems (deep-plan: 7,
deep-research: 14, CL-PROTOCOL: 12, convergence-loop: 10). Many share patterns:

- Contrarian verification: 3 independent implementations
- > 20% re-synthesis trigger: used by deep-research and CL-PROTOCOL
  > independently
- User gate before proceeding: 4 different formulations
- Scope explosion guard: 3 different thresholds (>15, >50, >100)

Extracting shared primitives would reduce maintenance burden and prevent drift.

_Sources: SQ1 Sections 5.2, 5.3_

---

## 7. Summary Statistics

| Metric                                           | Value                            | Source |
| ------------------------------------------------ | -------------------------------- | ------ |
| Total research/discovery tools (all tiers)       | ~200+                            | SQ5    |
| Active research utilization                      | ~25% (50 tools)                  | SQ5    |
| Underutilized for research                       | ~40% (80 tools)                  | SQ5    |
| Never used for research                          | ~35% (70 tools)                  | SQ5    |
| Total agents                                     | 41 (27 project + 14 global)      | SQ3    |
| Underused agents (no trigger)                    | 13 of 27 project-level (48%)     | SQ3    |
| Definitively underused agents                    | 7                                | SQ3    |
| Formalized teams                                 | 2                                | SQ4    |
| Teams ever spawned in formalized form            | 0                                | SQ4    |
| Teams referenced in CLAUDE.md with no definition | 1 (Development Team)             | SQ4    |
| Hook priorities detecting research               | 0 of 6                           | SQ6    |
| Quality gates across core systems                | 43                               | SQ1    |
| Confidence scales in use                         | 4 incompatible scales            | SQ1    |
| Contrarian implementations                       | 3 independent                    | SQ1    |
| SWS tenets governing R&D                         | 6 (T13, T15, T19, T20, T22, T23) | SQ10   |
| R&D CANON maturity                               | L1 (Identified), target L3       | SQ10   |
| CANON 16-item checklist status                   | 2 PRESENT, 5 PARTIAL, 9 ABSENT   | SQ10   |
