# Research & Discovery Standard — Implementation Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** DRAFT — Pending Approval
**Plan:** research-discovery-standard
**Session:** #238
**Decisions:** See [DECISIONS.md](./DECISIONS.md) (27 decisions)
**Diagnosis:** See [DIAGNOSIS.md](./DIAGNOSIS.md)
**Research:** See [RESEARCH_OUTPUT.md](../../.research/research-discovery-standard/RESEARCH_OUTPUT.md) (L1, 18 agents)
<!-- prettier-ignore-end -->

---

## Summary

This plan implements the Research & Discovery ecosystem as CANON-governed
infrastructure at SWS Phase 3 Step 3. It standardizes how research is triggered,
classified, executed, verified, and persisted across all skills, agents, and
hooks in SoNash.

**Structure:** 4 phases, front-loading high-value behavioral and protocol
changes, back-loading CANON registration.

| Phase | Name                         | Sessions | Deliverables                                                               |
| ----- | ---------------------------- | -------- | -------------------------------------------------------------------------- |
| 1     | Protocol & Behavioral        | 1-2      | 3 protocol docs, T19 expansion, guardrail #15, confidence unification      |
| 2     | Hook Detection & Persistence | 1        | Hook Priority 5.5, CL-PROTOCOL persistence, Zod schemas                    |
| 3     | Agent & Tool Deployment      | 1        | Context7 to 9 agents, development-team.md, external resource investigation |
| 4     | CANON Registration & Testing | 1-2      | Health checker, enforcement manifest, tests, D67 amendment                 |

**Effort:** L (Large) — 4-6 sessions. Per D23.

**Dependencies:** Execution gated on SWS Phases 0-2 and Steps 1-2 (CANON,
Skills) completing. This plan is ready to execute when its turn arrives in the
D67 sequence.

**Key references:** PD-1 through PD-4 (pre-decisions), D1-D23 (discovery
decisions), all in [DECISIONS.md](./DECISIONS.md).

---

## Phase 1: Protocol & Behavioral (Sessions 1-2)

**Goal:** Establish the R&D standard as a documented protocol with shared
vocabulary, tier model, and behavioral enforcement in CLAUDE.md.

### Step 1.1: Write RDS-PROTOCOL.md

Per D2, D3, D4. Write the core protocol document.

**Location:** `.canon/ecosystems/research-discovery/RDS-PROTOCOL.md`

**Contents:**

1. Tier model (T0-T3) with definitions, visibility rules, and user override
   language (per D4)
2. Unified confidence labels (HIGH/MEDIUM/LOW/UNVERIFIED) with per-system
   assignment rules table (per D7)
3. Tier escalation/de-escalation triggers (from RESEARCH_OUTPUT Section 4.3)
4. Pre-research duplicate check requirement — check `research-index.jsonl`
   before T2+ research (per D17)
5. User approval protocol — AI presents tier assessment, user approves or
   adjusts (per D4 caveat)

**Constraint:** Under 100 lines for the core protocol. Appendices may extend.

**Done when:** Document exists, covers all 5 content areas, under 100 lines
core.

### Step 1.2: Write RDS-TOOLS+TEAMS.md

Per D2, D3, D12, D13, D14, D15.

**Location:** `.canon/ecosystems/research-discovery/RDS-TOOLS+TEAMS.md`

**Contents:**

1. Tool selection matrix per tier with MUST/SHOULD/MAY enforcement (per D15):
   - T0: Read, Glob, Grep (MUST)
   - T1: Context7, WebSearch, episodic memory (SHOULD); Read, Glob, Grep (MUST)
   - T2: Multi-source cross-reference (MUST); Context7 (SHOULD); deep-research
     at L1-L2 (SHOULD); Sequential Thinking MCP (MAY — experimental)
   - T3: Full deep-research pipeline (MUST); contrarian + OTB (MUST);
     cross-model verification (SHOULD)
2. Agent selection per tier — which agents are appropriate
3. Team spawn criteria — when to use research-plan-team vs solo agents
4. Model routing rules — Sonnet default, Opus for CL/contrarian/T3 (per PD-3,
   D14)
5. development-team.md reference (experimental, per D13)

