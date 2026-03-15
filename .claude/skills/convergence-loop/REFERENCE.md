# Convergence Loop — Reference

Companion to SKILL.md. Contains detailed behavior definitions, domain slicing
templates, agent prompt templates, and example configurations.

---

## 1. Behavior Definitions

**Required output format (all behaviors):** Agents MUST report findings as:
`[CLAIM_ID] [STATUS: Confirmed|Corrected|Extended|New] [EVIDENCE: brief citation]`
For Corrected: include original and corrected text.

### source-check (Loop 0)

**Purpose:** Verify claims against their cited source material before any
analysis. Catches stale or fabricated claims early.

**Agent instruction:**
> You are a verification agent in a convergence loop. Your role is to verify
> claims against their cited source material.
> Read the cited source for each claim in your slice. For each: does the source
> actually say what the claim says? Report using the required output format.
> Confirmed (source matches), Corrected (source says something different —
> provide correct version), Extended (source says more than claimed), New
> (source contains relevant information not captured in any claim).

**When to use:** First pass of `standard` and `thorough` presets. Any time
claims reference specific files, documents, or data.

### discovery

**Purpose:** Find NEW issues not in the original claims set. Agents actively
look for problems, gaps, and uncovered areas.

**Agent instruction:**
> You are a discovery agent in a convergence loop. Your role is to find issues
> the existing claims MISSED.
> Review your domain slice. You have the existing claims for context, but your
> PRIMARY goal is to find things the claims MISSED. Look for: uncovered files,
> undocumented behaviors, edge cases, contradictions, patterns that should be
> flagged but aren't. Report using the required output format. New findings
> separately from confirmations.

**When to use:** Early passes in `thorough` preset. When the claims set might be
incomplete (e.g., initial audit findings, first-draft diagnoses).

### verification

**Purpose:** Confirm or correct existing claims. Agents focus on accuracy of
what's already claimed, not finding new things.

**Agent instruction:**
> You are a verification agent in a convergence loop. Your role is to confirm or
> correct existing claims for accuracy.
> Verify each claim in your slice against the codebase/documentation. Report
> using the required output format. Confirmed (claim is accurate as stated),
> Corrected (claim is inaccurate — provide correction with evidence), Extended
> (claim is accurate but incomplete — provide additions). You ALSO receive prior
> pass corrections — verify those corrections are themselves correct.

**When to use:** Middle passes. The workhorse behavior for convergence.

### fresh-eyes

**Purpose:** Independent verification with zero prior context. Agents receive
ONLY the claims and source material — no prior pass results, no corrections, no
tallies.

**Agent instruction:**
> You are a fresh-eyes verification agent in a convergence loop. Your role is to
> independently verify claims with ZERO prior context.
> You are verifying these claims with NO prior context. You do not know what
> previous passes found. Read the claims, check them against reality, report
> using the required output format. If your findings match the current claims
> set exactly, convergence is confirmed.

**When to use:** Final pass. The gold standard — if fresh-eyes finds nothing new,
the claims are trustworthy.

### write-then-verify

**Purpose:** Produce an output artifact and verify it in the same pass. Used when
the convergence loop's purpose is to CREATE something accurate, not just verify
existing claims.

**Agent instruction:**
> You are a write-then-verify agent in a convergence loop. Your role is to
> produce output and then have it independently verified.
> Phase A: Write/produce the requested output based on the claims and source
> material. Phase B: A DIFFERENT agent verifies the output against the claims
> and sources. Report using the required output format.

**When to use:** Plan writing, document generation, migration scripts — any task
where the loop produces an artifact.

### fix-and-re-verify

**Purpose:** Apply corrections found mid-pass and re-verify without starting a
new full pass. Avoids wasting a full pass on known fixes.

**Agent instruction:**
> You are a fix-and-re-verify agent in a convergence loop. Your role is to
> apply corrections and verify they are themselves correct.
> These corrections were found earlier in this pass: [corrections]. Apply them
> to the claims set. Now verify the CORRECTED claims — are the fixes themselves
> correct? Report using the required output format. Confirmed (fix is good),
> Corrected (fix was wrong — provide better fix). This does NOT count as a new
> pass.

**When to use:** When a pass finds <5 corrections that are clearly fixable.
If corrections are numerous or complex, prefer a new full pass.

