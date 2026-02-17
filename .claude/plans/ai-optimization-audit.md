# AI Optimization Audit Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-13
**Status:** DRAFT
<!-- prettier-ignore-end -->

## Summary

A comprehensive audit of the sonash-v0 project's files, formats, processes,
workflows, hooks, skills, and scripts to identify opportunities for improving AI
performance. The audit produces a scored findings.jsonl that the user reviews
case-by-case before any changes are made. No implementation decisions are
pre-baked — the audit gathers evidence, the user decides what to act on.

## Scope

Seven parallel audit domains, each producing scored findings:

1. **Format audit** — MD files with structured data that could be JSONL/JSON
2. **Dead doc audit** — Docs never referenced by any script, hook, skill, or doc
3. **Dead script audit** — Scripts not called by anything
4. **Hook efficiency audit** — Duplicate hooks, execution overhead, state sprawl
5. **Skill overlap audit** — Skills with overlapping functionality
6. **AI instruction bloat audit** — Token waste from per-doc AI Instructions
7. **Fragile parsing audit** — Regex-based markdown parsing in hooks/scripts

## Decision Record (from Discovery Q&A)

These decisions scope the audit — they do NOT pre-decide what to change:

| Decision            | Choice                                                           |
| ------------------- | ---------------------------------------------------------------- |
| Primary goal        | All equally (token efficiency + parsing accuracy + task speed)   |
| Audit scope         | Everything — files, formats, processes, workflows, hooks, skills |
| Hook scope          | Include hooks in audit                                           |
| Output format       | JSONL findings + summary markdown for case-by-case review        |
| User decision model | Case-by-case — user reviews each finding before action           |

## Output Schema

Each finding in `docs/audits/single-session/ai-optimization/findings.jsonl`:

```json
{
  "id": "OPT-XXXX",
  "category": "format|dead-doc|dead-script|hook|skill|ai-instructions|parsing",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "title": "Short title",
  "description": "What was found and why it matters",
  "file": "path/to/affected/file",
  "currentState": "What exists now",
  "recommendation": "Suggested improvement (user decides)",
  "impact": "tokens|accuracy|speed|all",
  "evidence": "How this was determined (references, measurements)"
}
```

## Audit Steps

### Step 1: Format Audit

Scan all markdown files for structured/tabular data. For each, score:

- Size (larger = more tokens wasted)
- Update frequency (more updates = more parsing)
- Parsing fragility (regex used to read it?)
- AI read frequency (read every session vs rarely)

**Targets**: All .md files in docs/, root, .claude/ containing tables,
checklists, status tracking, or decision logs.

### Step 2: Dead Doc Audit

Cross-reference every file in docs/ against:

- All scripts (grep for filename references)
- All hooks (.claude/hooks/\*.js)
- All skills (.claude/skills/\*/SKILL.md)
- All other docs (cross-references)
- package.json scripts
- CI workflows (.github/workflows/\*.yml)

Any doc with zero references is flagged. Docs in docs/archive/ are bulk-checked.

### Step 3: Dead Script Audit

Cross-reference every file in scripts/ against:

- package.json scripts section
- .claude/settings.json hook commands
- .github/workflows/\*.yml
- .claude/skills/\*/SKILL.md
- Other scripts (require/import chains)

### Step 4: Hook Efficiency Audit

Analyze .claude/settings.json for:

- Duplicate hook arrays (Write/Edit/MultiEdit share identical hooks)
- Total hook count per event type
- State file sprawl (.claude/state/ files created by hooks)
- Potential consolidation opportunities

### Step 5: Skill Overlap Audit

Compare all 52+ skills for:

- Description similarity
- Shared input/output patterns
- Skills that are deprecated but not removed
- Skills with empty/placeholder descriptions in registry

### Step 6: AI Instruction Bloat Audit

For every document with an "AI Instructions" section:

- Measure token count of the section
- Check for redundancy with other docs' instructions
- Check if instructions are actually followed by automation
- Identify instructions that could be centralized

### Step 7: Fragile Parsing Audit

Scan all hooks and scripts for:

- Regex patterns that parse markdown structure
- Hardcoded heading/table format assumptions
- Points where a markdown format change would break functionality
- Score each by fragility (how likely to break)

## Execution

- Steps 1-7 run as parallel subagents
- Each produces findings in the shared JSONL schema
- Results merged into single
  `docs/audits/single-session/ai-optimization/findings.jsonl`
- Summary markdown generated for human review
- User reviews findings case-by-case and decides what to act on
- Accepted findings go to TDMS; deferred findings stay in the audit report

## What Happens After the Audit

The user reviews findings and for each one decides:

- **Act now** — implement the recommendation (goes to TDMS as actionable)
- **Defer** — good idea but not now
- **Reject** — not worth doing
- **Modify** — adjust the recommendation before acting

No changes are made until the user explicitly approves each finding.
