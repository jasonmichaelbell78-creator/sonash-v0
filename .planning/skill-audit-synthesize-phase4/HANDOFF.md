# /synthesize Skill Audit — Phase 4 Implementation Handoff

**Document Version:** 1.0 **Created:** 2026-04-16 (Session #284) **Status:**
ACTIVE **Purpose:** Complete execution handoff for Phase 4 of
`/skill-audit synthesize`. Next session resumes here.

---

## Summary

Session #284 completed Phases 1, 2a (all 12 categories), 2.5 (operational deps —
all green), and 3 (crosscheck — no new skill-creator gaps) of
`/skill-audit synthesize --mode=single`. **109 decisions accepted, 0 rejected, 0
modified.** State file at
`.claude/state/task-skill-audit-synthesize.state.json`.

Phase 4 (Implementation) is pending. Expected effort: 3-5 hours across 4 waves.
Current SKILL.md score 72/120 → projected 108/120 post-implementation.

---

## Where State Lives

| File                                                   | Purpose                                                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `.claude/state/task-skill-audit-synthesize.state.json` | 109 decisions with per-decision confidence, cross-references, phase summaries, ecosystem impact map |
| `.claude/skills/synthesize/SKILL.md`                   | 381 lines — primary target of Phase 4 edits                                                         |
| `.claude/skills/synthesize/REFERENCE.md`               | 552 lines — receives extracted content from Wave 1                                                  |
| `.claude/skills/skill-audit/REFERENCE.md`              | Cat 1-12 definitions + scoring rubric (reference only)                                              |
| `.claude/skills/_shared/SELF_AUDIT_PATTERN.md`         | Canonical pattern for `scripts/skills/<name>/self-audit.js`                                         |
| `scripts/skills/skill-audit/self-audit.js`             | Reference implementation (template for 12A)                                                         |

---

## Phase 4 Wave Plan

### Wave 1 — Enabler Extraction (SKILL.md line budget)

**Why first:** The 381→300-line MUST target is the central constraint. Extract
first, then every other wave's additions fit under budget.

**Actions:**

1. Extract SKILL.md lines 243-260 (10-dim Self-Audit table) into `REFERENCE.md`
   §8 expansion. Keep 1-paragraph summary + "see REFERENCE.md §8" pointer in
   SKILL.md.
2. Extract SKILL.md lines 304-373 (Opportunities Ledger entire section) into new
   `REFERENCE.md` §10 "Opportunities Ledger". Keep 1-paragraph summary + pointer
   in SKILL.md.
3. Verify SKILL.md line count ≤ 300 or close. Target: 293 ± 10.
4. Commit:
   `refactor(skills): synthesize/REFERENCE.md — extract Opportunities Ledger + Self-Audit table from SKILL.md`

**Covers decisions:** 7A

### Wave 2 — Canonical Self-Audit Script (Cat 12 Fix)

**Why second:** Cat 12 is one of two lowest-scoring categories. Script creation
closes the canonical gap and enables remaining Cat 12 + Cat 11 decisions to wire
into it.

**Actions:**

1. Create `scripts/skills/synthesize/self-audit.js` using
   `scripts/skills/skill-audit/self-audit.js` as template.
2. Implement dimensions (per 12A):
   - Dim 1 Artifact existence: check `synthesis.md` + `synthesis.json` +
     `opportunities-ledger.jsonl`
   - Dim 2 Schema validation: Zod validate `synthesis.json` against
     `synthesisRecord`
   - Dim 3 Section completeness: all 8 sections present in `synthesis.md`
   - Dim 8 Gap validity: gap domains exist in home context, not in sources
   - Dim 11 Orphan detection (12B): scan for sources referenced but not present
   - Dim 12 Partial recovery (12E): check for pre-run stale artifacts
   - Dim 13 Contract verification (12D): /recall SQLite has current synthesis
   - Dim 14 Script preflight (12F): `rebuild-index.js` exists + executable
3. Report `---SUMMARY---` JSON block (match skill-audit pattern).
4. Exit codes: 0 = MUST pass, 1 = MUST fail, 2 = script failure.
5. Validate: run against current (incomplete) state → expect WARN for missing
   fields not yet added by Wave 3.
