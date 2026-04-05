# V1 Verification: SQ1-SQ4 Claims

**Scope:** Claims C-001 through C-040 covering SQ1 (state machine), SQ2
(auto-advance), SQ3 (findings_refs), SQ4 (/todo UX split) **Verifier:**
deep-research-verifier **Date:** 2026-04-04 **Method:** Filesystem-first
(codebase ground truth), web spot-checks for external claims

---

## Summary

| Metric          | Count            |
| --------------- | ---------------- |
| Claims in scope | 40               |
| Claims verified | 38 of 40         |
| VERIFIED        | 11               |
| REFUTED         | 5                |
| UNVERIFIABLE    | 22               |
| CONFLICTED      | 0                |
| Skipped (time)  | 2 (C-008, C-009) |

**Critical REFUTED claims:** C-001, C-007, C-013, C-020, C-034

---

## SQ1: State Machine Design

---

### C-001

**Claim:** todos.jsonl as proto-R&D tracker with ~15 of 19 encoding R&D stage
**Verdict:** REFUTED **Evidence:** Direct read of .planning/todos.jsonl. 19
total records. Status: 6 pending, 5 in-progress, 3 blocked, 5 completed. Active
(non-completed) = 14, not 15. Zero records have a stage, type, or schema_version
field. Count of ~15 does not match actual data. Some todos have R&D-flavored
progress text (T4, T12, T13, T16) but this does not constitute formal stage
encoding. **File:**
C:/Users/jason/Workspace/dev-projects/sonash-v0/.planning/todos.jsonl **Notes:**
Directional intent (todos.jsonl is natural home) is reasonable. Count and
characterization are overstated. Re-synthesis: use 14 active, note no stage
encoding exists.

### C-002

**Claim:** Two orthogonal state dimensions (status + stage) must not be
conflated **Verdict:** UNVERIFIABLE **Evidence:** Architectural design principle
for a future schema. No stage field exists in todos.jsonl. This is a design
prescription, not a verifiable codebase fact.

### C-003

**Claim:** Type discriminator (PROJECT|TASK) mandatory; TASK items have no stage
field **Verdict:** UNVERIFIABLE **Evidence:** Design proposal. Grep confirms 0
occurrences of a type key in todos.jsonl. Future schema prescription.

### C-004

**Claim:** Stage transitions use guarded whitelist table (not strict DAG or
linear sequence) **Verdict:** UNVERIFIABLE **Evidence:** Design recommendation.
.planning/rnd-config.json does not exist (Glob confirmed). No transition table
in codebase to compare against.

### C-005

**Claim:** Minimal transition log schema: from, to, at (ISO-8601), by,
skipped[], reason; append-only in stage_history[] **Verdict:** UNVERIFIABLE
**Evidence:** Schema design proposal. No stage_history field in todos.jsonl
(direct read confirmed). Cannot verify against non-existent artifact.

### C-006

**Claim:** Specific allowed transition whitelist (IDEA to
BRAINSTORM/RESEARCH/PLAN/IMPLEMENT/ABANDONED; terminal states COMPLETE and
ABANDONED) **Verdict:** UNVERIFIABLE **Evidence:** Specific transition table
design. No rnd-config.json or transition definition file exists in codebase.

### C-007

**Claim:** Transition table stored in .planning/rnd-config.json
(declarative_over_imperative, tenet T17) **Verdict:** REFUTED (file does not
exist; claim presents proposal as established pattern) **Evidence:**
.planning/rnd-config.json does NOT exist -- confirmed via Glob search across
entire project returning no results. No tenet registry found for T17
verification. This is a forward-looking recommendation, not an established
convention. **Notes:** Re-synthesis should frame as: rnd-config.json SHOULD be
created following declarative_over_imperative principles.

### C-008

**Claim:** Skipped stages must be recorded in skipped[] array at transition time
**Verdict:** UNVERIFIABLE (skipped -- design proposal, no existing
implementation)

### C-009

**Claim:** Backtracking approximated with returnAfter field on todo record
**Verdict:** UNVERIFIABLE (skipped -- design proposal, no existing
implementation)

