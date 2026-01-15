# SonarCloud Issue Triage

**Created**: 2026-01-13 **Last Updated**: 2026-01-15 **Export Date**:
2026-01-13T01:17:06Z **Total Issues**: 921

---

## Purpose

This document records the triage decisions for 921 SonarCloud issues identified
during Step 4C of the Integrated Improvement Plan. Each issue is categorized as:

- **FIX-NOW**: Critical issues fixed immediately
- **FALSE-POS**: False positives excluded from future scans
- **ACCEPT-RISK**: Accepted risks with documented rationale
- **FIX-LATER**: Deferred to M2 milestone

**Scope:** Security hotspots, bugs, and code smells from SonarCloud scan.

---

## Summary

| Category        | Count | Action                                             |
| --------------- | ----- | -------------------------------------------------- |
| **FIX-NOW**     | 7     | Fixed in Step 4C                                   |
| **FALSE-POS**   | 21    | Excluded from scans                                |
| **ACCEPT-RISK** | 23    | Tracked in ROADMAP M2 for production re-evaluation |
| **FIX-LATER**   | 41+   | Tracked in ROADMAP M2                              |
| **Code Smells** | ~850  | Deferred to M2 batch cleanup                       |

---

## HIGH Security Hotspots (11 total)

| File:Line                                 | Rule  | Category            | Decision        | Reason                                        |
| ----------------------------------------- | ----- | ------------------- | --------------- | --------------------------------------------- |
| `lib/utils/errors.ts:69,71`               | S2068 | Hard-coded password | **FALSE-POS**   | Error message constants, not actual passwords |
| `tests/utils/logger.test.ts:96,130`       | S2068 | Hard-coded password | **FALSE-POS**   | Test data, not production code                |
| `scripts/ai-review.js:222,227`            | S4721 | Command injection   | **ACCEPT-RISK** | Internal dev script, inputs controlled        |
| `scripts/check-pattern-compliance.js:447` | S4721 | Command injection   | **ACCEPT-RISK** | Internal dev script                           |
| `scripts/check-review-needed.js:234`      | S4721 | Command injection   | **ACCEPT-RISK** | Internal dev script                           |
| `scripts/phase-complete-check.js:437`     | S4721 | Command injection   | **ACCEPT-RISK** | Internal dev script                           |
| `scripts/retry-failures.ts:113`           | S4721 | Command injection   | **ACCEPT-RISK** | Internal dev script                           |

**Total**: 0 FIX-NOW, 4 FALSE-POS, 7 ACCEPT-RISK

---

## MEDIUM Security Hotspots (46 total)

| Category            | Count | Decision      | Reason                                                        |
| ------------------- | ----- | ------------- | ------------------------------------------------------------- |
| S5852 (ReDoS regex) | ~32   | **FIX-LATER** | Scripts have bounded input, low risk                          |
| S2245 (Weak PRNG)   | ~14   | **FALSE-POS** | Visual animations (confetti/firework), not security-sensitive |

**Total**: 0 FIX-NOW, 14 FALSE-POS, 32 FIX-LATER

---

## LOW Security Hotspots (20 total)

| Category               | Count | Decision        | Reason                                    |
| ---------------------- | ----- | --------------- | ----------------------------------------- |
| S5332 (HTTP insecure)  | 2     | **FIX-NOW**     | Seed scripts, easy fix to https           |
| S7637 (GH Actions SHA) | 2     | **FIX-LATER**   | Best practice, not critical               |
| S7636 (Secrets in run) | 1     | **ACCEPT-RISK** | Firebase deploy workflow, acceptable      |
| S5604 (Geolocation)    | 1     | **FALSE-POS**   | App feature, user-consented               |
| S4036 (PATH variable)  | 14    | **ACCEPT-RISK** | Dev scripts/tests, controlled environment |

**Total**: 2 FIX-NOW, 1 FALSE-POS, 2 FIX-LATER, 15 ACCEPT-RISK

---

## Bugs (14 total)

| File:Line                                              | Rule  | Severity | Decision      | Reason                                   |
| ------------------------------------------------------ | ----- | -------- | ------------- | ---------------------------------------- |
| `app/meetings/all/page.tsx:164`                        | S2871 | CRITICAL | **FIX-NOW**   | Missing sort compare function            |
| `components/notebook/pages/resources-page.tsx:306`     | S2871 | CRITICAL | **FIX-NOW**   | Missing sort compare function            |
| `lib/utils.ts:28`                                      | S3923 | MAJOR    | **FIX-NOW**   | Identical conditional branches           |
| `components/widgets/compact-meeting-countdown.tsx:153` | S6959 | MAJOR    | **FIX-NOW**   | reduce() without initial value           |
| `components/widgets/compact-meeting-countdown.tsx:182` | S6959 | MAJOR    | **FIX-NOW**   | reduce() without initial value           |
| `scripts/seed-meetings.ts:79`                          | S5850 | MAJOR    | **FIX-LATER** | Regex precedence (seed script)           |
| `app/globals.css:4`                                    | S4662 | MAJOR    | **FALSE-POS** | Tailwind @custom-variant (valid syntax)  |
| `styles/globals.css:4`                                 | S4662 | MAJOR    | **FALSE-POS** | Tailwind @custom-variant (valid syntax)  |
| `components/admin/users-tab.tsx:563`                   | S1082 | MINOR    | **FIX-LATER** | Accessibility - onClick without keyboard |
| `components/journal/entry-detail-dialog.tsx:14,18`     | S1082 | MINOR    | **FIX-LATER** | Accessibility - onClick without keyboard |
| `components/journal/entry-feed.tsx:152,156`            | S1082 | MINOR    | **FIX-LATER** | Accessibility - onClick without keyboard |
| `components/widgets/compact-meeting-countdown.tsx:273` | S1082 | MINOR    | **FIX-LATER** | Accessibility - onClick without keyboard |

**Total**: 5 FIX-NOW, 2 FALSE-POS, 7 FIX-LATER

---

## ACCEPT-RISK Rationale

All ACCEPT-RISK items are internal development scripts or test files that:

1. Are not deployed to production
2. Have controlled inputs (not user-supplied)
3. Run only in developer environments

**Production Re-evaluation**: Before any production deployment, re-run SonarQube
scan and address ACCEPT-RISK items. Tracked in ROADMAP.md M2.

---

## Exclusions Configured

See `sonar-project.properties` for configured exclusions:

- `**/node_modules/**` - Third-party dependencies
- `**/dist/**` - Build output
- `**/.next/**` - Next.js build cache
- `**/tests/**` - Test files (coverage exclusion)

---

## Related Documents

- [SonarCloud Export Data](./analysis/) - Raw issue data
- [ROADMAP.md](../ROADMAP.md) - M2 backlog items
- [INTEGRATED_IMPROVEMENT_PLAN.md](./archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md) -
  Step 4C tracking

---

## Version History

| Version | Date       | Changes                                      |
| ------- | ---------- | -------------------------------------------- |
| 1.0     | 2026-01-13 | Initial triage from Step 4C                  |
| 1.1     | 2026-01-15 | Added Purpose section, documentation cleanup |