6. Commit:
   `feat(skills): synthesize/self-audit.js — canonical Cat 12 fix action`

**Covers decisions:** 12A, 12B, 12C (agent dispatch), 12D, 12E, 12F, 12G (state
schema reads), 12H (retro WARN)

### Wave 3 — SKILL.md Content Additions (The Bulk)

**Effort:** ~60-80 targeted edits across SKILL.md. Group by section to minimize
re-reads.

**Edit groups (in order):**

**A. Critical Rules block (lines 19-41):**

- 1E: Update Rule #4 to include `opportunities-ledger.jsonl` in
  write-to-disk-first list
- 7O1 / 10O2: Add 1-line "why" motivation to each of the 7 rules

**B. When to Use / When NOT to Use (lines 43-59):**

- 8B: Single-source alternative → `/analyze <url>` first
- 8D: 2-source expectation → low-confidence calibration

**C. Routing Guide (lines 63-71):**

- 8A: /audit-\* boundary row
- 8C: /deep-research boundary row
- 8E: /recall retrieval vs /synthesize generation row
- 8H: /gsd:add-backlog / /gsd:add-todo row

**D. Add new "Scope" line after tagline:**

- 8O1: "Scope: Cross-source synthesis only. Read-only on handler artifacts.
  Write-only to `.research/analysis/synthesis/`."
- 8F: Paradigm justification note (all 4 share 8-section skeleton with §3-6
  shape-variance)

**E. Interactive Opening Menu (lines 89-111):**

- 2D: Add `[P] Pick paradigm` option with state-aware paradigm sub-menu
- 4B: Add `[D] Delegate — I pick based on state` option
- 4O1 / 10B: Add decision-impact hints per option (runtime estimate)
- 10A: Prepend warm-up template:
  `/synthesize — N sources ({types}). Last synthesized: {date}. Running {mode} with {paradigm}.`
- 10C: Post-warm-up gate `[R = run / Q = question / C = cancel]`

**F. PRE-FLIGHT (lines 132-144):**

- 4A: Specify tier_overrides[] persists for run only, handler artifact NOT
  mutated
- 4C: Upgrade prompt extended (time estimate, per-source subset, post-upgrade
  behavior)
- 4D: Re-present MENU after upgrade detour if mode was Full + corpus changed
- 4E: Batch tier reviews 5-8 per prompt
- 6E: Flag-vs-corpus sanity (e.g., --paradigm=meta-pattern with 1 handler type →
  warn)
- 10I: PRE-FLIGHT tier review prompt template

**G. Process Overview + Phase headings (lines 112-130):**

- 2A: Rename Phase 3 to "Canonicalize" (mutates), Phase 4 to "Verify"
  (read-only)

**H. Phase 1 Load (lines 146-160):**

- 2F: Clarify resume granularity
- 3D: Findings.jsonl field contract
- 9D: Add MEMORY.md to home context read list
- 9E: extraction-journal.jsonl usage spec (prior-art suppression)
- 9F: Wire feedback\_\* entries to interactive behavior

**I. Phase 2 Synthesize (lines 162-169):**

- 2E: Inter-Phase Contracts subsection (subagent I/O schema, merge procedure)
- 6C: Subagent failure protocol (1 retry + inline fallback)
- 7F: Rule #2 point-of-use reinforcement (interpretive prose, not bulleted dump)
- 11A: New Phase 2.5 Convergence Pass (T20 tally + user gate)
- 11E: Post-merge convergence verification
- 11F: Reference `/convergence-loop` skill

**J. Phase 3 → now "Canonicalize" (lines 171-176):**

- 2A: Update heading + clarify active-mutation semantics

**K. Phase 4 → now "Verify" (lines 178-181):**

- 11B: Fix-cycle clarity (re-run Phase 3 + 4 on modified output)
- 11C: T20 tally against previous run
- 11D: New Phase 4.5 Convergence Gate (user approves before Phase 5)
- 6A: Dim 11 Contradiction detection WARN
- 6H: Empty-result handling (status='no_signal', exit 0)
- 6I: Dim 12 cross-run drift WARN

**L. Phase 5 Present (lines 183-199):**

