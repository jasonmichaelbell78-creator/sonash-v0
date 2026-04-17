# Skill-Audit `/recall` — Phase 4 Handoff

**Source audit:** `.claude/state/task-skill-audit-recall.state.json`
**Session:** #285 (2026-04-17) **Scope:** Deferred Phase 4 work — create
`scripts/skills/recall/self-audit.js` and wire SKILL.md Phase 5. **Estimated
effort:** 2-4 hours isolated.

---

## Why This Is Deferred

The `/recall` audit scored Cat 12 (Completion Verification) at **2/10** — the
skill is Standard tier but has **zero** self-audit infrastructure. Per
SKILL_STANDARDS.md, Standard tier MUST cover verification dimensions 1-5.

The inline Phase 4 (Session #285) applied all SKILL.md + REFERENCE.md +
recall.js decisions (59 implementation items across 10 categories). Building
`self-audit.js` is a 300-400-line script — separate session scope.

---

## Inputs for Next Session

- **Audit state (canonical decision record):**
  `.claude/state/task-skill-audit-recall.state.json`
- **Cat 12 decision:** Cat12-A — "FULL CANONICAL FIX", accepted [high]
- **OPP-2 wired into Cat 12:** couple with `rebuild-index.js` integrity output
  (`Integrity: ok | FK violations: 0`)
- **OPDEP-1 regression test wired into Cat 12:** verify `--target=sources`
  standalone returns exit 0
- **R3 constraint:** `/recall` has NO skill-run state file (query skill,
  single-pass). `self-audit.js` must operate on post-query artifacts, not a
  state file.
- **R5 wiring:** invoke `scripts/cas/self-audit.js --slug=<sample>` as Dim 8
  contract-verification sub-check (producer-side)

---

## Deliverables

### 1. `scripts/skills/recall/self-audit.js` (new)

**Template starting point:** `scripts/skills/synthesize/self-audit.js`
(structurally similar — Standard-tier skill with data-file dependencies).

**Coverage (Standard tier scope per SKILL_STANDARDS.md §9 dims):**

| Dim | Name                    | Status                                                        | Implementation                                                                                               |
| --- | ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Completeness            | MUST                                                          | Verify `/recall` produced output (result count, follow-up offered, or empty-suggestion rendered)             |
| 2   | Orphan detection        | MUST                                                          | No artifacts written by /recall — N/A; document in header                                                    |
| 3   | Build integrity         | MUST                                                          | Grep produced chat output for stub-marker patterns (per SELF_AUDIT_PATTERN.md §Dim 3)                        |
| 4   | Gap analysis            | MUST                                                          | Verify each decision in Phase 2a state maps to SKILL.md diff hunk                                            |
| 5   | Functional verification | MUST                                                          | Run 5 smoke tests: `--stats`, `--target=sources`, free-text, `--tag=X`, empty query (expect Usage)           |
| 6   | Multi-agent             | SHOULD (MAY for <15 decisions — 100 here, so check threshold) | Consider: dispatch agent to verify SKILL.md readability                                                      |
| 7   | Regression              | SHOULD                                                        | Compare against prior state file (`task-skill-audit-recall.run1-single.state.json` = parity test baseline)   |
| 8   | Contract                | MUST                                                          | Invoke `scripts/cas/self-audit.js --slug=<sample>` for producer-side; verify Wave 4 framing honest per ECO-2 |
| 9   | Partial recovery        | MAY                                                           | Query skill doesn't resume — document N/A in header                                                          |

**OPDEP-1 regression test (part of Dim 5):**

```javascript
// Verify recall.js accepts --target=sources as standalone query
const result = spawnSync("node", [
  "scripts/cas/recall.js",
  "--target=sources",
  "--limit=2",
]);
assert.equal(
  result.status,
  0,
  "OPDEP-1 regression: --target=sources alone must not fail arg validation"
);
assert(result.stdout.toString().startsWith("["), "Expected JSON array output");
```

**Header skip-list convention** (per SELF_AUDIT_PATTERN.md):

```
// Dim 2 (Orphan detection): N/A — /recall writes no artifacts
// Dim 6 (Multi-agent): SHOULD but MAY for query skill — skip
// Dim 9 (Partial recovery): N/A — single-pass query, no resume
```

### 2. SKILL.md Phase 5 wiring

Current SKILL.md has a Phase 5 **stub** pointing to this HANDOFF. Replace the
stub with:

```markdown
## Phase 5: Self-Audit (MUST)

Run: `node scripts/skills/recall/self-audit.js`

Covers SKILL_STANDARDS.md Dims 1, 3, 4, 5, 7, 8 (Standard tier + contract +
regression). Dims 2, 6, 9 are N/A or MAY-skipped for this skill (query skill, no
artifact writes, no resume state, <15 agent-dispatch threshold). See script
header for skip-list rationale.

Parse `---SUMMARY---` JSON block:

- `overall: "PASS"` clean → proceed to closure
- `overall: "PASS"` with WARN → present to user for acknowledge/fix/defer
- `overall: "FAIL"` → re-enter Phase 4, fix, re-run
```

### 3. Regression baseline

Before first PASS run, capture a baseline of the current `/recall` output state
so Dim 7 has something to compare against. Could be a snapshot of:

- Current SKILL.md line count + section list
- Current recall.js arg-parsing contract (8 flags)
- Current CAS producer output (via `scripts/cas/self-audit.js --slug=<sample>`)

---

## Execution Checklist

When the deferred session runs:

- [ ] Copy `scripts/skills/synthesize/self-audit.js` →
      `scripts/skills/recall/self-audit.js`
- [ ] Rename + adjust domain-specific dimension checks
- [ ] Wire R5: invoke `scripts/cas/self-audit.js` as Dim 8 sub-check
- [ ] Wire OPDEP-1 regression test in Dim 5
- [ ] Wire OPP-2: parse `rebuild-index.js` stderr for
      `Integrity: ok | FK violations: 0`
- [ ] Document skipped dims in script header
- [ ] Run against current `/recall` state — expect PASS
- [ ] Replace SKILL.md Phase 5 stub with wiring prose above
- [ ] Bump SKILL.md version: 1.2 → 1.3 (or coordinate with other edits)
- [ ] Add Version History entry with session ref
- [ ] Run `npm run skills:validate`
- [ ] Update audit state file: mark cat12 status fully implemented

---

## Out of HANDOFF Scope (further deferred)

These items were captured in the audit but are NOT part of this HANDOFF:

- **R1 (TDMS item):** `scripts/cas/recall.js` has no unit tests — log to TDMS
  separately
- **5 recall.js enhancement OPPs:** saved queries, `--verify-producers`,
  `--diagnose`, `recall-history.jsonl`, query regression harness — all are
  script-level feature work, not SKILL.md scope
- **Skill-creator gaps (4):** flag for next `/skill-audit skill-creator` run
- **ECO-2 gate implementation** (Wave 4 schema_version actually enforced in
  code): deferred to future /recall enhancement scope. Current docs honestly
  describe the gate as aspirational.

---

## Success Criteria

Deferred session is successful when:

1. `scripts/skills/recall/self-audit.js` exists and runs without error
2. `node scripts/skills/recall/self-audit.js` on current `/recall` state reports
   `overall: "PASS"` (regression baseline)
3. OPDEP-1 regression test passes
4. SKILL.md Phase 5 invokes the script
5. `npm run skills:validate` still passes
6. Audit state file `cat12` score bumps from 2/10 → 8-9/10 post-implementation

---

## References

- Audit state: `.claude/state/task-skill-audit-recall.state.json`
- Template: `scripts/skills/synthesize/self-audit.js`
- Pattern: `.claude/skills/_shared/SELF_AUDIT_PATTERN.md`
- Producer-side: `scripts/cas/self-audit.js`
- Contract standards: `.claude/skills/_shared/SKILL_STANDARDS.md` §Self-Audit at
  Completion
- `/recall` SKILL.md: `.claude/skills/recall/SKILL.md` (currently v1.2)
