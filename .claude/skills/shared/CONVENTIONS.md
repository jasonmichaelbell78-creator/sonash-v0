# Shared Skill Conventions

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Canonical source for conventions shared across the analysis/synthesis skill
family: `/website-analysis`, `/repo-analysis`, `/website-synthesis`,
`/repo-synthesis`. Individual skills reference this file rather than duplicating
these rules.

---

## 1. Phase Transition Markers

All skills MUST use this exact format for phase boundaries:

```
========== PHASE N: [NAME] ==========
```

Where N is the phase number (decimals like 2.5 are permitted) and NAME is the
phase title in ALL CAPS.

---

## 2. Write-to-Disk-First

Every phase MUST write its output file before proceeding to the next phase.
Orchestrators verify file existence, not return values. This ensures crash
recovery and compaction resilience.

---

## 3. Conversational Prose

Creator View and synthesis output MUST be written in conversational prose.
Anti-goal: must NOT read like a technical manual, compliance report, or
auto-generated summary. Write as you would explain insights to a colleague.

---

## 4. Scoring Bands

All skills use the same 4-band categorical scale:

| Band       | Range  | Meaning                              |
| ---------- | ------ | ------------------------------------ |
| Critical   | 0-39   | Fundamental issues, not recommended  |
| Needs Work | 40-59  | Significant gaps, use with caution   |
| Healthy    | 60-79  | Solid foundation, minor improvements |
| Excellent  | 80-100 | Best-in-class for its category       |

**Display rule:** Bands over numbers. Show categorical band with score in
parentheses: `Healthy (72)`. Never display raw numbers without band context.

---

## 5. Fit Scoring Thresholds

All skills use the same fit classification for Creator View recommendations:

| Classification | Criteria                        | Action                         |
| -------------- | ------------------------------- | ------------------------------ |
| active-sprint  | personal_fit >= 60              | Relevant to current work       |
| park-for-later | personal_fit 40-59              | Valuable but not urgent        |
| evergreen      | personal_fit < 40, quality high | Reference material, no urgency |
| not-relevant   | personal_fit < 40, quality low  | Skip unless context changes    |

---

## 6. SKILL.md / REFERENCE.md Split Principle

**SKILL.md** contains: process flow (phases in brief), critical rules, input/
output spec, when to use, integration, version history. Target: under 300 lines
for the process sections.

**REFERENCE.md** contains: detailed specifications, schemas, templates, scoring
rubrics, agent prompts, examples, appendices. No line limit.

**Reference implementation:** website-analysis (1:8.2 ratio, highest adherence).

When in doubt about where content belongs: if it is needed to understand the
workflow on first read, it goes in SKILL.md. If it is needed only during
execution or for reference, it goes in REFERENCE.md.

---

## 7. No Silent Skips

After every SHOULD step, verify the expected output exists. If missing:

1. Retry once with mitigation
2. If still missing, report to user with what was expected and what happened
3. Never silently continue past a failed step

This applies to agent output, file writes, phase outputs, and optional phases.

---

## 8. Self-Audit Minimum Floor

All skills MUST include a self-audit phase (or equivalent verification) before
presenting final output to the user. The minimum floor checks:

1. **Artifact presence:** All MUST output files exist and are non-empty
2. **Schema contract:** Output files match expected structure (field names,
   types)
3. **Completeness:** All phases that were supposed to run did run and produced
   output

Skills MAY add domain-specific audit dimensions above this floor (e.g.,
website-analysis adds 9 dimensions, repo-synthesis adds 6).

---

## 9. Home Context Sources

All skills in the family MUST load these 5 sources before producing
Creator-facing output (Creator View, synthesis output, fit scoring):

1. `SESSION_CONTEXT.md` — current sprint, active work
2. `ROADMAP.md` — project direction, planned features
3. `CLAUDE.md` — conventions, stack, architecture
4. `.claude/skills/` directory listing — active skills inventory
5. `MEMORY.md` user/project entries — project initiatives, decisions

---

## 10. Retro Persistence

All skills SHOULD include a retro prompt at completion and persist the response:

1. **Prompt:** "What worked well? What would you change next time?"
2. **Persist:** Save response to `process_feedback` field in state file
3. **Replay:** At start of next run (VALIDATE or WARM-UP phase), present prior
   feedback: "Last run feedback: {response}"

---

## 11. Extraction Context

All creation-oriented skills (brainstorm, deep-plan, skill-creator) MUST read
`.research/extraction-journal.jsonl` during their context-gathering phase and
surface relevant candidates before proceeding. This ensures patterns,
principles, and architectures identified from external repos/websites inform new
work rather than being rediscovered from scratch.

**How to filter:** Match by candidate `type` (pattern, architecture-pattern,
design-principle, workflow-pattern), keywords in `notes`, or `source` domain.
Present matches as "Prior art from analyzed sources" with source, candidate
name, and notes.

---

## Adoption

Each skill's SKILL.md includes a one-line reference:

```
**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`
```

Conventions in this file override any conflicting statement in individual skill
files. If a skill needs to deviate from a convention, it MUST document the
deviation and rationale in its own Critical Rules section.