- 2B: Cross-skill note (mutates last_synthesized_at; handlers MUST preserve)
- 5C: rebuild-index.js non-zero fallback (partial_present status)
- 10E: Closure signal ("Done. N themes, M candidates...")
- 10H: ✅/⚠️/❌ visual differentiation

**M. Phase 6 Opportunity Matrix (lines 201-211):**

- 7E: Opportunity-selection criteria (source sections, dedup key, ranking
  formula)
- 2C: Move RETRO before Phase 6 routing (OR: run RETRO regardless)
- 5B: Handoff contract `--context=<json>` with inline-paste fallback

**N. RETRO (lines 213-220):**

- 2C: Confirm ordering
- 9C: Future aggregation pointer

**O. Output Sections (lines 222-241, MOVE EARLIER per 7H):**

- 7H: Move block before Interactive Opening Menu
- 3B: Compact Section Format table
- 3F: Per-paradigm reshape pointer to REFERENCE.md §1.3
- 7C: Expand one-liners to 2-3 lines
- 7G: Per-section length floor (Themes 3-10 paragraphs, Gaps 2-5, Chain 5-12,
  etc.)

**P. Self-Audit summary + State File (lines 243-281 — partially extracted by
Wave 1):**

- 12G: Extend state schema: decisions[].file_modified, files_created[],
  files_modified[], subagent_dispatches[], last_complete_run, phase_costs[]
- 13A: phase_costs[] telemetry
- 13B: Backup/rollback via history/
- 13C: Security-content flagging note
- 13D: Parallel-run lock (synthesize.lock)
- 13E: UTF-8/LF encoding spec
- 1C: routings[] array for Phase 6 handoffs
- 4A: tier_overrides[] schema
- 4F: invocation field {args, flags, started_at}
- 3H: blocked_reason + blocked_at + status enum expansion

**Q. Integration section (lines 283-303):**

- 5D: Rename Upstream/Downstream → Consumers/Producers
- 5A: /session-end orphan check note
- 5E: Router Contract subsection
- 5F: ROADMAP.md usage spec
- 5G: SESSION_CONTEXT.md Next Session Goals ranking boost
- 5H: Ecosystem Impact subsection
- 8I: /analyze auto-trigger semantics
- 9A: DECISIONS.md D# ID for writer-not-filing-clerk framing
- 9B: CLAUDE.md convention citations
- 7I: Stack version alignment (Zod 4.3.6)
- 9I: patterns:check N/A rationale

**R. New "Output Contracts for Consumers" section:**

- 3E: ~10-line consumer contract listing (/recall, Phase 6 chain, handlers)
- 3O1: synthesis.json schema_version field

**S. New "Anti-Patterns" section (per 6G):**

- Consolidated list of don'ts (don't re-run analysis, don't skip sources, don't
  cap themes, don't mutate handler artifacts, don't persist tier overrides)

**T. Final polish:**