---

## 2. Domain Slicing Templates

### code-by-file

Split claims by the files they reference. Each agent gets claims about a
distinct set of files.

```
Agent 1: claims about src/components/**
Agent 2: claims about src/lib/**
Agent 3: claims about scripts/**
Agent 4: claims about .claude/hooks/**
```

**Best for:** Code audits, pattern compliance, refactoring verification.

### code-by-concern

Split claims by the TOPIC they address, regardless of files.

```
Agent 1: security-related claims
Agent 2: performance-related claims
Agent 3: architecture-related claims
Agent 4: testing-related claims
```

**Best for:** Multi-domain audits, comprehensive reviews.

### doc-by-section

Split claims by document sections or document groups.

```
Agent 1: claims about ROADMAP.md + SESSION_CONTEXT.md
Agent 2: claims about CLAUDE.md + CODE_PATTERNS.md
Agent 3: claims about planning docs (.planning/**)
Agent 4: claims about technical debt docs
```

**Best for:** Documentation sync, staleness checks, cross-doc consistency.

### claims-by-category

Split claims by their category or severity tag.

```
Agent 1: S0 + S1 claims (critical/high)
Agent 2: S2 claims (medium)
Agent 3: S3 claims (low)
```

**Best for:** TDMS verification, audit finding validation.

### findings-by-severity

Split findings with critical items getting MORE agents for deeper verification.

```
Agent 1+2: S0 findings (two independent agents for cross-check)
Agent 3: S1 findings
Agent 4: S2+S3 findings
```

**Best for:** Security audits, high-stakes verification where critical findings
need extra scrutiny.

### custom

Caller defines their own slicing. Provide a JSON mapping:
```json
{
  "agent_1": { "label": "Phase 0 claims", "filter": "claims 1-12" },
  "agent_2": { "label": "Phase 1 claims", "filter": "claims 13-30" }
}
```

---

## 3. T20 Tally Format

### Per-Pass Tally

```
Pass N (behavior: verification, agents: 3):
  Confirmed: 18 | Corrected: 3 | Extended: 2 | New: 1
  Graduated: 15 (cumulative)
  Remaining: 9
  Convergence: NOT_CONVERGED (3 corrections)
```

### Cumulative Tally

```
Total across N passes:
  Original claims: 24
  Final claims: 26 (+2 new discoveries)
  Corrections applied: 4
  Extensions applied: 3
  Graduated (stable): 26/26
  Convergence: ACHIEVED at Pass 3
```

---

## 4. Example Configurations

### Standard Preset (expanded)

```
Topic: "Verify DIAGNOSIS-v2.md claims"
Input: .planning/system-wide-standardization/DIAGNOSIS-v2.md
Slicing: doc-by-section
Agents: 4
Sequence:
  Pass 1: source-check (verify claims against cited files)
  Pass 2: verification (confirm/correct with full context)
  Pass 3: fresh-eyes (independent final check)
Max passes: 3
```

### Quick Preset (expanded)

```
Topic: "Verify 5 code review findings"
Input: inline claims from conversation
Slicing: claims-by-category
Agents: 2
Sequence:
  Pass 1: verification
  Pass 2: verification
Max passes: 2
```

### Thorough Preset (expanded)

```
Topic: "SWS PLAN-v3.md content verification"
Input: .planning/system-wide-standardization/PLAN-v3.md
Slicing: doc-by-section (6 sections = 5 agents + 1 cross-cutting)
Agents: 6
Sequence:
  Pass 1: source-check (verify against DECISIONS.md, child plans)
  Pass 2: discovery (find missing content, orphaned references)
  Pass 3: verification (confirm corrections from Pass 1-2)
  Pass 4: verification (re-verify if Pass 3 had corrections)
  Pass 5: fresh-eyes (independent final)
Max passes: 5
```

### Custom Example: Decision Tagging

```
Topic: "Tag 125 SWS decisions with affected phases"
Input: decisions-phase-map.json
Slicing: claims-by-category (D1-D92, Q1-Q38)
Agents: 2
Sequence:
  Pass 1: source-check + discovery (read PLAN-v3.md, tag decisions)
  Pass 2: verification (independent agent verifies all tags)
  Pass 3: fresh-eyes (if Pass 2 had corrections)
Max passes: 3
```

