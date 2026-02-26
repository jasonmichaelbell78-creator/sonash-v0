# Over-Engineering Research Findings

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-26
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Branch:** claude/new-session-SkJbD

## Finding Rankings (by impact)

### #1: 18:1 Token Overhead Ratio — STATUS: IMPLEMENTED

- Always-loaded trio: CLAUDE.md (~950t), SESSION_CONTEXT.md (~1,670t), MEMORY.md
  (~740t) = ~3,360 tokens/turn
- 20-message session = ~67,200 tokens from these three alone
- SESSION_CONTEXT.md version history table = ~105 tokens/turn (pure waste)
- CLAUDE.md references CODE_PATTERNS.md and FIX_TEMPLATES.md by name, nudging
  reads

### #2: Hook Process Spawning (~395 Node processes/session) — STATUS: IMPLEMENTED (A+B+C)

- 4 UserPromptSubmit hooks fire every message (user-prompt-handler,
  analyze-user-request, plan-mode-suggestion, session-end-reminder)
- 2 PostToolUse Bash hooks fire on EVERY bash call (commit-tracker,
  commit-failure-reporter)
- post-read-handler (537 lines) fires on every Read
- post-write-validator (958 lines) fires on every Write/Edit
- user-prompt-handler.js already contains ALL logic from the other 3
  UserPromptSubmit hooks
- analyze-user-request.js, plan-mode-suggestion.js, session-end-reminder.js are
  redundant
- alerts-reminder.js exists but isn't wired in settings.json (dead file)
- Estimated +200-400ms latency per user message from 4 Node spawns

### #3: 22 Audit Skills, Most Never Run — STATUS: DEFERRED

- 9 domain audits (audit-code, audit-security, etc.) — 6 of 9 have ZERO results
- 7 ecosystem audits (hook-, session-, tdms-, pr-, skill-, doc-,
  script-ecosystem-audit)
- 2 orchestrators (audit-comprehensive, comprehensive-ecosystem-audit)
- audit-health (meta-checker), create-audit (wizard), audit-aggregator
- Each ecosystem audit has its own lib/ with scoring.js, state-manager.js,
  patch-generator.js, benchmarks.js — NOT shared
- Sessions spent maintaining skills that audit skills (circular overhead)
- 7 ecosystem audits are structurally identical — could be 1 parametric skill
  with --domain

### #4: 100K Lines of Scripts for a JSONL File — STATUS: IMPLEMENTED (A+B+C+D)

- scripts/debt/ = 37 scripts, 17,876 lines
- scripts/ top-level = 56 scripts, 29,852 lines
- Total operational scripts = ~229 scripts, ~100,038 lines
- 80+ of 105 npm scripts are for AI/meta tooling, not the app
- Primary output: MASTER_DEBT.jsonl (4,625 items) + reviews.jsonl (~46 entries)
- 6 extract-\*.js scripts at pipeline front end
- One-time migration scripts never removed (intake-sonar-reliability.js = 2,608
  lines)
- Two parallel master findings files (MASTER_DEBT.jsonl AND
  MASTER_ISSUE_LIST.jsonl)

### #5: TDMS Destructive Overwrite Pattern — STATUS: IMPLEMENTED

- generate-views.js reads deduped.jsonl and OVERWRITES MASTER_DEBT.jsonl
- sync-deduped.js (205 lines) exists ONLY to compensate for this
- Every intake script must dual-write to both files
- Already documented in MEMORY.md as critical bug
- Fix is ~10 lines: make generate-views.js read-only (derive views without
  overwriting source)

### #6: 6 Stub senior-\* Skills (Dead Code) — STATUS: IMPLEMENTED

- senior-architect, senior-backend, senior-devops, senior-frontend,
  senior-fullstack, senior-qa
- Each has 3 Python scripts (18 total), ALL are identical 114-line no-op
  scaffolds
- Scripts print status and return findings: []
- ~1,500 lines SKILL.md + 2,052 lines Python stubs = 3,552 lines of nothing

### #7: Duplicate UserPromptSubmit Hook Logic — STATUS: IMPLEMENTED (resolved with #2)