**Done when:** Document exists, tool matrix covers all 4 tiers with
MUST/SHOULD/MAY, team spawn criteria defined.

### Step 1.3: Write RDS-VERIFICATION+ENFORCEMENT.md

Per D2, D3, D11, D18, D19.

**Location:**
`.canon/ecosystems/research-discovery/RDS-VERIFICATION+ENFORCEMENT.md`

**Contents:**

1. Verification requirements per tier (per D11):
   - T0: Source exists? Recency OK?
   - T1: Source exists + CRAAP >= 3 on primary source
   - T2: CRAAP + SIFT + 2+ sources cross-reference + contradiction surfacing +
     contrarian pass
   - T3: All T2 + adversarial disconfirmation + cross-model + convergence-loop +
     OTB
2. CL-PROTOCOL reference — canonical copy location, artifact persistence format
   (per D5, D6)
3. Enforcement manifest — 4 gates with what each checks (per D19)
4. Health checker specification — 7 checks + retroactive compliance scan (per
   D18)
5. Retroactive compliance pattern — scan existing artifacts, flag non-compliant,
   offer repair commands

**Done when:** Document exists, verification matrix covers all 4 tiers,
enforcement manifest has 4 gates specified, health checker has 7+ checks listed.

### Step 1.4: Expand T19 in tenets.jsonl

Per D8. Update the T19 tenet wording.

**File:** `.planning/system-wide-standardization/tenets.jsonl` (line 19)

**New wording:**

> "Every skill MUST front-load extensive discovery before producing output.
> Research follows a tiered model (T0-T3) with graduated depth, verification,
> and user interaction. Multi-agent codebase exploration + deep-plan Q&A with
> findings is the standard pattern. The tier model is a guideline — the user
> approves the tier and may adjust at their discretion."

**Done when:** T19 updated in tenets.jsonl, key unchanged
(`T19_extensive_discovery_first`).

### Step 1.5: Add CLAUDE.md Guardrail #15

Per D9. Add to Section 4.

**Wording:**

> 15. **Research before implementation in unfamiliar territory.** Before
>     modifying code in a subsystem not previously read this session, or
>     implementing features involving technology beyond training cutoff, assess
>     whether research is needed. Present the tier assessment (T0-T3) and get
>     user approval before proceeding. "Unfamiliar territory" excludes
>     directories touched in the last 5 sessions (check `git log`). "Beyond
>     training cutoff" applies to API/integration questions, not all
>     implementation. T0/T1 research is invisible to the user.
>     `[BEHAVIORAL: no automated enforcement]`

**Done when:** Guardrail #15 exists in CLAUDE.md Section 4 with enforcement
annotation.

### Step 1.6: Unify Confidence Labels Across 4 Core Systems

Per D7. Update each system to use HIGH/MEDIUM/LOW/UNVERIFIED labels while
keeping per-system assignment rules.

**Files to update:**

1. `.claude/skills/deep-research/SKILL.md` and `REFERENCE.md` — verify labels
   match (likely already compliant)
2. `.claude/skills/deep-plan/SKILL.md` and `REFERENCE.md` — add confidence label
   section (currently has no formalized scale)
3. `.planning/plan-orchestration/CL-PROTOCOL.md` — verify labels match; clarify
   that CONFIRMED/WEAKENED/FALSE-POSITIVE are finding status labels (separate
   from confidence)
4. `.claude/skills/convergence-loop/SKILL.md` — add label mapping from numeric
   confidence score to standard labels

**Done when:** All 4 systems reference the unified label set. Each system's
assignment criteria documented in RDS-PROTOCOL.md (Step 1.1).

### Step 1.7: Update CLAUDE.md Section 7 Trigger Table

Per DIAGNOSIS. Add R&D tier-aware trigger.

**Add to PRE-TASK table:**

| Trigger                       | Action                               | Tool     |
| ----------------------------- | ------------------------------------ | -------- |
| Research/investigation needed | Assess tier (T0-T3), present to user | Per tier |

**Add to Section 8 reference table:**