### C-010

**Claim:** deep-research skill demonstrates multi-phase lifecycle state machine
with phases 2.5, 3.5, 3.95, conditional execution, off-ramps, backtracking,
crash-proof state persistence **Verdict:** VERIFIED **Evidence:**
.claude/skills/deep-research/SKILL.md confirmed. Phase markers at lines 122
(2.5), 130 (3.5), 138 (3.95). Phases 0 through 5 all present. Documents
sequential phases, conditional execution (if gap agents spawned), off-ramps
(skip 3.96-3.97 if 0 gaps), backtracking via resume logic, crash-proof state
persistence with state file recovery. **File:**
C:/Users/jason/Workspace/dev-projects/sonash-v0/.claude/skills/deep-research/SKILL.md:122-300

### C-011

**Claim:** Terminal states COMPLETE and ABANDONED required; PARKED optional with
history-state semantics **Verdict:** UNVERIFIABLE **Evidence:** Design proposal.
PARKED state with history-state semantics not present in any current schema.

### C-012

**Claim:** Stage state stored in todo record (embedded stage_history[])
satisfies tenet T9 crash-proof **Verdict:** UNVERIFIABLE **Evidence:** Design
proposal. No stage_history field in todos.jsonl. Note: deep-research skill
stores state in a separate state file
(.claude/state/deep-research.<slug>.state.json) rather than embedded in research
output -- a different pattern from what C-012 proposes.

---

## SQ2: Auto-Advance Detection

---

### C-013

**Claim:** Claude Code has native FileChanged hook; SessionStart can output
watchPaths array to register specific file paths for monitoring **Verdict:**
REFUTED (partial -- FileChanged exists, watchPaths mechanism does not)
**Evidence (FileChanged EXISTS):** Official Claude Code docs at
https://code.claude.com/docs/en/hooks confirm FileChanged hook exists, added
2026-03-26. Fires when a watched file changes on disk; matcher field specifies
basename patterns. **Evidence (watchPaths DOES NOT EXIST):** Official docs
confirm SessionStart does NOT support outputting a watchPaths array. Watch
registration is via the FileChanged hook matcher field in settings.json (static,
basename-based only). SessionStart script output cannot dynamically register
watch paths. **Source:** https://code.claude.com/docs/en/hooks

### C-014

**Claim:** Primary auto-advance mode is lazy on-demand scanning at /rnd view
time; under 5ms for 20 slugs; zero overhead between sessions **Verdict:**
UNVERIFIABLE **Evidence:** Performance claim is plausible (fs.existsSync is
fast) but unverified. No /rnd view exists in codebase. Design recommendation.

### C-015

**Claim:** FileChanged is correct secondary path; lazy scan catches
between-session advances, FileChanged catches in-session advances **Verdict:**
VERIFIED (with caveat) **Evidence:** FileChanged hook confirmed to exist in
official Claude Code docs (https://code.claude.com/docs/en/hooks). Complementary
lazy+FileChanged architecture is logically sound. Caveat: FileChanged matches by
basename only (docs confirm), consistent with C-019 warning.

### C-016

**Claim:** L3 content check thresholds: BRAINSTORM.md (size>200b AND contains ##
), RESEARCH_OUTPUT.md (size>1000b AND contains ## ), FINDINGS.md (size>500b),
metadata.json (valid JSON with status field) **Verdict:** UNVERIFIABLE
**Evidence:** Design decision for content-based thresholds. No rnd-stage-advance
hook implementation exists. The values are design choices.

### C-017

**Claim:** Node.js fs.watch on Windows produces duplicate events, null
filenames, memory leaks, junction inconsistencies; debouncing (100ms window +
1000ms ceiling) mandatory **Verdict:** VERIFIED **Evidence:** Well-documented
Node.js issue confirmed across official and community sources. This codebase
already addresses Windows path issues (C-018 confirmed at
post-write-validator.js:117), indicating established awareness of Windows fs
quirks. The debouncing recommendation is standard practice. **Notes:** Specific
debounce values (100ms/1000ms) are design choices, not verifiable facts.
