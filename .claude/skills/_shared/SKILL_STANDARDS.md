# Skill Standards

<!-- prettier-ignore-start -->
**Document Version:** 3.0
**Last Updated:** 2026-04-04
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Canonical structural and quality standards for all skills in `.claude/skills/`.
Referenced by `skill-creator`, `skill-ecosystem-audit`, and all skill
maintenance workflows.

---

## Required Sections

Every SKILL.md MUST include these sections (enforced by ecosystem audit):

### 1. YAML Frontmatter

```yaml
---
name: skill-name
description: >-
  Brief description of what this skill does (1-3 sentences).
---
```

### 2. When to Use

```markdown
## When to Use

- Specific trigger conditions
- User invokes `/skill-name`
```

### 3. When NOT to Use

```markdown
## When NOT to Use

- When task X applies -- use `/other-skill` instead
- When a more specialized skill exists
```

### 4. Version History (at end of file)

```markdown
## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | YYYY-MM-DD | Initial implementation |
```

---

## Attention Management

LLMs exhibit primacy bias — instructions at the top of a skill get more
attention than instructions at the bottom. Skills MUST be structured to account
for this:

1. **Front-load critical rules.** MUST-do behaviors, phase structure, and hard
   requirements go in the first third of the file.
2. **Use checklists over prose.** A 5-item numbered list holds attention better
   than 5 paragraphs explaining the same things.
3. **Repeat critical rules at point-of-use.** If "always write ARTIFACT.md"
   matters in Phase 2, say it in Phase 2 — don't rely on a single mention in the
   overview.
4. **Keep the core skill lean.** Move examples, templates, and reference
   material to companion files. The core should contain WHAT to do; companions
   show HOW with examples.

---

## Instruction Hierarchy

Use MUST/SHOULD/MAY (RFC 2119 style) to distinguish requirement levels:

| Keyword    | Meaning                                            |
| ---------- | -------------------------------------------------- |
| **MUST**   | Non-negotiable requirement. Violation = failure.   |
| **SHOULD** | Strong recommendation. Skip only with good reason. |
| **MAY**    | Optional behavior. Use judgment.                   |

Every instruction in a skill should be classifiable as one of these. If an
instruction reads at the same "volume" as everything else, it will be treated as
optional regardless of intent.

---

## Size Limits

| Threshold | Action                                   |
| --------- | ---------------------------------------- |
| < 300     | Good -- no action needed                 |
| 300-499   | Warning -- consider extracting content   |
| 500+      | Error -- must extract to companion files |

### Extraction Strategy

When a skill approaches 300 lines, extract content to companion files in the
same skill directory:

```
skill-name/
├── SKILL.md          # Core instructions (< 300 lines)
├── REFERENCE.md      # Detailed examples, templates, question banks
├── prompts.md        # Agent prompt specifications (if multi-agent)
├── domains.md        # Domain-specific tables/data
├── ARCHIVE.md        # Archived evidence, old version history
└── scripts/          # Executable scripts
```

Reference extracted files from SKILL.md:

```markdown
> Read `.claude/skills/skill-name/REFERENCE.md` for detailed examples and
> templates.
```

---

## Agent Orchestration Standards

### Return Protocol

All agent prompts MUST include:

```
CRITICAL RETURN PROTOCOL: Return ONLY this format:
COMPLETE: [agent-id] wrote N findings to [output-path]
Do NOT return full findings content.
```

### Dependency Documentation

Skills with parallel execution MUST document constraints:

```markdown
**Dependency constraints:** All agents in this wave are independent -- no
ordering required. Wave N+1 depends on Wave N completion.
```

---

## Shared Templates

Common boilerplate lives in `.claude/skills/_shared/`:

| Template               | Purpose                                  | Used by                      |
| ---------------------- | ---------------------------------------- | ---------------------------- |
| `AUDIT_TEMPLATE.md`    | Evidence, TDMS intake, review procedures | All audit-\* skills          |
| `SKILL_STANDARDS.md`   | This file -- structural standards        | skill-creator                |
| `ecosystem-audit/*.md` | Shared ecosystem audit protocols         | All 8 ecosystem audit skills |

Audit skills reference the shared template instead of duplicating boilerplate:

```markdown
## Standard Audit Procedures

> Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for: Evidence Requirements,
> Dual-Pass Verification, JSONL Output Format, MASTER_DEBT Cross-Reference,
> Interactive Review, TDMS Intake & Commit, and Honesty Guardrails.
```

Ecosystem audit skills reference shared protocols:

```markdown
> Read `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md` and follow all
> 8 rules.
```

---

## Evidence & Version History Management

- **Version History**: Keep last 5 entries inline. Archive older entries to
  `ARCHIVE.md` in the same skill directory.
- **Evidence blocks**: Keep last 5 citations. Archive older evidence to
  `ARCHIVE.md`.
- **PR/Session references**: Use format `PR #NNN`, `Session #NNN` for
  traceability.

---

## Step Numbering