- 2F: Resume granularity paragraph
- 6D: Disengagement protocol
- 6F: Explicit phase guards
- 8G: Scale boundary note (tested to 50 sources)
- 10D: Progress indicators per phase
- 10F: Resume context render
- 10G: Formatting sweep (subheaders ###, numbered bold rules)
- 7B: MUST/SHOULD/MAY labels sweep on load-bearing instructions
- 9G: consolidation.json hook-in note
- 9H: Retro feedforward note

**Bump version:** 1.2 → 2.0 (breaking: MENU options added, state schema v2,
Phase 3/4 renamed, new phases 2.5/4.5).

**Commit:**
`feat(skills): synthesize v1.2 → v2.0 — skill-audit 12-category rewrite (109 decisions)`

### Wave 4 — Propagation + Validation

**Actions:**

1. Update `/recall` SKILL.md: Integration section note "gates on synthesis.json
   schema_version ≥ 1.0"
2. Update 4 handler SKILLs (`/repo-analysis`, `/website-analysis`,
   `/document-analysis`, `/media-analysis`): add Integration note "MUST preserve
   `last_synthesized_at` field written by /synthesize"
3. Update `/session-end` SKILL.md: add check for orphaned
   `synthesize.state.json` (status !== 'complete')
4. Run `npm run skills:validate` — MUST pass
5. Run `node scripts/skills/synthesize/self-audit.js --target=synthesize` —
   expect PASS
6. Run `npm run patterns:check` — MUST pass
7. Spot-check no broken cross-references in SKILL.md and REFERENCE.md
8. Commit:
   `docs(skills): synthesize v2.0 propagation — /recall + 4 handlers + /session-end`

---

## Keystone Decisions (Must-Do First)

These 3 unblock everything else:

| ID  | Action                                           | Wave | Effort |
| --- | ------------------------------------------------ | ---- | ------ |
| 7A  | Extract Ledger + Self-Audit to REFERENCE.md      | 1    | 20 min |
| 12A | Create `scripts/skills/synthesize/self-audit.js` | 2    | 40 min |
| 11A | Phase 2.5 Convergence Pass + T20 tally           | 3    | 15 min |

---

## Validation Commands

Run after each wave:

```bash
# Structural validation (MUST pass)
npm run skills:validate

# Pattern compliance (MUST pass)
npm run patterns:check

# Line-count check (SKILL.md should be ≤ 300 after Wave 1)
wc -l .claude/skills/synthesize/SKILL.md

# Self-audit script (after Wave 2)
node scripts/skills/synthesize/self-audit.js --target=synthesize

# Cross-reference check
grep -n "see REFERENCE.md" .claude/skills/synthesize/SKILL.md
```

---

## Risk Areas / Gotchas

1. **SKILL.md line budget:** Wave 3 adds significant content. Must keep net
   reduction via Wave 1 extraction. If line count exceeds 300, extract more to
   REFERENCE.md (Phase 6 Opportunity Matrix detail or State File schema details
   are candidates).
2. **Cross-reference drift:** Many decisions reference other decisions by ID
   (e.g., "ties to 2E" or "covered by 1A"). Cross-reference table in state file.
3. **Breaking changes to state schema:** State schema v2 is a breaking change.
   Existing `.claude/state/synthesize.state.json` (3.2KB, Apr 13) will have
   stale fields. Add migration note or delete file (user owns current run
   state).
4. **Routings for Phase 6 handoff:** `/brainstorm` accepts free-form input. 5B's
   `--context=<json>` format needs a fallback path (inline paste). Document
   both.
5. **Handler SKILL edits:** 4 handlers + /recall + /session-end = 6 files for
   Wave 4. Each gets 1-3 lines added. Keep scope narrow.
6. **MEMORY.md path:** Environment-specific
   (`C:\Users\jbell\.claude\projects\...`). Abstract as "auto-loaded MEMORY.md"
   in SKILL.md (per 9D/9F wording).
7. **Commit discipline:** 1 commit per wave (Wave 1, 2, 3, 4). Don't bundle
   across waves.

---

## Low-Confidence Decisions (Phase 4 Extra Confirmation)

These 21 decisions are tagged low confidence in state file — confirm with user
before applying during Wave 3/4:

1A, 1B, 3C, 6A, 7C, 9C, 9H, 9I, 10G, 10H, 10O1, 11A, 11C, 11E, 12C, 12H, 12O1,
12O2, 13A, 13B, 13E

---

## Resume Protocol

**Starter prompt for next session:**

```
/skill-audit synthesize --resume

Read .claude/state/task-skill-audit-synthesize.state.json for the 109 accepted decisions.
Read .planning/skill-audit-synthesize-phase4/HANDOFF.md for the wave-by-wave execution plan.
Begin Wave 1 (extraction). Confirm each wave complete with me before starting the next.
Commit per wave, not all-at-once.
```

---

## Post-Implementation (Phase 5 + 6)

After Wave 4 validation passes:

- **Phase 5 Self-Audit:** Run
  `scripts/skills/skill-audit/self-audit.js --target=synthesize` (the audit's
  own self-audit, not synthesize's new one). Verify all 109 decisions
  grep-mapped to diff hunks. Fix any MISSING before closure.
- **Phase 6 Learning Loop:** Generate 2-3 auto-learnings (lowest-scoring
  category, most common gap type). Solicit user feedback. Update
  `write-invocation.ts` tracking with
  `context: {target: "synthesize", decisions: 109, score: 108, mode: "single"}`.
- **Closure summary:** Files modified, skill-creator gaps (none), projected
  post-fix score.