| Document                        | Purpose                                |
| ------------------------------- | -------------------------------------- |
| RDS-PROTOCOL.md                 | Research tier model, confidence labels |
| RDS-TOOLS+TEAMS.md              | Tool/agent selection per tier          |
| RDS-VERIFICATION+ENFORCEMENT.md | Verification rules, enforcement        |

**Done when:** Section 7 has R&D trigger entry, Section 8 references all 3 RDS
docs.

### Phase 1 Audit Checkpoint

Run `code-reviewer` on all new/modified files from Steps 1.1-1.7. Verify:

- [ ] 3 protocol docs exist at `.canon/ecosystems/research-discovery/`
- [ ] T19 expanded in tenets.jsonl
- [ ] Guardrail #15 in CLAUDE.md Section 4
- [ ] All 4 core systems reference unified confidence labels
- [ ] CLAUDE.md Sections 7 and 8 updated

---

## Phase 2: Hook Detection & Persistence (Session 3)

**Goal:** Add automated research detection to hooks and structured artifact
persistence to CL-PROTOCOL.

### Step 2.1: Add Research Detection to user-prompt-handler.js

Per D10. Add Priority 5.5 between Planning (#5) and Exploration (#6).

**File:** `.claude/hooks/user-prompt-handler.js`

**Implementation (~30 lines):**

```javascript
// === 5.5 RESEARCH DETECTION ===
if (!directiveEmitted) {
  const researchStrong = ["research", "investigate", "compare approaches"];
  const researchPhrases = [
    "what are the options",
    "best practice for",
    "how should we approach",
  ];
  const researchWeak = ["explore alternatives", "look into"];

  const hasStrong = researchStrong.some((p) => matchesWord(p));
  const hasPhrase = researchPhrases.some((p) => matchesPhrase(p));

  if (hasStrong || hasPhrase) {
    // Research REPLACES planning suggestion (per D10)
    emitDirective(
      "PRE-TASK: Assess research tier (T0-T3). " +
        "Consider /deep-research for domain investigation"
    );
  } else if (researchWeak.some((p) => matchesPhrase(p))) {
    suggestStderr(
      "Hint: Consider assessing research tier — " +
        "this may benefit from /deep-research"
    );
  }
}
```

**Behavior:** When research AND planning both trigger, research wins (research
`emitDirective` fires first at Priority 5.5, `directiveEmitted` flag prevents
Priority 5 from firing).

**Done when:** Hook exists, tests pass, research keywords trigger correctly,
planning is suppressed when research fires.

### Step 2.2: Write Tests for Research Detection Hook

Per D20. Unit tests for the new hook section.

**File:** `tests/hooks/user-prompt-handler.test.ts`

**Test cases:**

1. "research this topic" → emits research directive
2. "what are the options for X" → emits research directive
3. "look into Y" → stderr hint only
4. "implement a new feature" → planning fires, NOT research
5. "research and implement" → research fires, planning suppressed
6. Dedup: second identical prompt within 4hr window → no repeat
7. Short prompts (<30 chars with research keyword) → still triggers

**Done when:** All 7 test cases pass.

### Step 2.3: Implement CL-PROTOCOL Artifact Persistence

Per D5, D6. Add JSONL persistence to CL-PROTOCOL.

**Artifact path:** `.planning/<plan>/cl-runs.jsonl`

**Schema (one line per phase step):**

```jsonc
{
  "plan": "<plan-slug>",
  "phase": "D1|D2|D3|D4|V1|V2|V3|V4",
  "timestamp": "ISO-8601",
  "agent_count": 4,
  "findings_count": 12,
  "confidence_distribution": { "HIGH": 8, "MEDIUM": 3, "LOW": 1 },
  "contrarian_changes_pct": 15,
  "status": "complete|partial|failed",
}
```

**Implementation:** Update CL-PROTOCOL.md to specify that each phase writes a
JSONL entry after completion. The orchestrator (whoever runs CL) appends to the
file.

**Done when:** CL-PROTOCOL.md updated with persistence spec. Zod schema written
(Step 2.4).

### Step 2.4: Write Zod Schemas

Per D16. Schemas for machine-consumed R&D files.

**Files to create:**

1. `scripts/schemas/research-metadata.schema.ts` — validates
   `.research/<slug>/metadata.json`
2. `scripts/schemas/research-index.schema.ts` — validates
   `.research/research-index.jsonl` entries
3. `scripts/schemas/cl-runs.schema.ts` — validates
   `.planning/<plan>/cl-runs.jsonl` entries

**Constraint (D16):** Apply to new files only. Update existing files only if the
schema change is non-breaking (existing files validate without modification).

**Done when:** 3 Zod schemas exist, validate against current files (or new files
if existing don't conform). Unit tests pass.

### Step 2.5: Write Tests for Zod Schemas

Per D20.

**File:** `tests/schemas/research-schemas.test.ts`

**Test cases:**

1. Valid metadata.json passes
2. Missing required field fails
3. Invalid confidence value fails
4. Valid research-index.jsonl entry passes
5. Valid cl-runs.jsonl entry passes
6. Non-breaking: existing `.research/` files validate (or document exceptions)

**Done when:** All tests pass.

### Phase 2 Audit Checkpoint

Run `code-reviewer` on Steps 2.1-2.5. Verify:

- [ ] Hook Priority 5.5 exists and fires correctly
- [ ] Planning suppressed when research fires
- [ ] CL-PROTOCOL.md updated with persistence spec
- [ ] 3 Zod schemas exist and validate
- [ ] All tests pass

---

## Phase 3: Agent & Tool Deployment (Session 4)

**Goal:** Deploy Context7 to research-relevant agents, create
development-team.md, and investigate additional external resources.

### Step 3.1: Deploy Context7 to 9 Agents

Per D12. Add `mcp__context7__resolve-library-id` and `mcp__context7__query-docs`
to tool lists.

**Agents to update:**

1. `.claude/agents/explore.md`
2. `.claude/agents/plan.md`
3. `.claude/agents/code-reviewer.md`
4. `.claude/agents/security-auditor.md`
5. `.claude/agents/frontend-developer.md`
6. `.claude/agents/documentation-expert.md`
7. `.claude/agents/test-engineer.md`
8. `.claude/agents/dependency-manager.md`
9. `.claude/agents/global/deep-research-searcher.md` (verify already present)

**Steps 3.1a-3.1i can run in parallel** (each agent file is independent).

**Done when:** All 9 agents have Context7 in their tool lists. Verified by grep.

### Step 3.2: Create development-team.md

Per D13. Close the CLAUDE.md Section 7 compliance gap.

**File:** `.claude/teams/development-team.md`

**Contents:**

- 2 members: implementer (opus) + reviewer (sonnet)
- Spawn trigger: "Multi-file feature (3+ files)" per CLAUDE.md Section 7
- **Marked EXPERIMENTAL** — requires controlled experiments before routine use
- Gate: run 3-5 controlled experiments comparing team vs solo before removing
  experimental flag
- Note: teams in general need focused research to maximize value (per D13
  forward finding)

**Done when:** File exists, marked experimental, CLAUDE.md Section 7 reference
is accurate.

### Step 3.3: Update research-plan-team.md Model Override

Per D14. Add T3-specific opus override for verifier role.

**File:** `.claude/teams/research-plan-team.md`

**Change:** Add to "Model Override Rule" section (or create one, similar to
CL-PROTOCOL.md's override pattern):

> When spawned for T3 campaigns, upgrade verifier to opus. Keep mixed model
> routing (sonnet researcher, opus planner, sonnet verifier) for T2.

**Done when:** Override documented in research-plan-team.md.

### Step 3.4: Investigate External Resources

Per D12a. Research additional MCP servers and external tools that could augment
R&D capabilities.

**Primary candidates:**

1. **Sequential Thinking MCP** — problem decomposition tool. Zero invocations
   ever. Assess: does it add value for T2 research decomposition beyond native
   reasoning?
2. **Any new MCP servers** since last audit — check Claude Code marketplace /
   plugin ecosystem
3. **Brave Search MCP** — assess if it offers advantages over built-in WebSearch

**Method:** T1 investigation (quick lookup for each candidate). If any warrant
deeper investigation, document for future T2 research.

**Output:** Section added to RDS-TOOLS+TEAMS.md documenting assessed candidates
with verdict (adopt / experiment / reject) and rationale.

**Done when:** At least 3 candidates assessed, verdicts documented.

### Step 3.5: Move CL-PROTOCOL Under R&D Governance

Per D5. The canonical copy moves; plan-orchestration references it.

**Actions:**

1. Copy `.planning/plan-orchestration/CL-PROTOCOL.md` to
   `.canon/ecosystems/research-discovery/CL-PROTOCOL.md`
2. Replace the original with a pointer:
   `See .canon/ecosystems/research-discovery/CL-PROTOCOL.md`
3. Update any other references (passive-surfacing, propagation, CLI tools,
   statusline plans)

**Done when:** Canonical copy at new location, all references updated, no broken
links.

### Phase 3 Audit Checkpoint

Run `code-reviewer` on Steps 3.1-3.5. Verify:

- [ ] 9 agents have Context7
- [ ] development-team.md exists and is marked experimental
- [ ] research-plan-team.md has T3 opus override
- [ ] External resource investigation documented
- [ ] CL-PROTOCOL moved, all references updated

---

## Phase 4: CANON Registration & Testing (Sessions 5-6)

**Goal:** Register R&D as a CANON ecosystem, build health checker and
enforcement manifest, write tests, and formally amend D67.

### Step 4.1: Write Health Checker

Per D18. Node.js script following CANON health checker pattern.

**File:** `scripts/health/check-research-discovery.js`

**Checks:**

1. Confidence labels consistent across 4 core systems (grep for non-standard
   labels in SKILL.md files)
2. `.research/research-index.jsonl` validates against Zod schema
3. CL-PROTOCOL artifact files exist for plans with CL phases defined
4. CLAUDE.md Section 7 includes R&D trigger entry
5. T19 expanded wording present in tenets.jsonl
6. Context7 in expected 9 agent tool lists
7. Hook Priority 5.5 exists in user-prompt-handler.js
8. **Retroactive scan:** Check existing `.research/` metadata.json files and
   CL-PROTOCOL outputs against schemas. Flag non-compliant with repair commands.

**Output format:** Standard health checker JSON (per T5 contract):

```jsonc
{
  "ecosystem": "research-discovery",
  "status": "PASS|WARN|FAIL",
  "checks": [
    { "name": "confidence-labels", "status": "PASS|FAIL", "detail": "..." },
    // ...
  ],
  "retroactive": {
    "scanned": 4,
    "compliant": 2,
    "non_compliant": 2,
    "repairs": ["..."],
  },
}
```

**Done when:** Health checker runs, all 8 checks execute, retroactive scan
produces actionable output.

### Step 4.2: Write Health Checker Tests

Per D20.

**File:** `tests/health/check-research-discovery.test.ts`

**Test cases:**

1. All checks pass on compliant codebase
2. Missing confidence label detected
3. Invalid research-index entry detected
4. Missing Context7 in agent detected
5. Retroactive scan finds and reports non-compliant files
6. Repair suggestions are actionable (not generic)

**Done when:** All tests pass.

### Step 4.3: Write Enforcement Manifest

Per D19. Declarative manifest (per T17 `declarative_over_imperative`).

**File:** `.canon/ecosystems/research-discovery/enforcement.jsonl`

**Entries (one per gate):**

```jsonc
{"gate": "pre-commit", "check": "confidence-vocab", "severity": "warn", "description": "New .research/ files use HIGH/MEDIUM/LOW/UNVERIFIED labels"}
{"gate": "health-checker", "check": "full-suite", "severity": "block", "description": "All 8 health checks + retroactive scan"}
{"gate": "code-reviewer", "check": "tier-annotations", "severity": "suggest", "description": "New skills/agents include R&D tier context"}
{"gate": "session-start", "check": "stale-research", "severity": "warn", "description": "Flag research campaigns older than 30 sessions"}
```

**Done when:** Manifest exists, 4 gates defined, severity levels appropriate.

### Step 4.4: Register in CANON Ecosystem Registry

Per D3, D22. Register R&D at L3 (Monitored).

**File:** `.canon/ecosystems.jsonl` (append)

```jsonc
{
  "key": "research-discovery",
  "name": "Research & Discovery",
  "maturity": "L3",
  "target": "L3",
  "owner": "R&D protocol docs",
  "health_checker": "scripts/health/check-research-discovery.js",
  "enforcement": ".canon/ecosystems/research-discovery/enforcement.jsonl",
  "docs": [
    ".canon/ecosystems/research-discovery/RDS-PROTOCOL.md",
    ".canon/ecosystems/research-discovery/RDS-TOOLS+TEAMS.md",
    ".canon/ecosystems/research-discovery/RDS-VERIFICATION+ENFORCEMENT.md",
    ".canon/ecosystems/research-discovery/CL-PROTOCOL.md",
  ],
}
```

**Depends on:** `.canon/ecosystems.jsonl` existing (SWS Phase 1 Step 1.1 creates
it). If it doesn't exist yet, create the entry in a staging file and note the
dependency.

**Done when:** Entry exists (in registry or staging file).

### Step 4.5: ~~Amend D67 in SWS decisions.jsonl~~ DONE

**Completed during deep-plan session (Session #238).** DA-1 appended to
`.planning/system-wide-standardization/decisions.jsonl`, coordination.json
updated, plan orchestrator updated with Step 17.5 reference.

### Step 4.6: Write Forward Findings

Per DECISIONS.md forward findings table. Write to
`.claude/state/forward-findings.jsonl`.

**Entries:**

1. Teams need focused research before standardization → Agents/Teams ecosystem
2. Retroactive compliance scanning is a CANON-global pattern → CANON Foundation
3. Global enforcement layer for all ecosystem health checkers → CANON Foundation
4. Sequential Thinking MCP investigation → float work

**Done when:** 4 entries appended to forward-findings.jsonl.

### Phase 4 Audit Checkpoint

Run `code-reviewer` on all Phase 4 files. Then run the health checker itself
(Step 4.1) against the codebase as an integration test.

**Final verification checklist:**

- [ ] Health checker runs and reports status
- [ ] All tests pass (hook, schema, health checker, CL-PROTOCOL)
- [ ] Enforcement manifest has 4 gates
- [ ] CANON registry entry exists (or staged)
- [ ] D67 amendment recorded
- [ ] Forward findings written
- [ ] `git status` — no untracked files missing
- [ ] All 3 protocol docs complete and cross-referenced

---

## Parallelization Guide

| Steps              | Can Parallelize?                  | Notes                                         |
| ------------------ | --------------------------------- | --------------------------------------------- |
| 1.1, 1.2, 1.3      | YES                               | 3 protocol docs are independent               |
| 1.4, 1.5, 1.6, 1.7 | YES                               | CLAUDE.md, tenets, system updates independent |
| 2.1 + 2.2          | SEQUENTIAL                        | Tests depend on hook code                     |
| 2.3 + 2.4 + 2.5    | 2.3→2.4 sequential, 2.5 after 2.4 | Schema depends on persistence spec            |
| 3.1a-3.1i          | YES (all parallel)                | Each agent file is independent                |
| 3.2, 3.3, 3.4, 3.5 | YES                               | Independent files/concerns                    |
| 4.1 + 4.2          | SEQUENTIAL                        | Tests depend on health checker                |
| 4.3, 4.4, 4.5, 4.6 | YES                               | Independent CANON artifacts                   |

---

## Risk Register

| Risk                                            | Likelihood | Impact | Mitigation                                                                                  |
| ----------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------- |
| `.canon/` directory doesn't exist yet (Phase 1) | HIGH       | MEDIUM | Create `.canon/ecosystems/research-discovery/` early; CANON registry entry staged if needed |
| Existing .research/ files don't validate        | MEDIUM     | LOW    | D16: schemas apply to new files only; retroactive scan flags but doesn't block              |
| Hook keyword false positives                    | LOW        | LOW    | Conservative keyword set + dedup + user can dismiss                                         |
| CL-PROTOCOL move breaks references              | MEDIUM     | MEDIUM | Grep all references before move, update atomically                                          |
| 4-6 session estimate too optimistic             | LOW        | LOW    | Phases are independent enough to pause/resume                                               |
