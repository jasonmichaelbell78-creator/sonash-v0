# Ecosystem Audit: Finding Walkthrough

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Shared finding walkthrough protocol for all ecosystem audit skills. Covers
finding presentation, decision options, decision handling, patch display,
delegation protocol, and batch shortcuts.

**Usage:** Add this to your ecosystem audit SKILL.md:

```markdown
## Phase 3: Finding-by-Finding Walkthrough

> Read `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` for the
> full walkthrough protocol (finding card, decisions, patches, delegation,
> batching).

Sort findings by `impactScore` descending (highest impact first).
```

---

## Finding Presentation

Sort all findings by `impactScore` descending (highest impact first).

For each finding, present a context card:

```
━━━ Finding {n}/{total} ({pct}% complete -- {fixed} fixed, {deferred} deferred, {skipped} skipped) ━━━
{SEVERITY}  |  {domainLabel}: {categoryLabel}  |  Impact: {impactScore}/100

{message}

Evidence:
  {details}
```

Then present the finding using structured Q&A format:

- **Description:** What the finding means, with context and investigation (read
  the actual code before presenting -- verify the finding is real)
- **Options:** Numbered list with pros/cons for each option
- **Recommendation:** Which option and why

---

## Patch Display

If the finding has `patchable: true`, show the patch preview inline:

```
Patch Available:
  Target: {patch.target}
  Action: {patch.description}
  Preview:
    {patch.preview or patch.content}
```

---

## Decision Options (by Severity)

### ERROR Findings

- **Fix Now** -- execute the fix/patch immediately
- **Defer** -- add to deferred list, create DEBT entry
- **Skip** -- with documented false-positive justification

### WARNING Findings

- **Fix Now**
- **Defer**
- **Skip** -- acknowledge but don't track

### INFO Findings

- **Acknowledge**
- **Defer** for later

---

## Decision Handling

### Fix Now

1. If patch is available, apply it (edit file, run command, etc.)
2. If no patch, provide guidance for manual fix
3. Log decision to session file
4. Create TDMS entries one-by-one during walkthrough (MUST -- prevents loss on
   compaction)

### Defer

1. Create DEBT entry via `/add-debt` with:
   - severity: S1 (errors) or S2 (warnings)
   - category: `engineering-productivity`
   - source_id: `review:{audit-name}-ecosystem-audit-{date}`
2. Log decision to session file

### Skip / Acknowledge

1. Log to session file without creating DEBT entries

### Suppress (where supported)

1. Add to suppression list (not yet implemented -- log for future)
2. Log decision to session file

---

## Running Tally

After each decision, show running progress:

```
Progress: {n}/{total} | Fixed: {f} | Deferred: {d} | Skipped: {s}
```

---

## Batch Shortcuts (SHOULD)

After 3+ INFO findings: offer "N more INFO findings remaining. Review each, or
acknowledge all?"

After 3+ WARNING findings with no patches: offer similar batch option.

ERRORs are ALWAYS presented individually.

---

## Scope Explosion Guard (MUST)

If total findings > 30: "30+ findings detected. Options: review all, errors-only
(with summary of rest), or top-20 by impact?"

If total findings > 50: "50+ findings detected. Review top 20 by impact, then
batch-decide the rest? [Y/review all]"

---

## Delegation Protocol (MUST support)

If user says "you decide" or similar:

- Accept all available patches
- Defer findings without patches
- Log each as `delegated-accept`
- Show summary of delegated decisions

Additional delegation shortcuts:

- "skip remaining INFO" -- batch-skip all remaining INFO findings
- "fix all patchable" -- apply all remaining patches without individual review
- "defer the rest" -- defer all remaining findings as DEBT entries

---

## Post-Walkthrough Contradiction Check (SHOULD)

After all decisions, scan for contradictions (e.g., fixing a dependency that a
skipped finding depends on). Present any conflicts for resolution.

---

## To Revise a Previous Decision

Note it during any later finding and it will be captured in the session log.

---

## Version History

| Version | Date       | Description                             |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2026-03-25 | Extracted from 8 ecosystem audit skills |
