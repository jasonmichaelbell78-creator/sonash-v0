<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-21
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR #383 Review Tracking — Final Status

## Sources & Totals

- SonarCloud code smells: 114 items
- SonarCloud security hotspots: 3 items
- CI failure: 1 item
- Qodo compliance: 5 items
- Qodo code suggestions: 15 items
- Gemini: 1 item
- **TOTAL: 139 items**

---

## FIXED (117 items)

### Commit 1 (81a8858c) — SonarCloud bulk fixes (60+ items)

- 6x `node:` import prefixes (audit-s0-promotions.js,
  triage-scattered-intake.js)
- 10x `Number.parseInt`/`Number.parseFloat`/`Number.isNaN`
- 6x `String#replaceAll`
- 17x `for-of` loop conversions
- 10x empty catch block comments
- 5x CLI args as `Set`
- 8x unused variable/assignment removals (16 SonarCloud items — each reported
  twice)
- 3x nested ternary/template extractions
- 8x Array.push batching
- 1x `Object.hasOwn`
- 1x if-only-in-else collapse
- 1x negated condition flip
- 2x `++i` expression splits
- 1x pre-commit regex refactor (Gemini)
- 1x Prettier fix (.serena/project.yml)
- 1x execSync→execFileSync (S4721 command injection hotspot)
- 1x regex DoS bounded (S5852 hotspot)

### Commit 2 (uncommitted) — Qodo fixes (15 items)

- reverify-resolved.js: audit report structure validation
- sprint-intake.js: overflow sprint assignment guard + severity bug fix
- categorize-and-assign.js: atomic file writes (tmp+rename)
- clean-intake.js: track silent severity mutations
- verify-resolutions.js: line number normalization (3 functions)
- ingest-cleaned-intake.js: require content_hash for dedup
- sprint-status.js: manifest load validation
- extract-context-debt.js: path sanitization
- intake-sonar-reliability.js: case-insensitive lookup + mkdir + dedup both
  files + dynamic TODAY + sanitized error messages
- sync-sonarcloud.js: merged duplicated dedup loop
- commit-failure-reporter.js: user context in audit entry + sanitized hook
  output

---

## DEFERRED — CC Violations (20 items, all pre-existing)

These functions existed before this PR with CC > 15. Tracked in TDMS.

- audit-s0-promotions.js:217 CC 28
- categorize-and-assign.js:168 CC 16
- extract-context-debt.js:45 CC 16, :114 CC 31
- ingest-cleaned-intake.js:31 CC 18
- process-review-needed.js:30 CC 18
- sprint-complete.js:167 CC 37
- sprint-intake.js:169 CC 24, :231 CC 59
- sprint-status.js:147 CC 16, :215 CC 22, :280 CC 34, :449 CC 28
- sprint-wave.js:125 CC 30
- sync-deduped.js:88 CC 25
- verify-resolutions.js:281 CC 28, :345 CC 27, :401 CC 27, :485 CC 16
- log-override.js:102 CC 21
- triage-scattered-intake.js:170 CC 67

## REJECTED (1 item)

- S2245 Math.random() in sprint-status.js sampleRandom() — diagnostic sampling,
  not crypto

## NOT FIXED — Architectural (1 item)

- Replace one-time scripts with SonarCloud API integration
  (intake-sonar-reliability.js)
  - This is an architectural suggestion requiring design discussion
  - sync-sonarcloud.js already does API integration; intake scripts are one-time
    data loads

## TOTAL ACCOUNTING: 117 fixed + 20 deferred + 1 rejected + 1 architectural = 139 ✓
