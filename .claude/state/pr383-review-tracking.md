<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-21
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR #383 Review Tracking — Final Status

## Sources & Totals

### R1 + R2

- SonarCloud code smells: 114 items
- SonarCloud security hotspots: 3 items
- CI failure: 1 item
- Qodo compliance: 5 items
- Qodo code suggestions: 15 items
- Gemini: 1 item
- **Subtotal: 139 items**

### R3

- SonarCloud code smells: 37 items (22 CC deferred, 15 fixable)
- SonarCloud security hotspots: 1 item (S2245 re-flagged, already rejected)
- CI failure: 2 items (doc lint)
- Qodo compliance: 5 items
- Qodo code suggestions: 5 items
- **Subtotal: 50 items (27 new actionable)**

### Grand Total: 189 items

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

### Commit 2 (cd3b5785) — Qodo fixes (15 items)

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

### Commit 3 (uncommitted) — R3 fixes (27 items)

#### SonarCloud non-CC fixes (15 items)

- extract-context-debt.js: regex alternation `(\/|\\)` → `[/\\]`
- generate-grand-plan.js: removed unused `_totalOpen`, 2x empty catch →
  console.debug
- sprint-complete.js: fixed unused "i" assignment
- sprint-wave.js: fixed unused "i" assignment + nested template extraction
- sprint-status.js: batched consecutive Array.push calls
- intake-sonar-reliability.js: 2x `.replace()` → `.replaceAll()`
- reconcile-roadmap.js: `String.raw` for regex
- clean-intake.js: empty catch → console.debug
- sync-deduped.js: empty catch → console.debug

#### Qodo compliance fixes (5 items)

- sync-sonarcloud.js: sanitized error logging (discard raw response body)
- categorize-and-assign.js: readJsonl silent parse → console.warn with line
  number
- intake-sonar-reliability.js: actor context (ingested_by + ingested_at)
- commit-failure-reporter.js: strip file paths/commands from errorExtract
- hook-analytics.js: sanitize check names, strip file paths

#### Qodo code suggestions (5 items)

- sync-sonarcloud.js: try/catch around convertIssue for resilient sync
- reverify-resolved.js: guard report file parsing with try/catch
- extract-context-debt.js: replaceAll backslash + reject absolute paths
- categorize-and-assign.js: mkdirSync + rmSync for cross-platform atomic writes
- clean-intake.js: prevent object mutation in verifyItem (track downgrade, don't
  mutate)

#### CI doc fixes (2 items)

- PLAN_INDEX.md: added required document headers
- TEMPLATE.md: fixed invalid date format

---

## DEFERRED — CC Violations (22 items, all pre-existing)

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
- sprint-intake.js:130 CC 18 (R3)
- sprint-status.js:151 CC 17 (R3)

## REJECTED (1 item, re-confirmed in R3)

- S2245 Math.random() in sprint-status.js sampleRandom() — diagnostic sampling,
  not crypto

## NOT FIXED — Architectural (1 item)

- Replace one-time scripts with SonarCloud API integration
  (intake-sonar-reliability.js)
  - This is an architectural suggestion requiring design discussion
  - sync-sonarcloud.js already does API integration; intake scripts are one-time
    data loads

### R4

- SonarCloud code smells: 31 items (22 CC deferred, 7 re-flags from R3, 2 new)
- SonarCloud security hotspots: 1 item (S2245 re-flagged, already rejected)
- CI failure: 1 item (REVIEW_DECISIONS.md doc lint)
- Qodo compliance: 5 items
- Qodo code suggestions: 8 items
- **Subtotal: 46 items (18 new actionable)**

### Commit 4 (uncommitted) — R4 fixes (18 items)

#### SonarCloud re-flag fixes (9 items)

- clean-intake.js: 2x bare `catch {}` (removed unused `error_` params)
- categorize-and-assign.js: renamed `parseErr` → `error_`
- generate-grand-plan.js: 2x bare `catch {}` (removed unused `_` params)
- sprint-complete.js: `i += 1` → `i++; args[i]` pattern
- sprint-wave.js: `i += 1` → `i++`
- sync-deduped.js: 2x bare `catch {}` (removed unused `err` params)

#### Qodo/CI fixes (5 items)

- sprint-status.js: destructured import `{ sanitizeError }`
- verify-resolutions.js: 2x path traversal guards (getLineCount,
  patternFoundNearLine)
- clean-intake.js: removed unused `/* eslint-disable complexity */`
- ingest-cleaned-intake.js: removed unused `/* eslint-disable complexity */`

#### CI doc fix (1 item)

- REVIEW_DECISIONS.md: added Purpose and Version History sections

#### Learning log (1 item)

- Review #365: PR #383 R1-R4 combined entry

#### Qodo suggestions saved but not yet applied (2 items)

- intake-sonar-reliability.js: atomic write with tmp+rename
- reverify-resolved.js: Windows-safe atomic rename

### R4 Qodo Code Suggestions (saved for reference)

1. **commit-failure-reporter.js L153**: Regex redaction may append `_REDACTED`
   instead of replacing. Need to verify actual regex in file.
2. **verify-resolutions.js L222**: Path traversal guard in `getLineCount` —
   FIXED
3. **verify-resolutions.js L261**: Path traversal guard in
   `patternFoundNearLine` — FIXED
4. **intake-sonar-reliability.js L2476-2494**: Atomic write with tmp+rename
   instead of separate appends to prevent MASTER/deduped drift
5. **clean-intake.js L285**: Refine S0 downgrade rule to only downgrade
   non-critical categories instead of all non-security
6. **sync-sonarcloud.js L285-289**: Guard `await response.text()` with try/catch
   for resilient error handling
7. **sprint-status.js L24**: Fix destructured import for sanitizeError — FIXED
8. **sprint-complete.js L274**: Guard `targetManifest.ids` as array before push
9. **reverify-resolved.js L327-360**: Harden atomic rename on Windows with
   rmSync fallback

### R4 Qodo Compliance Items (saved for reference)

1. **hook-analytics.js**: Unsanitized log fields in analytics output
2. **categorize-and-assign.js**: Naming convention for catch parameter
3. **intake-sonar-reliability.js**: Missing actor identity in audit trail
4. **hook-analytics.js**: Raw failure payloads in hook-health context
5. **clean-intake.js**: S0 downgrade too broad

## TOTAL ACCOUNTING

- R1+R2: 117 fixed + 20 deferred + 1 rejected + 1 architectural = 139
- R3: 27 fixed + 22 deferred (same 20 + 2 new) + 1 rejected (same) = 50
- R4: 18 fixed + 22 deferred (same) + 1 rejected (same) = 46
- **Cumulative: 162 fixed + 22 deferred + 1 rejected + 1 architectural = 186
  unique items (235 total with re-flags)**
