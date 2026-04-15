# Self-Audit Pattern

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-14
**Status:** ACTIVE
**Applies To:** Standard and Complex skills (per SKILL_STANDARDS.md §Self-Audit)
<!-- prettier-ignore-end -->

Canonical implementation pattern for per-skill self-audit scripts.
SKILL_STANDARDS.md defines the contract (9 dimensions, penultimate ordering,
tier requirements); this document defines the reusable shape that makes those
requirements executable.

**Reference implementation:** `scripts/cas/self-audit.js` (814 lines, the
pattern this doc generalizes). Second reference:
`scripts/skills/skill-audit/self-audit.js` (skill-audit's own).

---

## Why a Pattern

Every Standard+ skill MUST include a self-audit phase. Without a canonical
shape:

- Each skill re-invents arg parsing, output format, and dimension coverage
- `/skill-audit` Category 12 finds gaps but has no canonical fix action
- `/skill-creator` scaffolds skills without self-audit stubs
- Cross-skill pattern accumulation is lost (e.g., shared security hardening,
  shared schema helpers)

This pattern standardizes the shape so each skill's script differs only in
domain-specific checks, not in plumbing.

---

## Location

**Canonical path:** `scripts/skills/<skill-name>/self-audit.js`

- One directory per skill that needs a self-audit
- Consistent with `scripts/cas/` (CAS self-audit lives outside the
  `.claude/skills/` tree because it's invoked by multiple handlers)
- CI-runnable from repo root without skill-harness overhead

**Exception:** skills that produce artifacts validated by a _shared_ downstream
audit (CAS handlers → `scripts/cas/self-audit.js`) MAY delegate to the shared
script. SKILL.md Phase 5 still invokes the shared script explicitly.

---

## CLI Interface

### Invocation shape

```bash
node scripts/skills/<skill-name>/self-audit.js [--target=<id>] [--state=<path>] [--json]
```

### Arguments

| Flag             | Required?       | Purpose                                                                                                 |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `--target=<id>`  | skill-dependent | Identifies the artifact to audit (e.g., `--slug=foo` for CAS, `--skill=repo-analysis` for skill-audit). |
| `--state=<path>` | optional        | Override default state file location. Default: skill-conventional path.                                 |
| `--json`         | optional        | Machine-readable output (default: human-readable + final JSON summary).                                 |

### Exit codes

| Code | Meaning                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| 0    | All MUST dimensions PASS. SHOULD dimensions PASS or WARN only.                                                   |
| 1    | One or more MUST dimensions FAIL. Details printed to stdout.                                                     |
| 2    | Script failed to run (missing input, malformed state, security refusal). Not a skill failure — a script failure. |

### Output format

Human-readable stream per dimension, then a final JSON summary block:

```
[Dim 1 Completeness] PASS: 12/12 deliverables found on disk
[Dim 2 Orphans]      PASS: 0 orphaned files
[Dim 3 Build]        FAIL: 2 files contain TODO/[TBD] markers
  - scripts/skills/foo/handler.js:42  TODO: schema
  - docs/foo/README.md:18              [TBD]
...

---SUMMARY---
{
  "skill": "foo",
  "target": "session-123",
  "dimensions": {
    "completeness": { "status": "PASS", "details": "12/12" },
    "build": { "status": "FAIL", "details": "2 stub markers", "items": [...] },
    ...
  },
  "overall": "FAIL",
  "must_failed": ["build"],
  "should_warned": ["regression"],
  "skipped": ["regression: no previous state file"],
  "timestamp": "2026-04-14T..."
}
---END---
```

Downstream consumers (SKILL.md Phase 5, CI, `/skill-audit` Category 12) parse
the SUMMARY block.

---

## Dimension Coverage

The 9 dimensions are defined in
[SKILL_STANDARDS.md §Self-Audit](SKILL_STANDARDS.md#self-audit-at-completion).
Tier requirements:

| Dimension                  | Standard          | Complex           | Automatable?                         |
| -------------------------- | ----------------- | ----------------- | ------------------------------------ |
| 1. Completeness            | MUST              | MUST              | Yes — file existence via glob        |
| 2. Orphan detection        | MUST              | MUST              | Yes — grep for references            |
| 3. Build integrity         | MUST              | MUST              | Yes — grep for stub markers          |
| 4. Gap analysis            | MUST              | MUST              | Yes — state.decisions vs diff        |
| 5. Functional verification | MUST              | MUST              | Yes — invoke validators in dry-run   |
| 6. Cross-reference (det.)  | SHOULD            | MUST              | Yes — counter + reference checks     |
| 7. Regression              | SHOULD            | MUST              | Yes — compare current vs prior state |
| 8. Contract                | MUST if consumers | MUST if consumers | Yes — schema/section validation      |
| 9. Partial recovery        | SHOULD            | MUST              | Yes — state.phase + timestamp check  |

**Automation rule:** Every MUST dimension for the skill's tier MUST have a
programmatic check in `self-audit.js`. SHOULD dimensions MAY be scripted or MAY
be deferred to Phase 5 prose (but if deferred, document why).

**Dim 6 — Cross-reference integrity (deterministic):** Per Session #281 D11
(skill-audit-batch-mode plan), the agent-based "second-LLM-reviews-the-state"
layer was REMOVED. Rationale: another LLM reading the same state file and diffs
is echo, not independent verification, and produces the same drift class as the
rejected pattern for findings production.

The replacement deterministic check:

1. **Counter integrity:**
   `total_decisions == accepted_decisions + rejected_decisions` (or derive from
   `state.decisions.{accepted,rejected}` arrays when top-level counters are
   absent).
2. **Cross-reference presence:** every accepted decision has at least one
   `files_modified` entry — empty `files_modified` with non-zero accepted
   decisions is a FAIL (no implementation to verify).
3. Layer 1 (grep — Dim 2) + Layer 2 (diff — Dim 4) cover the "I thought I wrote
   it but didn't" failure mode mechanically.

If a multi-agent check is still genuinely valuable for a specific skill (e.g.,
domain expertise the deterministic checks can't approximate), the script MAY
print a "MANUAL: run code-reviewer with these inputs" block when running inside
Claude Code. It MUST NOT be required for PASS unless the skill explicitly
documents why deterministic checks are insufficient. For Complex skills, the
deterministic check is the default; a prompt block is opt-in.

---

## Required Shared Helpers

Every self-audit script MUST use these helpers (security posture is
non-negotiable):

| Helper                          | Source                                           | Purpose                                                                |
| ------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `validatePathInDir`             | `scripts/lib/security-helpers.js`                | All paths derived from args MUST be validated against a constant root. |
| `refuseSymlinkWithParents`      | `scripts/lib/security-helpers.js`                | Any file read refuses symlinks and symlinked parents.                  |
| `sanitizeError`                 | `scripts/lib/security-helpers.js`                | Error messages MUST never include raw `error.message`.                 |
| `safeParseLine`                 | `scripts/lib/parse-jsonl-line.js`                | JSONL reads use the safe parser (TOCTOU-hardened).                     |
| `safeReadText` / `safeReadJson` | `scripts/lib/safe-cas-io.js` or skill-equivalent | File reads go through try/catch with existsSync race-hardening.        |

Zod schemas for contract checks (Dim 8) MUST import from the skill's existing
schema module, not redefine inline. If the skill has no schema module, create
one before the self-audit.

---

## Skip List Convention

Not every dimension check is worth the false-positive noise. Document skips
explicitly in the script header:

```javascript
/**
 * Skipped from full dimension coverage:
 *   - Dim 6 multi-agent: SKIPPED for Standard tier (not MUST). Handled by Phase 5 prose.
 *   - Dim 3 "prose-style" sub-check: heuristics too noisy (bullet/prose ratio). Manual review.
 *
 * Skipping requires: (a) tier allows it, OR (b) check is unreliable + documented reason.
 */
```

Modeled after CAS self-audit.js, where checks 5b (prose-style) and 7a
(research-index depth) were skipped with explicit rationale. This prevents
re-introduction during future audits.

---

## State File Contract

Skills that maintain a state file (most Standard+ do) MUST structure it so the
self-audit script can answer dimension questions without parsing human-readable
output.

Minimum state schema keys referenced by self-audit:

```json
{
  "skill": "skill-name",
  "target": "artifact-id",
  "phase": "complete",
  "status": "complete",
  "decisions": {
    "accepted": [{ "id": "D1", "file_modified": "path", "diff_hunk": "..." }],
    "rejected": [...]
  },
  "total_decisions": 0,
  "accepted_decisions": 0,
  "rejected_decisions": 0,
  "files_created": ["path1", "path2"],
  "files_modified": ["path3 (description of changes)"],
  "previous_run": {
    "completed_at": "...",
    "files_created": [...],
    "files_modified": [...]
  }
}
```

`files_modified` entries MAY be either a pure path (`"scripts/foo.js"`) or a
path + description suffix (`"scripts/foo.js (refactor X)"`). Reference
implementations (`scripts/skills/<name>/self-audit.js`) MUST normalize before
filesystem operations — see `normalizeFilesModified()` in
`scripts/skills/skill-audit/self-audit.js`.

Counter fields (`total_decisions`, `accepted_decisions`, `rejected_decisions`)
are the canonical inputs to Dim 6 cross-reference integrity. When absent,
implementations MUST derive from `decisions.{accepted,rejected}.length`.

Dimensions use this as follows:

- Dim 1 Completeness: `files_created` (or `files_modified`) exist on disk
- Dim 2 Orphans: every `files_created` is grep-referenced somewhere
- Dim 4 Gap: `decisions.accepted.length == sum(has file_modified or diff_hunk)`
- Dim 6 Cross-reference: counters consistent + accepted decisions have files
- Dim 7 Regression: `previous_run.files_modified` (or `files_created`) ⊆
  current. Reference implementations MUST accept either field for cross-skill
  compatibility.
- Dim 9 Partial recovery: `status == "complete"` and timestamps consistent

Skills whose state schema lacks these fields MUST extend the schema as part of
adding self-audit (documented in the skill's decision record).

---

## Wiring to SKILL.md Phase 5

The skill's Phase 5 (penultimate phase, per SKILL_STANDARDS.md) invokes the
script and branches on exit code:

````markdown
## Phase 5: Self-Audit (MUST — before closure)

1. Run the self-audit script:
   ```bash
   node scripts/skills/<skill-name>/self-audit.js --target=<id>
   ```
````

2. Parse SUMMARY JSON. If `overall == "FAIL"`:
   - Present each `must_failed` dimension to user with remediation options
   - Re-enter Build phase (per SKILL_STANDARDS.md §Ordering: "If self-audit
     finds failures, re-enter Build, fix, then re-run Self-Audit")
   - Re-run self-audit until PASS
3. If `overall == "PASS"` but `should_warned` non-empty:
   - Present warnings, user decides acknowledge/fix/defer
4. Only proceed to closure when overall PASS (after user decision on warnings).

```

Prose in Phase 5 handles the judgment-only checks (dimension 6 for Standard tier when delegated; any skipped sub-checks). The script is the spine; prose fills the interactive gaps.

---

## Rollout Protocol (for adding self-audits to existing skills)

When `/skill-audit` Category 12 scores <7 for a target skill, the canonical fix action is:

1. **Create** `scripts/skills/<skill-name>/self-audit.js` using this pattern. Start by copying `scripts/skills/skill-audit/self-audit.js` as the template, replacing domain-specific checks.
2. **Extend the skill's state schema** if needed to support the dimension checks (see §State File Contract).
3. **Update the skill's SKILL.md Phase 5** to invoke the script per §Wiring.
4. **Document skips** with rationale in the script header.
5. **Run the script against a known-good prior run** to validate it reports PASS on known-good state (regression guardrail).
6. **Add an invocation example to the skill's REFERENCE.md** (how to run manually for debugging).

Step 1 may reuse or delegate to an existing shared script (e.g., CAS handlers → `scripts/cas/self-audit.js`); in that case steps 2-6 still apply but the script itself is a thin wrapper.

---

## Integration with skill-creator

Future revision of `/skill-creator` (Step 3.C of this rollout) scaffolds:

1. `scripts/skills/<name>/self-audit.js` stub matching this pattern
2. SKILL.md Phase 5 template with the invocation block from §Wiring
3. Initial state schema with the minimum keys from §State File Contract
4. REFERENCE.md entry pointing creators to this doc

Until 3.C ships, new skills manually follow this pattern.

---

## Integration with skill-audit

`/skill-audit` Category 12 (Completion Verification Design) scoring uses:

- Presence of `scripts/skills/<target>/self-audit.js` (or documented shared script delegation)
- Dimensions covered (grep the script for dimension function names or comments)
- Wiring in SKILL.md Phase 5 (grep for the invocation block)
- Skip list completeness (header comment review)

When Cat 12 scores <7, Phase 4 implementation adds/improves the self-audit per this pattern. When Cat 12 scores 7-10, Phase 4 may still recommend incremental improvements (e.g., add regression detection if missing).

---

## Version History

| Version | Date       | Description                                   |
| ------- | ---------- | --------------------------------------------- |
| 1.0     | 2026-04-14 | Initial pattern extracted from CAS self-audit |
```