- Sequential within each section (1, 2, 3...)
- Separate sections may restart numbering (Phase 1 steps, Phase 2 steps)
- Use `Step N.M` for sub-steps (not `Step Nb`)
- No gaps or duplicates within a single logical sequence

---

## Naming Conventions

| Convention | Pattern                   | Example                  |
| ---------- | ------------------------- | ------------------------ |
| Skill name | lowercase-kebab-case      | `audit-code`             |
| Directory  | `.claude/skills/<name>/`  | `.claude/skills/alerts/` |
| Companion  | lowercase with extension  | `prompts.md`             |
| Shared     | `.claude/skills/_shared/` | UPPERCASE filenames      |

---

## Cross-Reference Patterns

- **Skill invocations**: Use `/skill-name` format
- **Descriptive references**: Use backtick `` `skill-name` `` format (for
  parent/related skills that shouldn't be flagged as dependencies)
- **File paths**: Use relative paths from repo root
- **Script references**: Use `node scripts/...` or `npm run ...` format

---

## Integration & Routing

Skills MUST be aware of their neighbors:

- **"When NOT to Use" MUST redirect** to specific alternatives, not just say
  "when a more specialized skill exists." Name the skill.
- **Routing guidance** belongs at the top of skills with close neighbors. If 3+
  skills could plausibly handle the same trigger, the primary skill SHOULD
  include a routing section distinguishing them.
- **Handoff protocols** MUST be explicit. If a skill produces output consumed by
  another skill, document the artifact contract: what files, what paths, what
  format.

---

## Guard Rails & Error Handling

Skills SHOULD address failure modes relevant to their domain:

- What happens with bad input or missing context?
- What if scope grows beyond the skill's boundaries?
- What if the session compacts mid-execution? (especially for long-running
  skills)
- Recovery procedure: how to resume from a partial execution.

For long-running skills (planning, auditing, multi-phase): persist state to
`.claude/state/` and write artifacts to disk incrementally — not just at the
end.

---

## User Experience

Skills that involve multi-step interaction SHOULD include:

- **Warm-up**: Brief orientation at start — what the skill does, what to expect
- **Progress indicators**: "Batch 2 of 3" or "Step 3 of 7" where applicable
- **Visual structure**: Consistent use of `##` headers, `---` dividers, tables,
  bold for emphasis
- **Closure signal**: Explicit completion message listing artifacts produced

---

## Self-Audit at Completion

Standard and Complex skills MUST include a self-audit phase that verifies the
skill's own execution before declaring completion. Simple skills (<50 lines,
reference-only) are exempt — a "Done when:" gate is sufficient.

### Tier Requirements

| Tier                                        | Self-Audit Requirement                                     |
| ------------------------------------------- | ---------------------------------------------------------- |
| **Simple** (<50 lines, no companions)       | "Done when:" gate only. No separate self-audit phase.      |
| **Standard** (50-200 lines, 0-2 companions) | MUST: dimensions 1-5. SHOULD: dimensions 6-9.              |
| **Complex** (200-300 lines, 3+ companions)  | MUST: all 9 dimensions including multi-agent verification. |

### Ordering (MUST)

Self-audit is always the **penultimate phase** — after ALL build/implementation
work, before closure/cleanup. No build work may occur after self-audit. No
cleanup may occur before it. If self-audit finds failures, re-enter Build, fix,
then re-run Self-Audit.

### 9 Verification Dimensions

1. **Completeness** (MUST Standard+) — verify all promised deliverables exist on
   disk. Glob/ls for expected output paths from the planning phase.
2. **Orphan detection** (MUST Standard+) — check that all files created during
   execution are referenced by the skill's output or state. Flag unreferenced
   files as orphans.
3. **Build integrity** (MUST Standard+) — grep output files for `TODO`, `FIXME`,
   `placeholder`, `[TBD]`, and other stub markers. Nothing left unbuilt.
4. **Gap analysis** (MUST Standard+) — compare planning decisions against actual
   output. Each accepted decision MUST map to a deliverable. Decisions with no
   corresponding output are MISSING.
5. **Functional verification** (MUST Standard+) — run scripts in dry-run/check
   mode, validate state file schemas, test key execution paths. A file that
   exists but doesn't work is worse than a missing file.
6. **Multi-agent verification** (SHOULD Standard, MUST Complex) — dispatch a
   `code-reviewer` or `explore` agent to independently verify a sample of
   deliverables. For >15 decisions/outputs, this is MUST regardless of tier.
7. **Regression detection** (SHOULD Standard, MUST Complex) — if a state file
   from a previous run exists, compare current artifact list against the
   previous run's `files_created`. Flag artifacts that existed before but are
   missing now as REGRESSION.
8. **Contract verification** (MUST if downstream consumers exist) — if the
   skill's Integration section lists downstream consumers, verify output
   artifacts match the documented contract (path, format, required fields/
   sections). For JSONL: validate against schema. For MD: verify required
   sections exist.
