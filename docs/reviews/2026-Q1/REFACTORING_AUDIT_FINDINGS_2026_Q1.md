# Refactoring Audit Findings - 2026 Q1

**Document Version:** 1.0
**Audit Date:** 2026-01-10
**Session:** #45
**Status:** AGGREGATED

---

## Executive Summary

Multi-AI refactoring audit completed with **5 AI models** producing **65 total findings** (before deduplication). After Tier-1 aggregation: **27 canonical findings** in `CANON-REFACTOR.jsonl`.

### Audit Participants

| Model | Findings | Suspected | Key Contributions |
|-------|----------|-----------|-------------------|
| GitHub Copilot | 14 | 2 | DailyQuoteCard, error handling clusters |
| Claude Sonnet 4.5 | 15 | 0 | Cognitive complexity S0 elevation, batch fixes |
| Claude Code Opus 4.5 | 10 | 2 | Growth card dialog pattern, dual-write architecture |
| Codex | 10 | 0 | Admin Cloud Function wiring, CRUD factory |
| ChatGPT 5.2 Thinking | 16 | 0 | TodayPage god component, callSecureFunction wrapper |

### Severity Distribution

| Severity | Count | Description |
|----------|-------|-------------|
| **S0 (BLOCKER)** | 1 | Cognitive complexity (47 violations) |
| **S1 (CRITICAL)** | 7 | Type drift, deprecated paths, App Check, test gaps |
| **S2 (MAJOR)** | 15 | Duplication clusters, boundary violations |
| **S3 (MINOR)** | 4 | Quick wins, batch fixes |

### Effort Distribution

| Effort | Count | Estimated Hours |
|--------|-------|-----------------|
| E0 (< 1 hour) | 4 | ~3 hours |
| E1 (1-4 hours) | 11 | ~28 hours |
| E2 (4-8 hours) | 10 | ~55 hours |
| E3 (multi-day) | 2 | ~32 hours |
| **Total** | **27** | **~118 hours** |

---

## Top Consensus Findings (5/5 Audits Agree)

These findings were identified by ALL five AI models:

| CANON ID | Title | Severity | Effort |
|----------|-------|----------|--------|
| CANON-0065 | Time-of-day rotation logic duplication (quotes/slogans) | S1 | E1 |
| CANON-0073 | DailyQuoteCard component duplication (2-3 locations) | S2 | E1 |
| CANON-0066 | Cloud Function error handling pattern (4-6x) | S1 | E1 |

## High Consensus Findings (4/5 Audits)

| CANON ID | Title | Severity | Effort |
|----------|-------|----------|--------|
| CANON-0087 | CloudFunctionError interface twice in same file | S3 | E0 |
| CANON-0067 | Journal entry type divergence (client/server) | S1 | E2 |
| CANON-0075 | Direct Firebase SDK usage bypasses service layer | S2 | E2 |
| CANON-0074 | Critical paths low test coverage (35%, 17%) | S2 | E2 |

---

## Top Duplication Clusters (All Instances)

### Cluster 1: Time-of-Day Rotation Logic (5/5 consensus)

**Consolidation Target:** `lib/utils/content-rotation.ts`

| File | Symbol | Lines |
|------|--------|-------|
| lib/db/quotes.ts | `getTimeOfDay` | 44-48 |
| lib/db/quotes.ts | `getQuoteForNow` | 58-95 |
| lib/db/slogans.ts | `getTimeOfDay` | 64-68 |
| lib/db/slogans.ts | `getSloganForNow` | 78-115 |

**Impact:** 80+ lines identical. Rotation changes must be applied twice.

### Cluster 2: Cloud Function Error Handling (5/5 consensus)

**Consolidation Target:** `lib/utils/callable-errors.ts`

| File | Symbol | Lines |
|------|--------|-------|
| lib/firestore-service.ts | saveDailyLog catch | 184-234 |
| lib/firestore-service.ts | saveNotebookJournalEntry catch | 408-456 |
| hooks/use-journal.ts | addEntry catch | 305-324 |
| hooks/use-journal.ts | crumplePage catch | 358-379 |

**Impact:** Same error code switch repeated. UX messaging inconsistent.

### Cluster 3: DailyQuoteCard Components (5/5 consensus)

**Consolidation Target:** `components/widgets/daily-quote-card.tsx` with variant prop

| File | Symbol | Style |
|------|--------|-------|
| components/notebook/features/daily-quote-card.tsx | DailyQuoteCard | Sticky note |
| components/widgets/daily-quote-card.tsx | DailyQuoteCard | Motion gradient |
| components/widgets/compact-daily-quote.tsx | CompactDailyQuote | Compact |

**Impact:** Same fetch logic repeated 3x. Feature drift risk.

### Cluster 4: reCAPTCHA Token Handling (3/5 consensus)

**Consolidation Target:** `lib/utils/secure-call.ts` (callSecureFunction wrapper)

| File | Symbol |
|------|--------|
| lib/firestore-service.ts:126-144 | saveDailyLog reCAPTCHA |
| lib/firestore-service.ts:332-346 | saveInventoryEntry reCAPTCHA |
| lib/firestore-service.ts:376-391 | saveNotebookJournalEntry reCAPTCHA |
| hooks/use-journal.ts:281-299 | addEntry reCAPTCHA |
| hooks/use-journal.ts:340-352 | crumplePage reCAPTCHA |

