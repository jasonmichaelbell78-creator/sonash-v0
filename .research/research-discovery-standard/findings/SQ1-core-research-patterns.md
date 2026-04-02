# SQ1: Core Research/Discovery Patterns in deep-plan, deep-research, CL-PROTOCOL, and convergence-loop

**Date:** 2026-03-24 **Sub-question:** What research/discovery patterns exist in
deep-plan Phase 0, deep-research phases, CL-PROTOCOL, and convergence-loop
today? **Sources:** 4 primary skill/protocol documents (read in full)

---

## 1. deep-plan Phase 0: Context Gathering

**Source:** `.claude/skills/deep-plan/SKILL.md` (lines 101-145),
`.claude/skills/deep-plan/REFERENCE.md` (lines 82-106)

### 1.1 Triggers for Research/Discovery

| Trigger                                                                                | Line Reference    | Confidence |
| -------------------------------------------------------------------------------------- | ----------------- | ---------- |
| User invokes `/deep-plan` explicitly                                                   | SKILL.md L39      | HIGH       |
| Task is ambiguous with 5+ design decisions                                             | SKILL.md L41      | HIGH       |
| Phase 0 Step 3: domain/technology not present in codebase triggers research suggestion | SKILL.md L112-116 | HIGH       |
| Phase 0 Step 3: prior `.research/<topic-slug>/` found triggers adapter injection offer | SKILL.md L109-111 | HIGH       |

**Key finding:** Phase 0 has a **mandatory research check** (SKILL.md L108,
marked MUST) with two sub-checks:

1. **Prior research lookup** -- checks `.research/<topic-slug>/` for existing
   deep-research output
2. **Research needed assessment** -- if domain expertise is absent, suggests
   `/deep-research` first with explicit prompt text: "This task needs domain
   research before I can ask informed questions. Run `/deep-research` first?"

**Confidence: HIGH** -- These are explicitly documented as MUST requirements
with specific line references.

### 1.2 Agents/Tools Used

| Agent/Tool                      | Purpose                              | Line Reference    | Confidence |
| ------------------------------- | ------------------------------------ | ----------------- | ---------- |
| Explore agent                   | Broad codebase exploration (SHOULD)  | SKILL.md L117     | HIGH       |
| convergence-loop (quick preset) | Verify DIAGNOSIS.md claims           | SKILL.md L130-136 | HIGH       |
| convergence-loop (quick preset) | Verify plan assumptions in Phase 3.5 | SKILL.md L256-260 | HIGH       |

**Key finding:** Phase 0 uses the Explore agent for initial codebase
understanding but convergence-loop for verification. The Explore agent is a
SHOULD; the CL verification is MUST for L/XL tasks and SHOULD for S/M.

**Confidence: HIGH** -- MUST/SHOULD annotations are explicit.

### 1.3 Verification/Quality Gates

| Gate                                                      | Type              | Line Reference    | Confidence |
| --------------------------------------------------------- | ----------------- | ----------------- | ---------- |
| ROADMAP alignment check                                   | MUST              | SKILL.md L107     | HIGH       |
| Code-state claims must include verify command             | MUST              | SKILL.md L123-129 | HIGH       |
| Unverified claims tagged `[UNVERIFIED]`                   | MUST              | SKILL.md L125-126 | HIGH       |
| `npm view <pkg> version` for version references           | MUST              | SKILL.md L127     | HIGH       |
| Convergence-loop verify DIAGNOSIS (L/XL MUST, S/M SHOULD) | MUST/SHOULD       | SKILL.md L130-136 | HIGH       |
| User confirms diagnosis before Discovery proceeds         | MUST (phase gate) | SKILL.md L143-145 | HIGH       |
| ROADMAP misalignment requires explicit user decision      | MUST              | SKILL.md L139-141 | HIGH       |

**Key finding:** Phase 0 has **7 distinct quality gates**, making it the most
gate-heavy discovery phase of any system. The `[UNVERIFIED]` tagging system
(L125-126) creates a two-tier claim system: verified and unverified.

**Confidence: HIGH** -- All gates are annotated with MUST and have clear
criteria.

### 1.4 Artifacts Produced

| Artifact     | Location                                          | Line Reference    | Confidence |
| ------------ | ------------------------------------------------- | ----------------- | ---------- |
| DIAGNOSIS.md | `.planning/<topic-slug>/DIAGNOSIS.md`             | SKILL.md L119     | HIGH       |
| State file   | `.claude/state/deep-plan.<topic-slug>.state.json` | SKILL.md L176-179 | HIGH       |

**DIAGNOSIS.md template** (REFERENCE.md L83-105) contains:

- ROADMAP alignment assessment
- Relevant existing systems table (System / Relationship / Pattern to Follow)
- Reframe check with recommendation
- (When prior research exists) `## Research Context` section via deep-plan
  adapter

**Confidence: HIGH** -- Template is fully specified with example structure.

### 1.5 Standardized vs Ad-hoc

| Aspect                                     | Status                | Evidence                                                                              |
| ------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------- |
| DIAGNOSIS.md template                      | **Standardized**      | REFERENCE.md L83-105                                                                  |
| State file schema                          | **Standardized**      | REFERENCE.md L160-187                                                                 |
| Research check (two sub-checks)            | **Standardized**      | SKILL.md L108-116                                                                     |
| Code-state verification                    | **Standardized**      | SKILL.md L123-129                                                                     |
| CL integration (quick preset)              | **Standardized**      | SKILL.md L130-136                                                                     |
| Explore agent usage for codebase scanning  | **Ad-hoc**            | SKILL.md L117 says "SHOULD -- use Explore agent for broad" but no structured protocol |
| What constitutes "relevant codebase areas" | **Ad-hoc**            | SKILL.md L117 -- no criteria for what to explore                                      |
| When to use CL for S/M tasks               | **Semi-standardized** | SKILL.md L130 says SHOULD but no decision criteria                                    |