9. **Partial execution recovery** (SHOULD Standard, MUST Complex) — if the state
   file shows a resume from an earlier phase, check artifacts from pre-resume
   phases for staleness. Verify all agent output files are non-empty (ref:
   CLAUDE.md guardrail #15). Flag artifacts with timestamps older than last
   resume as STALE.

### Base Verification Pattern

These apply to ALL tiers (including Simple via "Done when:" gates):

1. **Re-read all modified/created files** (MUST) — do NOT rely on memory
2. **Grep-based proof** (MUST) — for each required output, grep the file for a
   keyword proving implementation. If grep finds nothing, item is MISSING.
3. **T20 tally** (SHOULD) — categorize results: Confirmed (as expected),
   Corrected (differs from plan), Extended (beyond plan), New (unmapped)
4. **"Done when" gate** (MUST) — self-audit must pass before closure phase

---

## Invocation Tracking

Every skill SHOULD log a single invocation record at completion to
`data/ecosystem-v2/invocations.jsonl` via `scripts/reviews/write-invocation.ts`.
The records feed the ecosystem dashboards and pr-retro analyses.

### Canonical Caller Snippet

```bash
cd scripts/reviews && npx tsx write-invocation.ts --data '{
  "skill": "SKILL_NAME",
  "type": "skill",
  "success": true,
  "schema_version": 1,
  "completeness": "stub",
  "origin": { "type": "manual" },
  "context": { "trigger": "...", "session": "..." }
}'
```

### Required vs Auto-Filled Fields

The writer auto-fills these fields when omitted (so legacy snippets keep
working), but new and modernized snippets SHOULD pass them explicitly:

| Field            | Auto-fill default      | When to override                             |
| ---------------- | ---------------------- | -------------------------------------------- |
| `id`             | `inv-{ts}-{pid}-{seq}` | Never — let the writer assign                |
| `date`           | Today (YYYY-MM-DD)     | Never — let the writer assign                |
| `schema_version` | `1`                    | Bump only when BaseRecord schema changes     |
| `completeness`   | `"stub"`               | `"full"` if all context fields populated     |
| `origin`         | `{ type: "manual" }`   | `{ type: "pr-review", pr: 505 }` for PR work |

The `type` enum on `origin` is
`pr-review | pr-retro | backfill | migration | manual`. Use `manual` for
human-invoked skill runs (the default).

### Required Caller Fields

| Field     | Type                         | Notes                                      |
| --------- | ---------------------------- | ------------------------------------------ |
| `skill`   | string                       | The skill name (matches the slash command) |
| `type`    | `skill` \| `agent` \| `team` | What ran                                   |
| `success` | boolean                      | Whether the invocation completed cleanly   |

### Optional Context Fields

The `context` object accepts a fixed set of keys defined in
`scripts/reviews/lib/schemas/invocation.ts`. Common ones: `trigger`, `session`,
`topic`, `decisions`, `score`, `note`. **Unknown context keys are silently
stripped by Zod** — if a skill needs a new context field, add it to the
`InvocationRecord` schema first.

### Where Defaults Live

The auto-fill logic lives in `scripts/reviews/write-invocation.ts`
(`writeInvocation()`). Schema-of-record is
`scripts/reviews/lib/schemas/invocation.ts` (`InvocationRecord`) which extends
`BaseRecord` from `scripts/reviews/lib/schemas/shared.ts`.

---

## Quality Checklist (for skill-creator)

### Structural Quality

- [ ] YAML frontmatter with name + description
- [ ] "When to Use" section with specific triggers
- [ ] "When NOT to Use" section with named alternatives
- [ ] "Version History" table at end of file
- [ ] Under 300 lines core (extract to companions if needed)
- [ ] Agent prompts include COMPLETE: return protocol (if multi-agent)
- [ ] Parallel execution has dependency constraints documented
- [ ] Cross-references resolve to existing skills/scripts
- [ ] No duplicated boilerplate (use shared templates)

### Behavioral Quality

- [ ] Critical rules front-loaded (top third of file)
- [ ] MUST/SHOULD/MAY hierarchy applied to all instructions
- [ ] Critical rules repeated at point-of-use (not just in overview)
- [ ] Checklists used instead of prose for multi-item requirements
- [ ] "When NOT to Use" redirects to specific named skills
- [ ] Error/failure paths addressed for the skill's domain
- [ ] Long-running skills have compaction resilience (state persistence)
- [ ] Multi-step skills have UX guidance (progress, warm-up, closure)
- [ ] Project conventions referenced (CLAUDE.md), not duplicated
- [ ] Guided prompts used instead of generic `[placeholder]` text
- [ ] Steps/phases have "Done when:" completion criteria
- [ ] Anti-patterns list for common mistakes in the skill's domain
- [ ] Routing guide if 3+ skills share triggers (table format)
- [ ] Warm-up with effort estimate at skill start
- [ ] Approval gates before irreversible actions or phase transitions
- [ ] Post-execution retro prompt (learning loop)
- [ ] MUST (Standard/Complex): Self-audit phase with dimensions 1-5 minimum
- [ ] MUST (Standard/Complex): Self-audit positioned as penultimate phase
- [ ] MUST (if downstream consumers): Contract verification in self-audit
- [ ] SHOULD: Multi-agent verification in self-audit (MUST for Complex)