### Custom Example: Skill Audit Discovery

```
Topic: "Discover quality issues in /session-end skill"
Input: .claude/skills/session-end/SKILL.md
Slicing: code-by-concern (structure, behavior, integration, attention)
Agents: 4
Sequence:
  Pass 1: discovery (each agent examines one concern domain)
  Pass 2: verification (agents cross-check each other's findings)
Max passes: 3
```

---

## 5. Report Template

### Convergence Report: {topic}

**Configuration:** {preset} preset, {N} agents, {slicing} slicing

**Summary:**

| Pass | Behavior | Agents | Confirmed | Corrected | Extended | New | Graduated |
|------|----------|--------|-----------|-----------|----------|-----|-----------|
| 1    | ...      | ...    | ...       | ...       | ...      | ... | ...       |

**Convergence:** {ACHIEVED at Pass N / NOT ACHIEVED after N passes}

**Claims Delta:**

| # | Claim | Status | Original | After | Evidence | Pass |
|---|-------|--------|----------|-------|----------|------|
| 1 | ...   | CORRECTED | "was X" | "is Y" | file:line | 2 |

**Unresolved** (if any):

| # | Claim | Issue | Agent Positions |
|---|-------|-------|-----------------|

---

## 6. Integration Notes

### /skill-creator Integration (Q14)

**Validation phase** (Phase 5): After writing SKILL.md, run a `quick` convergence
loop on the skill's claims (does it do what it says?). Two agents verify: one
checks SKILL.md internal consistency, one checks against REFERENCE.md and
codebase reality.

**Planning phase** (Phase 3): Add question to discovery: "Does this skill's
workflow involve claims verification, multi-agent discovery, or iterative
refinement? If yes, design convergence-loop integration."

### /skill-audit Integration (Q15 + T25)

**Appropriateness check**: New quality dimension — "Given this skill's purpose,
should it use convergence loops? If it has a discovery phase, T25 says yes."

**Implementation quality**: If skill uses convergence loops, check: Does it
follow the T20 tally? Does it have min 2 passes? Does it gate convergence
with user approval?

**Self-application**: Skill-audit's OWN discovery phase MUST use a `quick`
convergence loop to verify its findings before presenting to user.

---

## 6. State File Schema

**Path:** `.claude/state/convergence-loop-{topic}.state.json`

```json
{
  "topic": "verify-diagnosis-v2",
  "status": "in_progress",
  "preset": "standard",
  "sequence": ["source-check", "verification", "fresh-eyes"],
  "max_passes": 3,
  "agents": 4,
  "slicing": "doc-by-section",
  "input_claims_count": 24,
  "confidence": null,
  "passes": [
    {
      "number": 1,
      "behavior": "source-check",
      "tally": { "confirmed": 18, "corrected": 3, "extended": 2, "new": 1 },
      "graduated": 15,
      "corrections": [
        { "claim_id": "C3", "original": "...", "corrected": "...", "evidence": "file:line" }
      ],
      "timestamp": "2026-03-15T20:00:00Z"
    }
  ],
  "current_pass": {
    "number": 2,
    "behavior": "verification",
    "agent_outputs": ["full output from each agent..."],
    "started": "2026-03-15T20:15:00Z"
  },
  "graduated_claims": ["C1", "C2", "C4", "C5"],
  "unconverged_claims": ["C3", "C7"],
  "disagreements": [],
  "created": "2026-03-15T19:45:00Z",
  "updated": "2026-03-15T20:15:00Z"
}
```

---

## 7. Prompt Customization Hook

Callers can inject domain-specific instructions into agent prompts by providing
a `custom_instructions` string. This is appended to the behavior's standard
prompt template.

**Usage:**
```
custom_instructions: "When checking security claims, also verify CVE references
against the NVD database. Flag any claims referencing CVEs older than 2 years."
```

The custom instructions are appended AFTER the standard behavior prompt and
BEFORE the output format requirement. This allows callers to add domain context
without modifying the core behavior.

**When to use:** When the standard behavior prompts are too generic for the
domain. Common customizations:
- Security audits: CVE verification, OWASP reference checking
- Performance claims: benchmark methodology verification
- Architecture claims: dependency graph validation
- Documentation claims: cross-reference checking against specific standards