**Impact:** Same boilerplate 5x. Security-critical code duplicated.

### Cluster 5: Growth Card Dialog/Save Pattern (2/5 consensus)

**Consolidation Target:** `hooks/use-growth-card-dialog.ts`

| File | Symbol | Lines |
|------|--------|-------|
| components/growth/SpotCheckCard.tsx | isOpen, isSaving, handleSave | 24-88 |
| components/growth/GratitudeCard.tsx | isOpen, isSaving, handleSave | 28-99 |
| components/growth/NightReviewCard.tsx | open, isSaving, handleSave | 75-165 |
| components/growth/Step1WorksheetCard.tsx | isOpen, isSaving, handleSave | 455-650 |

**Impact:** Boilerplate repeated 4x. Dual-write pattern to inventory + journal.

---

## Suggested PR Sequence (15 PRs)

### Phase 1: Quick Wins & Foundations (1-2 days)

| PR# | Title | Findings | Effort | Files |
|-----|-------|----------|--------|-------|
| PR-01 | Batch lint fixes (auto-fixable) | R-025, R-026 | E0 | ~50 |
| PR-02 | Extract parseTime utility | R-020 | E0 | 3 |
| PR-03 | Extract CloudFunctionError interface | R-003 | E0 | 2 |
| PR-04 | Extract time-of-day rotation helper | R-001 | E1 | 4 |

### Phase 2: Error Handling & Security (2-3 days)

| PR# | Title | Findings | Effort | Files |
|-----|-------|----------|--------|-------|
| PR-05 | reCAPTCHA action constants | R-011 | E1 | 5 |
| PR-06 | callSecureFunction wrapper | R-010 | E1 | 5 |
| PR-07 | Consolidate Cloud Function error handling | R-004 | E1 | 4 |

### Phase 3: Types & Domain (2-3 days)

| PR# | Title | Findings | Effort | Files |
|-----|-------|----------|--------|-------|
| PR-08 | Unify journal entry types | R-005 | E2 | 5 |
| PR-09 | DailyQuoteCard consolidation | R-002 | E1 | 4 |

### Phase 4: Architecture & Boundaries (3-4 days)

| PR# | Title | Findings | Effort | Files |
|-----|-------|----------|--------|-------|
| PR-10 | Firebase collection helpers | R-006, R-016 | E2 | 10 |
| PR-11 | Growth card dialog hook | R-009 | E2 | 5 |
| PR-12 | Migrate deprecated journal writes | R-013 | E2 | 7 |
| PR-13 | Admin Cloud Function wrappers | R-015 | E1 | 6 |

### Phase 5: Testing Foundation (2-3 days)

| PR# | Title | Findings | Effort | Files |
|-----|-------|----------|--------|-------|
| PR-14 | Script test coverage | R-018 | E2 | 6 |
| PR-15 | Critical path test coverage | R-017 | E2 | 5 |

### Phase 6: Major Refactors (Staged, 5+ days)

| PR# | Title | Findings | Effort | Files |
|-----|-------|----------|--------|-------|
| PR-16 | Refactor TodayPage god component | R-022 | E3 | 4 |
| PR-17 | Refactor useJournal domain/transport | R-023 | E2 | 4 |
| PR-18 | Script complexity reduction (staged) | R-008, R-021 | E3 | 8+ |

---

## "Do First" Shortlist (Low-Risk Enablers)

These can be done immediately with minimal risk:

1. **PR-01: Batch lint fixes** (E0) - Instant noise reduction
2. **PR-02: Extract parseTime** (E0) - Trivial, 2 files
3. **PR-03: Extract CloudFunctionError** (E0) - Same file refactor
4. **PR-04: Time rotation helper** (E1) - Pure addition, high ROI
5. **PR-05: reCAPTCHA constants** (E1) - Security foundation

**Total "Do First" effort:** ~6-8 hours

---

## Deferred Items

These items are tracked elsewhere or deferred to later milestones:

| CANON ID | Title | Reason |
|----------|-------|--------|
| CANON-0069 | App Check re-enablement | Tracked in ROADMAP.md M2 |
| CANON-0083 | Deprecated APIs + nested ternaries | Lower priority, can batch later |

---

## Cross-References

- **CANON-CODE.jsonl**: Code review findings (Task 4.2.1)
- **CANON-SECURITY.jsonl**: Security audit findings (Task 4.2.2)
- **CANON-PERF.jsonl**: Performance audit findings (Task 4.2.3)
- **SonarQube Manifest**: `docs/analysis/sonarqube-manifest.md` (baseline reference)

---

## Methodology Notes

### Deduplication Strategy

1. Grouped findings by semantic fingerprint (not exact match)
2. Assigned canonical ID to highest-consensus finding
3. Merged evidence from all audits into single finding
4. Preserved highest severity from any audit
5. Averaged confidence scores

### Consensus Scoring

- **5/5**: Universal agreement - highest priority
- **4/5**: Strong consensus - high confidence
- **3/5**: Moderate consensus - verified finding
- **2/5**: Partial agreement - needs validation
- **1/5**: Single source - may be edge case

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-10 | Initial aggregation from 5 AI audits |
