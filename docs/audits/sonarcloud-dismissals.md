# SonarCloud Issue Dismissals

**Purpose**: Document issues that are dismissed rather than fixed, with
justification.

**Format**: Each dismissal must include:

- Rule ID and location
- Reason category
- Detailed justification
- Reviewer information

---

## Dismissal Categories

| Category        | When to Use                                       |
| --------------- | ------------------------------------------------- |
| False Positive  | Rule incorrectly flagged code that is correct     |
| Acceptable Risk | Risk is understood and accepted for valid reasons |
| By Design       | Code pattern is intentional and documented        |
| Test Code       | Issue is in test file where pattern is acceptable |
| Third-Party     | Issue is in generated/vendored code               |
| Deferred        | Issue moved to different phase with justification |

---

## Dismissed Issues

<!-- Add dismissals below using this format:

### [Rule ID] - path/to/file.ts:123
**Reason**: [Category from above]
**Justification**: [Detailed explanation of why this is dismissed]
**Reviewed by**: [Name] / [Date]

-->

### Example: [typescript:S6759] - components/example.tsx:42

**Reason**: By Design **Justification**: Props are intentionally mutable for
this legacy component. Migration to readonly props planned for v2.0 (see
ROADMAP.md #legacy-cleanup). **Reviewed by**: Example Reviewer / 2026-01-19

---

## Phase-Specific Dismissals

### Phase 1: Mechanical Fixes

<!-- Node imports and shell script dismissals -->

### Phase 2: Critical Issues

<!-- Complexity and blocker dismissals -->

### Phase 3: Major Code Quality

<!-- Ternary and React accessibility dismissals -->

### Phase 4: Medium/Minor Priority

<!-- String method and modern JS dismissals -->

### Phase 5: Security Hotspots

<!-- Security hotspot dismissals with detailed risk assessment -->

---

## Review Process

1. Developer proposes dismissal with justification
2. Code reviewer validates the justification
3. Security team reviews Phase 5 (hotspot) dismissals
4. Document in this file before committing
5. Run `node scripts/verify-sonar-phase.js --phase=N` to confirm

---

## Related Documents

- [Detailed Report](sonarcloud-issues-detailed.md) - Full issue list with code
- [Sprint Plan](../../.claude/plans/sonarcloud-cleanup-sprint.md) - 5-PR
  structure
- [Triage Guide](../SONARCLOUD_TRIAGE.md) - Triage decision framework