**Confidence: HIGH** -- MUST/SHOULD/MAY annotations make the distinction clear.

### 1.6 Confidence Levels and Citation Practices

- **No explicit confidence system** for Phase 0 claims -- claims are either
  verified (has verify command) or `[UNVERIFIED]`
- **No citation format** -- DIAGNOSIS.md references "relevant existing systems"
  but has no inline citation standard
- **Binary model**: verified vs unverified, no graduated confidence (contrast
  with deep-research's HIGH/MEDIUM/LOW/UNVERIFIED)

**Confidence: HIGH** -- Absence is clearly observable from reading the full
documents.

---

## 2. deep-research: All Phases

**Source:** `.claude/skills/deep-research/SKILL.md` (lines 1-263),
`.claude/skills/deep-research/REFERENCE.md` (lines 1-947)

### 2.1 Triggers for Research/Discovery

| Trigger                                              | Line Reference                                       | Confidence |
| ---------------------------------------------------- | ---------------------------------------------------- | ---------- |
| User invokes `/deep-research` explicitly             | SKILL.md L45                                         | HIGH       |
| Domain understanding needed before planning          | SKILL.md L46                                         | HIGH       |
| Conflicting sources need evaluation                  | SKILL.md L46                                         | HIGH       |
| `/deep-plan` Phase 0 detects absent domain knowledge | SKILL.md L46 (cross-ref deep-plan SKILL.md L112-116) | HIGH       |
| Skill creation via `/skill-creator`                  | SKILL.md L47                                         | HIGH       |
| GSD project research                                 | SKILL.md L47                                         | HIGH       |
| `--recall` to search prior research                  | SKILL.md L76                                         | HIGH       |
| `--refresh` to re-run research with diff             | SKILL.md L78                                         | HIGH       |

**Key finding:** deep-research has the most formalized trigger set. It is BOTH
an explicit invocation AND a downstream trigger from deep-plan Phase 0 and
skill-creator. The `--recall` and `--refresh` management commands make it a
persistent research store, not just a one-shot tool.

**Confidence: HIGH** -- All triggers explicitly documented with flag syntax.

### 2.2 Agents/Tools Used

| Phase   | Agent/Tool                                | Count                    | Purpose                                             | Line Reference                           | Confidence |
| ------- | ----------------------------------------- | ------------------------ | --------------------------------------------------- | ---------------------------------------- | ---------- |
| Phase 0 | Inline (orchestrator)                     | 1                        | Classification, decomposition, Q&A                  | SKILL.md L88-99                          | HIGH       |
| Phase 0 | Strategy log reader                       | 1                        | Inform strategy from `.research/strategy-log.jsonl` | REFERENCE.md L729-730                    | HIGH       |
| Phase 1 | Searcher agents                           | D + 3 + floor(D/5) floor | Parallel research execution                         | SKILL.md L101-104, L143-147              | HIGH       |
| Phase 1 | Domain module                             | per-domain               | Source authority + verification rules               | SKILL.md L131-132, REFERENCE.md L856-884 | HIGH       |
| Phase 2 | Synthesizer agent                         | 1                        | Consolidate findings                                | SKILL.md L107                            | HIGH       |
| Phase 3 | Contrarian agent(s)                       | 1-3 (depth-scaled)       | Challenge findings                                  | SKILL.md L109, REFERENCE.md L84-89       | HIGH       |
| Phase 3 | OTB agent(s)                              | 1-3 (depth-scaled)       | Lateral thinking                                    | SKILL.md L109, REFERENCE.md L84-89       | HIGH       |
| Phase 3 | Gemini CLI                                | external                 | Cross-model verification                            | REFERENCE.md L555-599                    | HIGH       |
| Phase 3 | convergence-loop (research-claims preset) | 6 behaviors              | Claim verification                                  | REFERENCE.md L603-624                    | HIGH       |
| Phase 4 | Inline (self-audit)                       | 1                        | Tiered quality checks                               | SKILL.md L112                            | HIGH       |
| Phase 5 | Inline (routing)                          | 1                        | Downstream adapter presentation                     | SKILL.md L114                            | HIGH       |

**Key finding:** deep-research is the most agent-intensive system. The agent
allocation formula `D + 3 + floor(D/5)` (SKILL.md L39-41) is explicitly
documented as a FLOOR, not a ceiling. The skill mandates scope-aware allocation
with user override. At L4 depth, it can deploy 8-10 searchers + 6 challenge
agents + synthesizer = up to 17+ agents total.

**Confidence: HIGH** -- Agent counts, types, and scaling rules all explicitly
documented.

### 2.3 Verification/Quality Gates

| Gate                                                     | Phase   | Line Reference                  | Confidence |
| -------------------------------------------------------- | ------- | ------------------------------- | ---------- |
| Duplicate check (existing research)                      | 0.0     | SKILL.md L124-126               | HIGH       |
| MECE verification (overlap + gap check)                  | 0.5     | SKILL.md L140-141               | HIGH       |
| Allocation formula + user approval                       | 0.6-0.8 | SKILL.md L143-149               | HIGH       |
| Plan approval (unless --auto)                            | 0.7-0.8 | SKILL.md L149, Critical Rule #1 | HIGH       |
| Agent timeout (5 min)                                    | 1       | SKILL.md L162                   | HIGH       |
| User checkpoint on failures                              | 1       | SKILL.md L163                   | HIGH       |
| Contrarian challenge (MANDATORY)                         | 3       | SKILL.md L109, Critical Rule #2 | HIGH       |
| OTB challenge (MANDATORY)                                | 3       | SKILL.md L109, Critical Rule #2 | HIGH       |
| Cross-model verification (Gemini CLI)                    | 3       | REFERENCE.md L555-599           | HIGH       |
| CL research-claims verification (6 behaviors)            | 3       | REFERENCE.md L603-624           | HIGH       |
| Re-synthesis trigger (>20% claims changed)               | 3       | SKILL.md L179-181               | HIGH       |
| Self-audit (tiered T1-T4 by depth)                       | 4       | SKILL.md L187-190               | HIGH       |
| Confidence distribution check (not >80% HIGH or LOW)     | 4       | REFERENCE.md L437               | HIGH       |
| Source diversity check (>=2 tiers, >=3 distinct authors) | 4       | REFERENCE.md L437               | HIGH       |

**Key finding:** deep-research has **14 distinct quality gates** across 5
phases. The most unique are: (a) cross-model verification via Gemini CLI (the
only system that uses an external AI model for verification), (b) the >20%
re-synthesis trigger, and (c) the 6-behavior CL research-claims preset which is
a custom convergence-loop integration.

**Confidence: HIGH** -- All gates are marked MANDATORY or have explicit pass
criteria.

### 2.4 Artifacts Produced

| Artifact                      | Location                                        | Retained?      | Line Reference                       | Confidence |
| ----------------------------- | ----------------------------------------------- | -------------- | ------------------------------------ | ---------- |
| RESEARCH_OUTPUT.md            | `.research/<topic-slug>/`                       | Yes            | SKILL.md L209                        | HIGH       |
| claims.jsonl                  | `.research/<topic-slug>/`                       | Yes            | SKILL.md L210                        | HIGH       |
| sources.jsonl                 | `.research/<topic-slug>/`                       | Yes            | SKILL.md L211                        | HIGH       |
| metadata.json                 | `.research/<topic-slug>/`                       | Yes            | SKILL.md L212                        | HIGH       |
| findings/\*.md (per searcher) | `.research/<topic-slug>/findings/`              | Gitignored     | SKILL.md L207                        | HIGH       |
| challenges/CONTRARIAN.md      | `.research/<topic-slug>/challenges/`            | Gitignored     | REFERENCE.md L398                    | HIGH       |
| challenges/OUTSIDE_THE_BOX.md | `.research/<topic-slug>/challenges/`            | Gitignored     | REFERENCE.md L425                    | HIGH       |
| research-index.jsonl          | `.research/research-index.jsonl`                | Yes            | REFERENCE.md L521-542                | HIGH       |
| strategy-log.jsonl            | `.research/strategy-log.jsonl`                  | Yes            | REFERENCE.md L711-731                | HIGH       |
| source-reputation.jsonl       | `.research/source-reputation.jsonl`             | Yes            | REFERENCE.md L739-751                | HIGH       |
| State file                    | `.claude/state/deep-research.<slug>.state.json` | Session-scoped | SKILL.md L151, REFERENCE.md L769-843 | HIGH       |

**Key finding:** deep-research produces the richest artifact set of any system
-- 7+ files per research session plus 3 cross-session registry files. The
retained/gitignored split is deliberate: conclusion artifacts persist for
decision provenance, intermediate artifacts are disposable. The
research-index.jsonl enables cross-session discovery (staleness, overlap
detection, recall).

**Confidence: HIGH** -- All artifact paths, schemas, and retention policies
explicitly documented.

### 2.5 Standardized vs Ad-hoc

| Aspect                                                     | Status                                | Evidence                                                                               |
| ---------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| Output directory structure                                 | **Standardized**                      | SKILL.md L205-213                                                                      |
| RESEARCH_OUTPUT.md template                                | **Standardized**                      | REFERENCE.md L212-319                                                                  |
| claims.jsonl schema                                        | **Standardized**                      | REFERENCE.md L447-464                                                                  |
| sources.jsonl schema                                       | **Standardized**                      | REFERENCE.md L467-484                                                                  |
| metadata.json schema                                       | **Standardized**                      | REFERENCE.md L487-515                                                                  |
| State file schema                                          | **Standardized**                      | REFERENCE.md L769-843                                                                  |
| 8 question type classifications                            | **Standardized**                      | REFERENCE.md L43-77                                                                    |
| 4 depth levels (L1-L4)                                     | **Standardized**                      | REFERENCE.md L80-141                                                                   |
| CRAAP+SIFT source evaluation                               | **Standardized**                      | REFERENCE.md L186-208                                                                  |
| Source hierarchy by domain                                 | **Standardized**                      | REFERENCE.md L144-183                                                                  |
| Contrarian prompt template                                 | **Standardized**                      | REFERENCE.md L379-399                                                                  |
| OTB prompt template                                        | **Standardized**                      | REFERENCE.md L403-426                                                                  |
| Self-audit checklist (6 checks)                            | **Standardized**                      | REFERENCE.md L430-439                                                                  |
| Downstream adapter contract                                | **Standardized**                      | REFERENCE.md L628-708                                                                  |
| Agent allocation formula                                   | **Standardized (with user override)** | SKILL.md L39-41                                                                        |
| Domain module loading                                      | **Standardized**                      | SKILL.md L131-132                                                                      |
| Searcher agent spawn prompt                                | **Standardized**                      | REFERENCE.md L858-886                                                                  |
| Q&A round structure                                        | **Semi-standardized**                 | SKILL.md L136-138 (fast-path/B/C levels, but escalation criteria not fully formalized) |
| What "scope size assessment" means for allocation override | **Ad-hoc**                            | SKILL.md L143-147 (present formula + scope, user decides)                              |

**Key finding:** deep-research is the most standardized system. Almost every
aspect has an explicit schema, template, or protocol. The only ad-hoc areas are
the scope assessment for allocation override and the Q&A escalation criteria.

**Confidence: HIGH**

### 2.6 Confidence Levels and Citation Practices

**Confidence system:** 4-level -- HIGH / MEDIUM / LOW / UNVERIFIED (REFERENCE.md
L178-183)

**Assignment rules (REFERENCE.md L178-183):**

- 2+ independent sources agree -> MEDIUM minimum
- Official/authoritative source confirms -> HIGH eligible
- Training data only -> always UNVERIFIED
- Sources contradict -> MEDIUM at best, surface contradiction
- Single unverified blog post -> LOW

**Citation practices:**

- Inline numeric citations `[1][2]` in RESEARCH_OUTPUT.md (REFERENCE.md L231)
- Sources organized by tier (Tier 1: Authoritative, Tier 2: Verified, Tier 3:
  Community) in dedicated section (REFERENCE.md L293-308)
- Each source gets a CRAAP score (5-point scale, 5 dimensions) (REFERENCE.md
  L190-198)
- Source reputation tracking across sessions via source-reputation.jsonl
  (REFERENCE.md L739-751)

**Key finding:** deep-research has the most mature confidence/citation system.
It is the ONLY system with: (a) cross-session source reputation tracking, (b) a
formal source evaluation framework (CRAAP+SIFT), (c) per-claim confidence with
evidence requirements, and (d) confidence distribution quality checks (not >80%
HIGH or LOW).

**Confidence: HIGH**

---

## 3. CL-PROTOCOL: Plan Execution Discovery & Verification

**Source:** `.planning/plan-orchestration/CL-PROTOCOL.md` (lines 1-317)

### 3.1 Triggers for Research/Discovery

| Trigger                                                     | Line Reference          | Confidence |
| ----------------------------------------------------------- | ----------------------- | ---------- |
| Before executing any plan step that modifies code (Phase D) | CL-PROTOCOL.md L72-73   | HIGH       |
| After executing plan steps (Phase V)                        | CL-PROTOCOL.md L169-170 | HIGH       |
| Specific orchestrator steps (Step 1, 4, 6, 8, 10, 11)       | CL-PROTOCOL.md L243-251 | HIGH       |
| Every sub-plan that modifies code gets 2 CL points          | CL-PROTOCOL.md L255-259 | HIGH       |

**Key finding:** CL-PROTOCOL is triggered by plan execution events, not by user
invocation. It is the only system where research/discovery is structurally
embedded in the execution flow rather than being a standalone tool. Every
code-modifying plan step gets a mandatory pre/post CL.

**Confidence: HIGH** -- Placement tables are explicit.

### 3.2 Agents/Tools Used

| Phase       | Agent/Tool                                 | Count                        | Purpose                                            | Line Reference          | Confidence |
| ----------- | ------------------------------------------ | ---------------------------- | -------------------------------------------------- | ----------------------- | ---------- |
| D1          | `general-purpose` (opus)                   | 1 per file group, max 8/wave | Parallel discovery -- read files, catalog findings | CL-PROTOCOL.md L78-98   | HIGH       |
| D2          | Inline (orchestrator)                      | 1                            | Synthesis of D1 findings                           | CL-PROTOCOL.md L101-112 | HIGH       |
| D3          | `general-purpose` (opus) contrarian        | 1-2                          | Challenge D1 findings                              | CL-PROTOCOL.md L115-150 | HIGH       |
| D4          | Inline (orchestrator)                      | 1                            | Completeness audit                                 | CL-PROTOCOL.md L152-165 | HIGH       |
| V1          | `general-purpose` (opus)                   | 1 per file group             | Re-read modified files, confirm fixes              | CL-PROTOCOL.md L177-189 | HIGH       |
| V2          | Bash commands (lint, test, patterns:check) | automated                    | Regression check                                   | CL-PROTOCOL.md L191-205 | HIGH       |
| V3          | `general-purpose` (opus) contrarian        | 1-2                          | Challenge that fixes work                          | CL-PROTOCOL.md L207-224 | HIGH       |
| V4          | Inline (orchestrator)                      | 1                            | Final completeness audit                           | CL-PROTOCOL.md L226-237 | HIGH       |
| Team option | `audit-review-team` (opus override)        | 2 members                    | 5+ file groups with shared concerns                | CL-PROTOCOL.md L47-51   | HIGH       |
| Team option | `research-plan-team`                       | 3 members                    | Research-to-plan pipelines                         | CL-PROTOCOL.md L52-53   | HIGH       |

**Key finding:** CL-PROTOCOL mandates opus for ALL agent roles (CL-PROTOCOL.md
L26-29, marked "Non-negotiable"). This is the only system with a hard model
quality requirement. It also explicitly overrides team member model defaults
from sonnet to opus when spawned for CL work (CL-PROTOCOL.md L54-67).

**Confidence: HIGH** -- Agent roster table and model override rule are explicit.

### 3.3 Verification/Quality Gates

| Gate                                                   | Phase      | Line Reference           | Confidence |
| ------------------------------------------------------ | ---------- | ------------------------ | ---------- |
| Agent timeout (5 min)                                  | D1/V1      | CL-PROTOCOL.md L99, L300 | HIGH       |
| Re-synthesis trigger (>20% changed by D3)              | D3         | CL-PROTOCOL.md L149-150  | HIGH       |
| Completeness checklist (5 items) for discovery         | D4         | CL-PROTOCOL.md L156-163  | HIGH       |
| Automated regression (lint + test + patterns:check)    | V2         | CL-PROTOCOL.md L196-200  | HIGH       |
| Re-verification trigger (>20% fixes problematic by V3) | V3         | CL-PROTOCOL.md L223-224  | HIGH       |
| Completeness checklist (5 items) for verification      | V4         | CL-PROTOCOL.md L230-236  | HIGH       |
| Present to user before execution (D4 output)           | D4         | CL-PROTOCOL.md L164-165  | HIGH       |
| Present to user before commit (V4 output)              | V4         | CL-PROTOCOL.md L237      | HIGH       |
| No single-pass shortcuts (all sub-phases mandatory)    | Guard rail | CL-PROTOCOL.md L306-307  | HIGH       |
| Scope explosion pause (>50 D1 items)                   | Guard rail | CL-PROTOCOL.md L301      | HIGH       |
| Re-synthesis cap (max 2 loops)                         | Guard rail | CL-PROTOCOL.md L302-303  | HIGH       |
| Contrarian must cite specific line numbers             | Guard rail | CL-PROTOCOL.md L304-305  | HIGH       |

**Key finding:** CL-PROTOCOL has **12 distinct quality gates** and is the most
structurally rigid system. The "no single-pass shortcuts" rule (L306-307) is
unique -- it makes every sub-phase (D1-D4, V1-V4) mandatory, with skipping
requiring explicit user approval. The 20% re-synthesis/re-verification triggers
mirror deep-research Phase 3 design.

**Confidence: HIGH**

### 3.4 Artifacts Produced

| Artifact               | Description                                                              | Line Reference          | Confidence |
| ---------------------- | ------------------------------------------------------------------------ | ----------------------- | ---------- |
| D1 per-agent output    | Line numbers, code context, confidence, fix assessment                   | CL-PROTOCOL.md L92-98   | HIGH       |
| D2 synthesis           | Count by confidence, planned vs discovered comparison                    | CL-PROTOCOL.md L108-112 | HIGH       |
| D3 contrarian output   | CONFIRMED / WEAKENED / FALSE-POSITIVE ratings per finding + NEW findings | CL-PROTOCOL.md L145-147 | HIGH       |
| D4 verified inventory  | Final counts, presented to user                                          | CL-PROTOCOL.md L164-165 | HIGH       |
| V1 per-finding status  | FIXED / PARTIALLY-FIXED / NOT-FIXED / REGRESSION                         | CL-PROTOCOL.md L189     | HIGH       |
| V4 verification report | Final accounting, presented before commit                                | CL-PROTOCOL.md L237     | HIGH       |

**Key finding:** CL-PROTOCOL artifacts are transient -- they live in the
conversation/session, not on disk. Unlike deep-research (which writes to
`.research/`) and deep-plan (which writes DIAGNOSIS.md), CL-PROTOCOL has NO
persistent artifact storage. The D4 and V4 outputs are presented inline and not
written to files.

**Confidence: HIGH** -- No file output paths are specified anywhere in the
document.

### 3.5 Standardized vs Ad-hoc

| Aspect                            | Status           | Evidence                                                                            |
| --------------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| 8-step D1-D4/V1-V4 structure      | **Standardized** | CL-PROTOCOL.md L71-237                                                              |
| Agent model requirement (opus)    | **Standardized** | CL-PROTOCOL.md L26-29                                                               |
| Contrarian prompt template        | **Standardized** | CL-PROTOCOL.md L133-147 (adapted from deep-research Section 8)                      |
| D4/V4 completeness checklists     | **Standardized** | CL-PROTOCOL.md L156-163, L230-236                                                   |
| Orchestrator step placement       | **Standardized** | CL-PROTOCOL.md L243-251                                                             |
| Sub-plan CL placement             | **Standardized** | CL-PROTOCOL.md L255-259                                                             |
| Finding output format (per-agent) | **Standardized** | CL-PROTOCOL.md L92-98                                                               |
| Fix status vocabulary             | **Standardized** | CL-PROTOCOL.md L189 (4 statuses)                                                    |
| Confidence levels for findings    | **Standardized** | CL-PROTOCOL.md L95-97 (HIGH/MEDIUM/LOW)                                             |
| When to use teams vs solo agents  | **Standardized** | CL-PROTOCOL.md L45-53                                                               |
| D1 file grouping strategy         | **Ad-hoc**       | CL-PROTOCOL.md L81 says "batch by logical concern, not arbitrarily" but no criteria |
| Persistent artifact storage       | **Missing**      | No disk artifacts defined                                                           |

**Confidence: HIGH**

### 3.6 Confidence Levels and Citation Practices

**Confidence system:** 3-level for D1 findings -- HIGH (clear violation) /
MEDIUM (likely but needs context) / LOW (uncertain) (CL-PROTOCOL.md L95-97)

**Fix status system:** 4-level for V1 -- FIXED / PARTIALLY-FIXED / NOT-FIXED /
REGRESSION (CL-PROTOCOL.md L189)

**Contrarian rating:** 3-level -- CONFIRMED / WEAKENED / FALSE-POSITIVE
(CL-PROTOCOL.md L145)

**Citation practices:**

- Exact line numbers required for all D1 findings (CL-PROTOCOL.md L92)
- 2-3 lines of quoted code context required (CL-PROTOCOL.md L93)
- Contrarian agents must cite specific line numbers and code (CL-PROTOCOL.md
  L304-305)
- No formal citation numbering system (unlike deep-research's `[1][2]`)

**Key finding:** CL-PROTOCOL has 3 distinct rating vocabularies for 3 different
phases (D1, V1, D3). This is more granular than deep-plan (binary
verified/unverified) but less formalized than deep-research (4-level +
CRAAP+SIFT). The emphasis is on code evidence (line numbers + quoted context)
rather than source attribution.

**Confidence: HIGH**

---

## 4. convergence-loop: Multi-Pass Verification

**Source:** `.claude/skills/convergence-loop/SKILL.md` (lines 1-298)

### 4.1 Triggers for Research/Discovery

| Trigger                                                  | Line Reference                                       | Confidence |
| -------------------------------------------------------- | ---------------------------------------------------- | ---------- |
| User invokes `/convergence-loop` directly                | SKILL.md L31                                         | HIGH       |
| deep-plan Phase 0 DIAGNOSIS verification (MUST for L/XL) | SKILL.md L33 (cross-ref deep-plan SKILL.md L130-136) | HIGH       |
| deep-plan Phase 3.5 plan verification (MUST for L/XL)    | SKILL.md L34 (cross-ref deep-plan SKILL.md L256-260) | HIGH       |
| deep-research Phase 3 research-claims verification       | SKILL.md L66 (cross-ref REFERENCE.md L603-624)       | HIGH       |
| Skill-audit discovery phase                              | SKILL.md L258                                        | HIGH       |
| Any task where wrong claims waste significant effort     | SKILL.md L36                                         | HIGH       |
| Programmatic mode from other skills                      | SKILL.md L238-249                                    | HIGH       |

**Key finding:** convergence-loop is the most frequently referenced system -- it
appears as an integration point in all three other systems. It serves as the
universal verification primitive. However, its adoption is inconsistent:
deep-plan and deep-research have explicit integration, but CL-PROTOCOL embeds
its own CL-like structure (D1-D4/V1-V4) rather than invoking convergence-loop
directly.

**Confidence: HIGH** -- Cross-references verified against all source documents.

### 4.2 Agents/Tools Used

| Component         | Agent/Tool                        | Count              | Purpose                                 | Line Reference    | Confidence |
| ----------------- | --------------------------------- | ------------------ | --------------------------------------- | ----------------- | ---------- |
| Per-pass dispatch | Agent tool (subagent_type varies) | 2-8 (configurable) | Execute behavior against claim slice    | SKILL.md L136-138 | HIGH       |
| Setup             | Inline (orchestrator)             | 1                  | Preset selection, agent config, slicing | SKILL.md L135-146 | HIGH       |
| Report            | Inline (orchestrator)             | 1                  | Generate convergence report             | SKILL.md L209-234 | HIGH       |

**Key finding:** convergence-loop is agent-type agnostic -- it uses
"subagent_type appropriate to the domain" (SKILL.md L137-138), meaning
`general-purpose` for doc verification, `code-reviewer` for code claims. This
makes it the most flexible system in terms of agent selection. However,
CL-PROTOCOL overrides this flexibility by mandating opus for all CL roles.

**Confidence: HIGH**

### 4.3 Verification/Quality Gates

| Gate                                                        | Type                 | Line Reference      | Confidence |
| ----------------------------------------------------------- | -------------------- | ------------------- | ---------- |
| Minimum 2 passes (Critical Rule #1)                         | MUST                 | SKILL.md L17-18     | HIGH       |
| T20 tally every pass (Critical Rule #2)                     | MUST                 | SKILL.md L19-20     | HIGH       |
| User gate before convergence declaration (Critical Rule #3) | MUST                 | SKILL.md L21-22     | HIGH       |
| Save state after every pass (Critical Rule #4)              | MUST                 | SKILL.md L23-24     | HIGH       |
| >100 claims: MUST suggest decomposition                     | Gate (Validate step) | SKILL.md L127, L280 | HIGH       |
| Pass 3 no trend: warn + suggest scope split                 | Guard rail           | SKILL.md L191-192   | HIGH       |
| Agent degradation detection (<3 findings for >10 claims)    | Guard rail           | SKILL.md L157-159   | HIGH       |
| Hard cap: default 5 passes                                  | Guard rail           | SKILL.md L194-197   | HIGH       |
| Graduated convergence (per-claim, not all-or-nothing)       | Critical Rule #5     | SKILL.md L25-26     | HIGH       |
| Disagreement = finding, not error (Critical Rule #6)        | MUST                 | SKILL.md L27-28     | HIGH       |

**Key finding:** convergence-loop has **10 quality gates** including 6 Critical
Rules. Its unique contribution is the **graduated convergence model** -- claims
converge individually (2+ consecutive "Confirmed" -> GRADUATED) rather than as a
batch. This is the most sophisticated convergence tracking of any system.

**Confidence: HIGH**

### 4.4 Artifacts Produced

| Artifact            | Location                                                            | Line Reference    | Confidence |
| ------------------- | ------------------------------------------------------------------- | ----------------- | ---------- |
| Verified claims set | Returned to caller or presented inline                              | SKILL.md L95-96   | HIGH       |
| Convergence report  | Inline and optionally `.claude/state/convergence-report-{topic}.md` | SKILL.md L100-101 | HIGH       |
| Confidence score    | HIGH / MEDIUM / LOW with criteria                                   | SKILL.md L97-98   | HIGH       |
| State file          | `.claude/state/convergence-loop-{topic}.state.json`                 | SKILL.md L266     | HIGH       |

**Key finding:** convergence-loop artifacts are primarily transient (inline)
with optional persistent storage for the convergence report. The state file is
the main persistent artifact. The verified claims set is returned to the calling
skill programmatically, not written to disk as a standalone artifact.

**Confidence: HIGH**

### 4.5 Standardized vs Ad-hoc

| Aspect                                                 | Status                | Evidence                                                                                            |
| ------------------------------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| 6 composable behaviors                                 | **Standardized**      | SKILL.md L47-57                                                                                     |
| 4 presets (standard, quick, thorough, research-claims) | **Standardized**      | SKILL.md L60-66                                                                                     |
| T20 tally format (Confirmed/Corrected/Extended/New)    | **Standardized**      | SKILL.md L161-166                                                                                   |
| Convergence decision logic                             | **Standardized**      | SKILL.md L179-197                                                                                   |
| Disagreement handling protocol                         | **Standardized**      | SKILL.md L199-206                                                                                   |
| Report format (3 sections)                             | **Standardized**      | SKILL.md L209-234                                                                                   |
| State file schema                                      | **Standardized**      | SKILL.md L266 (ref REFERENCE.md Section 6)                                                          |
| Programmatic integration contract                      | **Standardized**      | SKILL.md L238-249                                                                                   |
| Custom behavior composition                            | **Standardized**      | SKILL.md L68-70                                                                                     |
| Domain slicing strategy selection                      | **Semi-standardized** | SKILL.md L139 (templates in REFERENCE.md, but caller picks)                                         |
| Agent type selection                                   | **Ad-hoc**            | SKILL.md L137-138 ("appropriate to the domain" -- no explicit mapping)                              |
| Which claims to include vs exclude                     | **Ad-hoc**            | SKILL.md L87 says "testable assertion about codebase/documentation state" but interpretation varies |

**Confidence: HIGH**

### 4.6 Confidence Levels and Citation Practices

**Output confidence system:** 3-level -- HIGH (0 corrections in final 2 passes)
/ MEDIUM (1 extension in final pass) / LOW (corrections still declining but not
zero) (SKILL.md L97-98)

**Per-claim tracking:** 4-category T20 tally -- Confirmed / Corrected / Extended
/ New (SKILL.md L161-166)

**Graduated convergence status:** Claims individually reach GRADUATED (2+
consecutive "Confirmed") or remain in play.

**Citation practices:**

- Evidence required for corrections ("replacement provided with evidence" --
  SKILL.md L163)
- Disagreements surfaced "with evidence from both sides" (SKILL.md L27-28)
- No formal citation numbering or source hierarchy

**Key finding:** convergence-loop's confidence system is process-based (defined
by pass outcomes) rather than source-based (defined by evidence quality). This
is fundamentally different from deep-research's source-based confidence. The T20
tally is the only per-claim tracking system that tracks state transitions over
time.

**Confidence: HIGH**

---

## 5. Cross-System Comparison

### 5.1 Research/Discovery Pattern Taxonomy

| Pattern                      | deep-plan Phase 0            | deep-research                | CL-PROTOCOL                     | convergence-loop             |
| ---------------------------- | ---------------------------- | ---------------------------- | ------------------------------- | ---------------------------- |
| **Primary purpose**          | Pre-planning context         | Domain knowledge acquisition | Pre/post-execution verification | Claims verification          |
| **Invocation model**         | Phase within larger skill    | Standalone skill             | Embedded in execution flow      | Standalone or programmatic   |
| **Agent intensity**          | Low (1 Explore + CL)         | High (5-17+ agents)          | High (8+ agents per CL)         | Medium (2-8 agents)          |
| **Persistent artifacts**     | DIAGNOSIS.md                 | 7+ files + 3 registries      | None                            | State file + optional report |
| **Confidence model**         | Binary (verified/unverified) | 4-level source-based         | 3-level evidence-based          | 3-level process-based        |
| **Citation format**          | None formalized              | Numeric inline + CRAAP       | Line numbers + code quotes      | Evidence required, no format |
| **Contrarian pass**          | No                           | Mandatory (depth-scaled)     | Mandatory (D3/V3)               | Via fresh-eyes behavior      |
| **Cross-model verification** | No                           | Gemini CLI                   | No                              | No                           |
| **State persistence**        | State file                   | State file + disk artifacts  | Transient                       | State file                   |
| **Quality gates**            | 7                            | 14                           | 12                              | 10                           |

### 5.2 Shared Patterns (Candidates for Standardization)

| Pattern                                   | Where Used                                                                             | How Implemented                                              | Standardization Opportunity                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Contrarian verification**               | deep-research Phase 3, CL-PROTOCOL D3/V3, convergence-loop fresh-eyes                  | 3 different prompt templates + 1 behavior                    | Unified contrarian protocol with domain-specific hooks            |
| **Re-synthesis trigger (>20% threshold)** | deep-research Phase 3, CL-PROTOCOL D3, CL-PROTOCOL V3                                  | Identical threshold, different contexts                      | Already standardized at 20%; could formalize as a shared constant |
| **Agent timeout (5 min)**                 | deep-research Phase 1, CL-PROTOCOL D1/V1                                               | Same timeout, same handling                                  | Already standardized                                              |
| **User gate before proceeding**           | All 4 systems                                                                          | Various formulations                                         | Could standardize the gate UX pattern                             |
| **State file persistence**                | deep-plan, deep-research, convergence-loop                                             | Different schemas in `.claude/state/`                        | Could standardize state file structure/naming                     |
| **Confidence levels**                     | All 4 systems (different scales)                                                       | Binary, 3-level, 4-level                                     | Could standardize on 4-level (HIGH/MEDIUM/LOW/UNVERIFIED)         |
| **Scope explosion guard rail**            | deep-research (>15 sub-Qs), CL-PROTOCOL (>50 D1 items), convergence-loop (>100 claims) | Different thresholds, same pattern (pause + present to user) | Could standardize the pause-and-present pattern                   |

### 5.3 Key Gaps Identified

| Gap                                                       | Affected Systems              | Impact                                                                                                                                                                             | Confidence |
| --------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **No unified confidence scale**                           | All 4                         | deep-plan's binary vs deep-research's 4-level vs CL-PROTOCOL's 3-level vs convergence-loop's 3-level (process-based) creates confusion when systems hand off claims                | HIGH       |
| **CL-PROTOCOL has no persistent artifacts**               | CL-PROTOCOL                   | Verification results are lost after session; cannot be audited, recalled, or referenced in retrospectives                                                                          | HIGH       |
| **No citation standard across systems**                   | All 4                         | deep-research uses `[1][2]` numeric, CL-PROTOCOL uses line numbers, deep-plan has none, convergence-loop requires "evidence" without format                                        | HIGH       |
| **CL-PROTOCOL doesn't invoke convergence-loop**           | CL-PROTOCOL, convergence-loop | CL-PROTOCOL implements its own D1-D4/V1-V4 structure that mirrors convergence-loop patterns but is a separate implementation. This creates maintenance burden and potential drift. | HIGH       |
| **No research/discovery vocabulary**                      | All 4                         | Each system uses different terms for similar concepts (findings, claims, discoveries, violations)                                                                                  | MEDIUM     |
| **convergence-loop agent type selection is ad-hoc**       | convergence-loop, callers     | "Appropriate to the domain" has no mapping; CL-PROTOCOL overrides with opus mandate                                                                                                | MEDIUM     |
| **deep-plan Phase 0 Explore agent usage is unstructured** | deep-plan                     | SHOULD with no protocol for what/how to explore; contrast with CL-PROTOCOL's structured D1 file-reading protocol                                                                   | MEDIUM     |

### 5.4 Dependency Graph

```
deep-research
  └── convergence-loop (research-claims preset, Phase 3)
  └── Gemini CLI (cross-model verification, Phase 3)
  └── deep-plan adapter (Phase 5 downstream routing)

deep-plan Phase 0
  └── convergence-loop (quick preset, DIAGNOSIS verify)
  └── deep-research (trigger if domain knowledge absent)
  └── Explore agent (codebase understanding)

deep-plan Phase 3.5
  └── convergence-loop (quick preset, plan verify)

CL-PROTOCOL
  └── (self-contained D1-D4/V1-V4 — does NOT invoke convergence-loop)
  └── audit-review-team (optional, 5+ file groups)
  └── research-plan-team (optional, research-to-plan pipelines)

convergence-loop
  └── (standalone — invoked by others, invokes no other research systems)
```

---

## 6. Summary of Findings

1. **Four distinct research/discovery paradigms exist** with different purposes
   (context gathering, domain research, execution verification, claims
   verification) but significant pattern overlap.

2. **deep-research is the most standardized** with explicit schemas, templates,
   and protocols for nearly every aspect. It should serve as the reference
   implementation for the Research & Discovery Standard.

3. **CL-PROTOCOL is structurally isomorphic to convergence-loop** (multi-pass
   with contrarian verification) but implemented independently. This is the
   highest-value standardization target.

4. **Confidence systems are incompatible across systems** -- binary, 3-level
   (two variants), and 4-level scales coexist. A unified scale would enable
   seamless claim handoff between systems.

5. **Citation practices vary from none (deep-plan) to formal (deep-research)**
   with no shared standard. The deep-research CRAAP+SIFT framework is the most
   mature and could be adapted project-wide.

6. **43 total quality gates** exist across the 4 systems (7 + 14 + 12 + 10).
   Many share patterns (contrarian verification, >20% re-synthesis triggers,
   user gates) that could be extracted into reusable primitives.

7. **Artifact persistence is inconsistent** -- deep-research writes everything
   to disk, CL-PROTOCOL writes nothing, and deep-plan/convergence-loop write
   state files only. A standard for what persists and where would enable
   cross-session auditing.