- (Subset of #2) user-prompt-handler.js contains runAnalyze(), runSessionEnd(),
  runPlanSuggestion()
- These are near-verbatim copies of analyze-user-request.js,
  session-end-reminder.js, plan-mode-suggestion.js
- matchesWord/matchesPhrase helpers copy-pasted into both files
- .directive-dedup.json exists to paper over the double-emission

### #8: Dead App Code — STATUS: IMPLEMENTED

- lib/database/database-interface.ts + firestore-adapter.ts = 188 lines, 0
  production imports
- lib/utils/secure-caller.ts = 196 lines, 0 production call sites
- lib/utils/anonymous-backup.ts = 159 lines, 0 imports anywhere
- components/theme-provider.tsx = 8 lines, not used in layout
- Total: ~551 lines of confirmed dead code

### #9: SQLite Migration for TDMS (Qodo Was Right) — STATUS: DEFERRED (roadmap)

- Suggested twice, rejected with "TDMS is established" (not a technical
  argument)
- JSONL fragility documented in MEMORY.md as critical bug
- O(n²) dedup, ID instability, dual-file sync requirement
- Would eliminate: sync-deduped.js, dual-write requirement, dedup-multi-pass.js
  complexity
- E3 effort but would structurally fix Finding #5

### #10: Review Pipeline Circular Format — STATUS: DEFERRED (subsumable by #9)

- AI_REVIEW_LEARNINGS_LOG.md (markdown) → reviews.jsonl (JSONL) →
  suggested-rules.md (markdown)
- Data flows: markdown → JSONL → markdown → (manual) markdown
- check-review-archive.js (482 lines) validates sync between two representations
- reviews:repair mode confirms drift happens between the two formats
- 5 scripts, ~3,100 lines for this pipeline

### #11: Two Parallel Master Findings Files — STATUS: DEFERRED (ephemeral output, subsumable by #9)

- MASTER_DEBT.jsonl (TDMS pipeline) AND MASTER_ISSUE_LIST.jsonl (aggregation
  pipeline)
- Both do normalization, deduplication, produce markdown views
- aggregate-audit-findings.js (1,953 lines) has its OWN Levenshtein and dedup
  pipeline
- Separate pipelines maintaining overlapping content

### #12: Shared Lib Gaps — STATUS: PARTIALLY RESOLVED (major gaps fixed in #4, minor remain)

- 3x Levenshtein distance implementations (dedup-multi-pass,
  aggregate-audit-findings, aggregate-category)
- readJsonl() duplicated in 6+ scripts
- sanitizeError() copy-pasted despite lib/sanitize-error.js existing
- validateContainedPath duplicated in 3 multi-ai scripts
- CANONICAL_CATEGORIES defined identically in 2 scripts

### #13: 105 npm Scripts — STATUS: SKIPPED (symptom of tooling volume, not root cause)

- 80% are for AI/meta tooling, not the app
- Typical Next.js app has 8-12
- ecosystem:audit:all just prints "Use /comprehensive-ecosystem-audit skill"

### #14: markitdown Skill Bloat — STATUS: IMPLEMENTED (deleted 4,334 lines)

- 524 lines (over 500-line limit) + 8 companion files
- Wrapper around external open-source tool
- More docs than the upstream library
- No evidence of usage for SoNash work

### #15: App-Level Duplicates — STATUS: DEFERRED (2 dead components + 2 non-duplicates)

- 2x error modules (callable-errors.ts + errors.ts) with competing isAuthError
- 2x timestamp utils (firebase-guards.ts + firebase-types.ts) with competing
  implementations
- 2x DailyQuoteCard (widgets/ + notebook/features/)
- 2x MoodSelector (basic unused, enhanced used)
- DI factory in firestore-service.ts (13 injectable deps, never overridden in
  production)

### Qodo Architectural Themes Worth Reconsidering

- **SQLite for TDMS** (Finding #9) — rejected twice, fragility is real
- **ajv schema validation** — deferred twice, hand-written validation produced 8
  bugs
- **Regex linter → ESLint plugin** — 2 DEBT entries, false-positive churn in
  reviews
- **HookRunner framework** — deferred, but shared infra was built reactively
  anyway
