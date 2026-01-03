# Refactoring PR Plan

**Document Type:** Historical Archive
**Original Format:** .txt (planning document)
**Date Created:** December 2025
**Converted to Markdown:** 2026-01-03
**Purpose:** Execution plan for implementing refactoring in PRs

---

## About This Document

This document outlines the PR-by-PR execution strategy for implementing the refactoring findings from the multi-AI code review. It includes:

- Master implementer prompt for consistency
- 8 PR payloads with CANON findings
- Between-PR checklist for quality control
- Review/verification prompts

**Related Documents:**
- [ChatGPT_Multi_AI_Refactoring_Plan_Chat.md](./ChatGPT_Multi_AI_Refactoring_Plan_Chat.md) - Planning conversation
- [GitHub_Code_Analysis_and_Review_Prompt.md](./GitHub_Code_Analysis_and_Review_Prompt.md) - The analysis prompt
- [EIGHT_PHASE_REFACTOR_PLAN.md](../EIGHT_PHASE_REFACTOR_PLAN.md) - The resulting refactor plan

---

## PR Implementation Plan

Where I’d start (based on your plan)

Your aggregation’s “recommended order” starts with security posture PR1 and then the Firestore/journal normalization work. 

Review / Verification Prompts (use after each PR)
Prompt R1 — Self-review the PR (diff-focused)
ROLE
You are a senior reviewer. Your job is to catch regressions, scope creep, and hidden duplication.

INPUTS
- I will paste: (1) the PR diff summary (or changed file list), (2) key code snippets, (3) command outputs.

CHECKS (in order)
1) Does the PR actually satisfy the PR_OBJECT goal and the included CANON IDs?
2) Did it accidentally create new duplication or new “second patterns”?
3) Any Next.js boundary issues introduced (server/client, SSR hazards)?
4) Security regressions (App Check assumptions, rules alignment, client trust boundary)?
5) Tests: do they cover the risky path or just the happy path?

OUTPUT FORMAT
- MUST_FIX (bullets: file+symbol)
- SHOULD_FIX (bullets)
- NICE_TO_HAVE (bullets)
- MERGE_DECISION (MERGE / DO_NOT_MERGE + 1 sentence)

Prompt R2 — Hallucination / false-positive guardrail check
ROLE
You are an adversarial verifier. Assume prior claims may be wrong.

INPUTS
- I will paste the PR_OBJECT, the CANON items referenced, and the changed files.

TASK
- For each claimed improvement, validate it by pointing to:
  - concrete file path(s) AND
  - symbol(s) that changed
  - and what behavior changed (1 sentence)
- If you cannot ground it, label it “UNPROVEN”.

OUTPUT FORMAT
- PROVEN (bullets with file+symbol)
- UNPROVEN (bullets with what evidence is missing)
- RISKY_SIDE_EFFECTS (bullets)

Below is the corrected setup:

One master “Implementer” prompt you reuse every PR

Eight PR payload blocks that include:

PR_OBJECT

the actual CANON_FINDINGS_JSONL lines from your report for that PR

This way, Codex (or any implementer model) has the “important info” inside the prompt and doesn’t need you to copy/paste from the report each time.

1) Master PR Implementer Prompt (reuse for every PR)
ROLE
You are the Implementation Engineer for a single PR in a Next.js (App Router) + React + TypeScript + Firebase repo. You are executing one PR from a deduped refactor plan focused on cross-cutting duplication/inconsistency.

INPUTS (I WILL PROVIDE)
1) PR_OBJECT (JSON)
2) CANON_FINDINGS_JSONL (one JSON object per line; canonical findings to satisfy in this PR)

HARD RULES
- Do NOT re-audit the whole repo. Implement ONLY what’s required by PR_OBJECT + CANON_FINDINGS_JSONL.
- Do NOT expand scope. If you discover extra refactors, list them under FOLLOWUPS and stop there.
- Keep PR small: target <= 10 files changed. If you must exceed, split into PRa/PRb and implement only PRa.
- Evidence discipline: Every claim about a change must cite file path + symbol name you touched.
- No rewrites. Prefer extraction + mechanical migration.
- No secrets. Never print env values or keys.

REQUIRED FIRST LINE
Print exactly:
IMPL_CAPABILITIES: repo_checkout=<yes/no>, run_commands=<yes/no>, package_manager="<npm|pnpm|yarn|unknown>", limitations="<one sentence>"

IF repo_checkout=no OR run_commands=no
Return only:
BLOCKERS (bullets) and STOP.

PROCESS (STRICT)
1) PARSE INPUTS
- Restate PR title + goal (1–2 sentences)
- List CANON IDs you will satisfy
- List expected files to touch (best guess)

2) BASELINE (if not already done this session)
Run:
- npm run lint
- npm run test
If a typecheck script exists, also run it:
- npm run typecheck (or tsc --noEmit)
Record any pre-existing failures under BASELINE_FAILURES.

3) IMPLEMENTATION LOOP
For each CANON finding (in dependency order):
- Implement the smallest coherent change that satisfies its suggested_fix.
- Prefer shared helpers/utilities when duplication_cluster indicates a cluster.
- After each coherent chunk, run targeted checks (lint/typecheck/tests relevant).
- Fix failures immediately before moving on.

4) FINAL VERIFICATION (required)
Run:
- npm run lint
- npm run test
- npm run typecheck (or tsc --noEmit) if available
If any CANON acceptance_tests mention coverage, also run:
- npm run test:coverage

5) OUTPUT FORMAT (STRICT)
Return exactly these sections:

PR_HEADER
PR_ID: <pr_id> | TITLE: <title> | BUCKET: <bucket>

FILES_CHANGED
- <file>: <why>

CANONICAL_FINDINGS_SATISFIED
For each CANON-XXXX:
- What changed (file + symbol)
- Behavior change: yes/no
- How to verify (1–2 bullets)

COMMANDS_RUN
- Baseline: (short status)
- After changes: (short status)

NOTES_FOR_REVIEWERS
- Risks + mitigations
- Followups (out of scope items discovered)

DIFF_SUMMARY
- 5–12 bullets, no giant diffs/logs

2) PR Payloads (copy/paste one at a time under the Master Prompt)
PR1 Payload
PR_OBJECT:
{
  "pr_id": "PR1",
  "title": "Lock down journal writes and enable App Check",
  "goal": "Standardize notebook writes through Cloud Functions, ...e App Check enforcement, and review rules for journal entries.",
  "bucket": "security-hardening",
  "included_canonical_ids": [
    "CANON-0001",
    "CANON-0002",
    "CANON-0003",
    "CANON-0041",
    "CANON-0043",
    "CANON-0044"
  ],
  "risk_level": "high",
  "estimated_effort": "E2",
  "acceptance_tests": [
    "npm run lint",
    "npm run test"
  ],
  "notes": "Route notebook writes via callable, re-enable App Check, and document rule updates for journal collection."
}

CANON_FINDINGS_JSONL:
{"canonical_id":"CANON-0001","category":"Security","title":"Journal writes should be routed through Cloud Function (standardize notebook writes)","severity":"S0","effort":"E2","status":"CONFIRMED","final_confidence":90,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Direct client writes exist; Cloud Function pattern already used elsewhere","files":["hooks/use-journal.ts","lib/firestore-service.ts","functions/src/index.ts"],"symbols":["addEntry","saveNotebookJournalEntry","saveNotebookEntryCallable"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Multiple write surfaces for journal/notebook entries: direct Firestore writes vs service vs callable","instances":[{"file":"hooks/use-journal.ts","symbol":"addEntry"},{"file":"lib/firestore-service.ts","symbol":"saveNotebookJournalEntry"},{"file":"functions/src/index.ts","symbol":"saveNotebookEntryCallable"}]},"why_it_matters":"Parallel write paths fragment validation, rate limiting, and App Check enforcement; security posture becomes inconsistent.","suggested_fix":"Make Cloud Function callable the single write surface for notebook/journal entries; client should call wrapper; service should delegate to callable or be removed.","acceptance_tests":["npm run lint","npm test","Manual: create/update entry works; direct client write path removed"],"pr_bucket_suggestion":"security-hardening","dependencies":[]}
{"canonical_id":"CANON-0002","category":"Security","title":"Enable App Check enforcement for journal/notebook writes","severity":"S0","effort":"E1","status":"CONFIRMED","final_confidence":85,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"App Check removed/commented out for journal rules and some paths","files":["firestore.rules","lib/firebase.ts","functions/src/index.ts"],"symbols":["appCheck","match /users/{userId}/journal/{entryId}","saveNotebookEntryCallable"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Without App Check, abusive clients can spam expensive write paths; comments imply enforcement that isn't active.","suggested_fix":"Re-enable App Check checks in the rule path or enforce App Check inside callable (preferred) and document dev debug token usage.","acceptance_tests":["npm run lint","npm test","Manual: callable requires App Check token in prod config"],"pr_bucket_suggestion":"security-hardening","dependencies":["CANON-0001"]}
{"canonical_id":"CANON-0003","category":"Security","title":"Verify journal rule alignment with intended policy (suspected mismatch)","severity":"S1","effort":"E0","status":"SUSPECTED","final_confidence":35,"consensus_score":1,"sources":["Gemini"],"confirmations":0,"suspects":1,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"Needs confirmation of actual intended policy vs comment","files":["firestore.rules"],"symbols":["match /users/{userId}/journal/{entryId}"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"If rules allow client writes but design assumes CF-only, future security hardening may be skipped.","suggested_fix":"Confirm intended policy and align comments + enforcement; prefer CF-only for sensitive writes.","acceptance_tests":["Review rules comments vs implementation"],"pr_bucket_suggestion":"security-hardening","dependencies":["CANON-0002"]}
{"canonical_id":"CANON-0041","category":"Security","title":"Align rate limiting posture for journal/notebook writes (client/server)","severity":"S1","effort":"E1","status":"CONFIRMED","final_confidence":80,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Rate limit constants exist but are inconsistently applied across write surfaces","files":["lib/constants.ts","lib/utils/rate-limiter.ts","hooks/use-journal.ts","functions/src/index.ts"],"symbols":["RATE_LIMITS","RateLimiter","addEntry","saveNotebookEntryCallable"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Rate limiting implemented in some client paths and missing in others; server callable should be the enforcement point","instances":[{"file":"lib/utils/rate-limiter.ts","symbol":"RateLimiter"},{"file":"hooks/use-journal.ts","symbol":"addEntry"},{"file":"functions/src/index.ts","symbol":"saveNotebookEntryCallable"}]},"why_it_matters":"Inconsistent throttling leads to spammy UX, elevated costs, and uneven abuse resistance.","suggested_fix":"Enforce rate limiting in callable; keep client limiter as UX-only. Remove duplicate/unused presets or wire them consistently.","acceptance_tests":["npm test","Manual: rapid submits return consistent error"],"pr_bucket_suggestion":"security-hardening","dependencies":["CANON-0001"]}
{"canonical_id":"CANON-0043","category":"Security","title":"Ensure client-side Firestore path validation + scope checks are applied (or superseded by CF-only policy)","severity":"S1","effort":"E2","status":"CONFIRMED","final_confidence":80,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"useJournal writes directly without calling validation helpers","files":["hooks/use-journal.ts","lib/security/firestore-validation.ts"],"symbols":["addEntry","assertUserScope","validateUserDocumentPath"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Some write surfaces call validation helpers, others bypass them entirely","instances":[{"file":"hooks/use-journal.ts","symbol":"addEntry"},{"file":"lib/security/firestore-validation.ts","symbol":"assertUserScope"}]},"why_it_matters":"Bypassed validation increases chance of rule mismatch and unsafe path assumptions; CF-only policy should eliminate need for client validation on that path.","suggested_fix":"If keeping any client writes, call assertUserScope + validateUserDocumentPath consistently. Preferred: eliminate direct client writes in favor of callable.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"security-hardening","dependencies":["CANON-0001"]}
{"canonical_id":"CANON-0044","category":"Security","title":"Fix Firestore rules comment/enforcement mismatch for journal writes","severity":"S1","effort":"E0","status":"CONFIRMED","final_confidence":85,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"Rules comment says Cloud Functions only but allow create/update for owners and App Check commented out","files":["firestore.rules","lib/firestore-service.ts"],"symbols":["match /users/{userId}/journal/{entryId}","saveNotebookJournalEntry"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Mismatch between documented intent and enforcement can cause future hardening to be skipped or misapplied.","suggested_fix":"Align comments with actual policy or enforce Cloud Function-only writes with App Check and rate limiting.","acceptance_tests":["npm run lint","npm test","If enforcing, client writes to journal fail without Cloud Function"],"pr_bucket_suggestion":"security-hardening","dependencies":["CANON-0043"]}

PR2 Payload
PR_OBJECT:
{
  "pr_id": "PR2",
  "title": "Unify Firestore access patterns and journal models",
  "goal": "Consolidate Firestore access and journal typing w... removing duplicated client writes and admin init boilerplate.",
  "bucket": "firebase-access",
  "included_canonical_ids": [
    "CANON-0005",
    "CANON-0006",
    "CANON-0007",
    "CANON-0008",
    "CANON-0009",
    "CANON-0024",
    "CANON-0028",
    "CANON-0030",
    "CANON-0031",
    "CANON-0039",
    "CANON-0040"
  ],
  "risk_level": "medium",
  "estimated_effort": "E2",
  "acceptance_tests": [
    "npm run lint",
    "npm run test"
  ],
  "notes": "Pick a single Firestore abstraction, batch/transaction gratitude writes, centralize admin initialization and collection constants, align journal types/nullability, and route slogan widget through services."
}

CANON_FINDINGS_JSONL:
{"canonical_id":"CANON-0005","category":"Hygiene/Duplication","title":"Multiple Firestore access patterns exist; choose a canonical service/wrapper","severity":"S2","effort":"E2","status":"CONFIRMED","final_confidence":80,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Services + direct component writes both present","files":["lib/firestore-service.ts","components/admin/admin-crud-table.tsx","components/growth/DailySloganWidget.tsx"],"symbols":["FirestoreService","fetchItems","DailySloganWidget"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Direct Firestore SDK usage coexists with FirestoreService abstractions","instances":[{"file":"lib/firestore-service.ts","symbol":"FirestoreService"},{"file":"components/admin/admin-crud-table.tsx","symbol":"fetchItems"},{"file":"components/growth/DailySloganWidget.tsx","symbol":"DailySloganWidget"}]},"why_it_matters":"Inconsistent boundaries lead to drift in validation, mapping, error handling, and future security hardening.","suggested_fix":"Pick FirestoreService (or equivalent) as canonical and migrate direct SDK usage behind it, starting with the biggest cross-cutting paths.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":[]}
{"canonical_id":"CANON-0006","category":"Types/Correctness","title":"Gratitude writes should be atomic (batch/transaction) to avoid partial state","severity":"S1","effort":"E1","status":"CONFIRMED","final_confidence":75,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Multiple writes for gratitude flows observed","files":["components/growth/GratitudeCard.tsx","lib/firestore-service.ts"],"symbols":["handleSave","saveInventoryEntry","saveNotebookJournalEntry"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Non-atomic multi-write flows can create inventory entry without matching journal (or vice versa).","suggested_fix":"Use Firestore batch/transaction (or server callable) for multi-doc writes; surface a single success/failure to UI.","acceptance_tests":["npm test","Manual: simulate failure between writes doesn’t leave partial state"],"pr_bucket_suggestion":"firebase-access","dependencies":[]}
{"canonical_id":"CANON-0007","category":"Hygiene/Duplication","title":"Admin SDK initialization duplicated across scripts; centralize","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":80,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Multiple scripts re-init admin with similar boilerplate","files":["scripts/*.ts"],"symbols":["initializeApp","getFirestore"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Admin init boilerplate repeated across scripts","instances":[{"file":"scripts/*","symbol":"initializeApp"}]},"why_it_matters":"Boilerplate drift risks inconsistent credentials loading and environment behavior.","suggested_fix":"Create scripts/admin/init.ts (or similar) and import from all scripts; one canonical init path.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":[]}
{"canonical_id":"CANON-0008","category":"Hygiene/Duplication","title":"Journal type definitions duplicated/inconsistent; unify into one canonical module","severity":"S2","effort":"E2","status":"CONFIRMED","final_confidence":80,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Multiple journal entry shapes across hooks/services/types","files":["types/journal.ts","hooks/use-journal.ts","lib/firestore-service.ts"],"symbols":["JournalEntry","useJournal","saveNotebookJournalEntry"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Different JournalEntry shapes (timestamps/tags/nullable fields) appear in multiple modules","instances":[{"file":"types/journal.ts","symbol":"JournalEntry"},{"file":"hooks/use-journal.ts","symbol":"JournalEntry"},{"file":"lib/firestore-service.ts","symbol":"NotebookJournalEntry"}]},"why_it_matters":"Type drift creates runtime bugs and makes refactors error-prone.","suggested_fix":"Create a single canonical journal model + helpers; update hook + service to import it; align nullability/timestamp semantics.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":[]}
{"canonical_id":"CANON-0009","category":"Security","title":"Remove duplicated client write paths once canonical surface is chosen","severity":"S1","effort":"E2","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Both hook-level and service-level write implementations exist","files":["hooks/use-journal.ts","lib/firestore-service.ts"],"symbols":["addEntry","saveNotebookJournalEntry"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Parallel write implementations for journal/notebook entries","instances":[{"file":"hooks/use-journal.ts","symbol":"addEntry"},{"file":"lib/firestore-service.ts","symbol":"saveNotebookJournalEntry"}]},"why_it_matters":"Parallel paths defeat central validation, rate limiting, and App Check strategies.","suggested_fix":"Delete or redirect non-canonical write paths; leave one surface only (ideally callable).","acceptance_tests":["npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":["CANON-0005"]}
{"canonical_id":"CANON-0024","category":"Hygiene/Duplication","title":"DailySloganWidget fetches slogans directly; route through SlogansService","severity":"S2","effort":"E0","status":"CONFIRMED","final_confidence":85,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"DailySloganWidget duplicates getAllSlogans mapping logic","files":["components/growth/DailySloganWidget.tsx","lib/db/slogans.ts"],"symbols":["DailySloganWidget","SlogansService.getAllSlogans"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Direct Firestore fetch duplicates SlogansService.getAllSlogans mapping","instances":[{"file":"components/growth/DailySloganWidget.tsx","symbol":"DailySloganWidget"},{"file":"lib/db/slogans.ts","symbol":"SlogansService.getAllSlogans"}]},"why_it_matters":"Two slogan fetch/mapping sources will drift and complicate caching/error handling.","suggested_fix":"Replace direct getDocs mapping in widget with SlogansService.getAllSlogans and SlogansService.getSloganForNow.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":["CANON-0005"]}
{"canonical_id":"CANON-0028","category":"Hygiene/Duplication","title":"Centralize Cloud Function wrapper usage for callable invocations","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":75,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Callables invoked in multiple ad-hoc patterns","files":["lib/functions/*.ts","components/*"],"symbols":["httpsCallable","callFunction"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Different wrappers/usage patterns for calling Cloud Functions","instances":[{"file":"lib/functions/*","symbol":"callFunction"}]},"why_it_matters":"Inconsistent callable invocation leads to uneven error handling, retries, and auth/App Check assumptions.","suggested_fix":"Create one canonical callable wrapper and migrate call sites to it.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":[]}
{"canonical_id":"CANON-0030","category":"Hygiene/Duplication","title":"Snapshot mapping helper should be centralized to reduce cast-heavy patterns","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":75,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"snapshot.docs.map(...) pattern repeats in multiple locations","files":["components/admin/admin-crud-table.tsx","lib/db/meetings.ts","lib/db/slogans.ts"],"symbols":["fetchItems","MeetingsService.getAllMeetingsPaginated","SlogansService.getAllSlogans"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Repeated snapshot.docs.map with id injection + casting","instances":[{"file":"components/admin/admin-crud-table.tsx","symbol":"fetchItems"},{"file":"lib/db/meetings.ts","symbol":"getAllMeetingsPaginated"},{"file":"lib/db/slogans.ts","symbol":"getAllSlogans"}]},"why_it_matters":"Casting hides schema drift and increases runtime risk; mapping changes require multi-site edits.","suggested_fix":"Add mapDocsWithId<T>() (optionally with transform) and migrate call sites.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":["CANON-0005"]}
{"canonical_id":"CANON-0031","category":"Hygiene/Duplication","title":"Static data vs Firestore content inconsistency (choose canonical source)","severity":"S2","effort":"E2","status":"CONFIRMED","final_confidence":65,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Some features load static fixtures while others use Firestore collections","files":["data/*","lib/db/*","components/*"],"symbols":["getAll*","use*"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Mixed content sources (static JSON/TS data + Firestore) for similar concepts","instances":[{"file":"data/*","symbol":"(varies)"},{"file":"lib/db/*","symbol":"(varies)"}]},"why_it_matters":"Users see inconsistent content and it complicates caching, admin tooling, and testing.","suggested_fix":"Declare a canonical source per domain (meetings/quotes/slogans) and wrap legacy source behind a consistent interface.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":["CANON-0005"]}
{"canonical_id":"CANON-0039","category":"Hygiene/Duplication","title":"Multiple modules reimplement doc/collection path builders; centralize constants/buildPath usage","severity":"S1","effort":"E1","status":"CONFIRMED","final_confidence":80,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"String interpolation for paths appears in multiple write/read modules","files":["lib/constants.ts","lib/firestore-service.ts","hooks/use-journal.ts"],"symbols":["buildPath","saveJournalEntry","addEntry"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Firestore path strings are built ad-hoc vs via constants/helpers","instances":[{"file":"lib/constants.ts","symbol":"buildPath"},{"file":"lib/firestore-service.ts","symbol":"saveJournalEntry"},{"file":"hooks/use-journal.ts","symbol":"addEntry"}]},"why_it_matters":"Path drift creates silent bugs and makes security alignment harder.","suggested_fix":"Use buildPath (or expand it) for all user-scoped collection/doc paths; eliminate string literals.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":["CANON-0040"]}
{"canonical_id":"CANON-0040","category":"Hygiene/Duplication","title":"Journal collection path constants are incomplete; codify /journal vs /journalEntries explicitly","severity":"S1","effort":"E1","status":"CONFIRMED","final_confidence":85,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Code uses both /journal and /journalEntries while constants cover only journalEntries","files":["lib/constants.ts","lib/firestore-service.ts","hooks/use-journal.ts","firestore.rules"],"symbols":["FIRESTORE_COLLECTIONS","buildPath","saveNotebookJournalEntry","useJournal"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Both journal and journalEntries collections exist across code and rules","instances":[{"file":"lib/firestore-service.ts","symbol":"saveNotebookJournalEntry"},{"file":"hooks/use-journal.ts","symbol":"useJournal"},{"file":"firestore.rules","symbol":"match /users/{userId}/journal/{entryId}"}]},"why_it_matters":"Collection name drift is a top source of production bugs and makes refactors risky.","suggested_fix":"Either consolidate to one collection or codify both in constants + buildPath helpers and migrate string literals.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"firebase-access","dependencies":[]}

PR3 Payload
PR_OBJECT:
{
  "pr_id": "PR3",
  "title": "Strengthen typing and error boundaries",
  "goal": "Add error type guards, reduce any/unknown casting, and guard client-only APIs from SSR while tightening entity shapes.",
  "bucket": "types-domain",
  "included_canonical_ids": [
    "CANON-0010",
    "CANON-0011",
    "CANON-0017",
    "CANON-0023",
    "CANON-0036",
    "CANON-0038",
    "CANON-0042"
  ],
  "risk_level": "medium",
  "estimated_effort": "E1",
  "acceptance_tests": [
    "npm run lint",
    "npm run test"
  ],
  "notes": "Introduce error guard utilities, fix localStorage SSR access, align journal schema types, centralize validation schemas, and remove index-signature escape hatches."
}

CANON_FINDINGS_JSONL:
{"canonical_id":"CANON-0010","category":"Types/Correctness","title":"Add error type guards + normalize error handling across call sites","severity":"S2","effort":"E0","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Error handling patterns vary across components/services","files":["lib/utils/*","components/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Multiple ad-hoc error casts and message extraction patterns","instances":[{"file":"components/*","symbol":"(varies)"}]},"why_it_matters":"Inconsistent error guards hide real failures and complicate telemetry/UI messaging.","suggested_fix":"Introduce a small error utility (isFirebaseError/isErrorWithMessage/getErrorMessage) and migrate call sites.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"types-domain","dependencies":[]}
{"canonical_id":"CANON-0011","category":"Next/React Boundaries","title":"Guard localStorage usage from SSR and hydration edge cases","severity":"S1","effort":"E0","status":"CONFIRMED","final_confidence":85,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"localStorage access occurs outside effects/guards in at least one place","files":["hooks/*","components/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"SSR crashes or hydration mismatch when localStorage accessed during render.","suggested_fix":"Wrap reads in `typeof window !== 'undefined'` and defer to useEffect or lazy initializer; centralize helper if repeated.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"types-domain","dependencies":[]}
{"canonical_id":"CANON-0017","category":"Types/Correctness","title":"Verify and remove unsafe type casts for domain entities (suspected)","severity":"S2","effort":"E1","status":"SUSPECTED","final_confidence":35,"consensus_score":1,"sources":["Gemini"],"confirmations":0,"suspects":1,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"Needs confirmation: casts may be necessary at Firestore boundary","files":["lib/db/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Casts can mask schema drift and produce runtime failures.","suggested_fix":"Replace broad casts with narrow runtime validation or converters; only if truly problematic.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"types-domain","dependencies":[]}
{"canonical_id":"CANON-0023","category":"Types/Correctness","title":"Align runtime validation schemas with TypeScript types (esp. Firestore in/out)","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Validation schemas exist but may drift from TS models","files":["lib/security/firestore-validation.ts","types/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"TS models and runtime validation rules evolve separately","instances":[{"file":"lib/security/firestore-validation.ts","symbol":"(varies)"}]},"why_it_matters":"Type-safe code can still accept invalid data at runtime; drift causes subtle bugs.","suggested_fix":"Centralize schemas (e.g., Zod) and infer TS types or add explicit alignment tests.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"types-domain","dependencies":[]}
{"canonical_id":"CANON-0036","category":"Types/Correctness","title":"Validation schema drift across modules; centralize and reuse","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":65,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Similar validation logic appears in multiple places","files":["lib/security/*","lib/utils/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Duplicated validators / schema fragments","instances":[{"file":"lib/security/*","symbol":"(varies)"}]},"why_it_matters":"Duplicated validators drift and create inconsistent acceptance of data.","suggested_fix":"Create one validation module per domain and re-export from a central index.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"types-domain","dependencies":[]}
{"canonical_id":"CANON-0038","category":"Types/Correctness","title":"Unverified: remove index-signature escape hatches from public entity types (pending verification)","severity":"S2","effort":"E1","status":"SUSPECTED","final_confidence":35,"consensus_score":1,"sources":["ChatGPT"],"confirmations":0,"suspects":1,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"Needs confirmation whether index signatures are used intentionally for Firestore unknown fields","files":["lib/db/quotes.ts","lib/db/slogans.ts","lib/db/meetings.ts"],"symbols":["Quote","Slogan","Meeting"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Index signatures + casts mask schema drift and degrade type safety.","suggested_fix":"Remove index signatures where safe and add runtime validation at boundaries; keep only if truly needed.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"types-domain","dependencies":[]}
{"canonical_id":"CANON-0042","category":"Types/Correctness","title":"Remove Date.now() fallback for missing createdAt/updatedAt in useJournal mapping","severity":"S1","effort":"E1","status":"CONFIRMED","final_confidence":80,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"useJournal maps missing timestamps to Date.now(), which can reorder entries incorrectly","files":["hooks/use-journal.ts","types/journal.ts"],"symbols":["useJournal","JournalEntry"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Old entries can jump to the top and sorting becomes nondeterministic during migrations/partial data.","suggested_fix":"Use null/undefined timestamps and stable ordering fallback; normalize timestamps with a helper and keep raw Firestore Timestamp when possible.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"types-domain","dependencies":[]}

PR4 Payload
PR_OBJECT:
{
  "pr_id": "PR4",
  "title": "Harden rate limiting, storage keys, and listener utilities",
  "goal": "Reduce duplication for rate limiting, localStorage keys, listener patterns, and add missing coverage for write paths.",
  "bucket": "misc",
  "included_canonical_ids": [
    "CANON-0012",
    "CANON-0013",
    "CANON-0014",
    "CANON-0015",
    "CANON-0016",
    "CANON-0026"
  ],
  "risk_level": "medium",
  "estimated_effort": "E2",
  "acceptance_tests": [
    "npm run lint",
    "npm run test"
  ],
  "notes": "Add tests for critical writes, centralize storage keys, reconcile rate limiter presets and client/server duplication, and consolidate skeleton/listener utilities once verified."
}

CANON_FINDINGS_JSONL:
{"canonical_id":"CANON-0012","category":"Testing","title":"Add missing tests for critical write paths (journal/notebook/inventory)","severity":"S1","effort":"E2","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Write paths exist without targeted tests","files":["lib/firestore-service.ts","functions/src/index.ts","tests/*"],"symbols":["saveInventoryEntry","saveNotebookJournalEntry","saveNotebookEntryCallable"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Refactors to shared write surfaces are high risk without tests; regressions cause data loss or silent failures.","suggested_fix":"Add a minimal suite covering success/failure behavior for critical writes (mocked), plus one integration-ish test if feasible.","acceptance_tests":["npm test","npm run test:coverage"],"pr_bucket_suggestion":"misc","dependencies":[]}
{"canonical_id":"CANON-0013","category":"Security","title":"Rate limiter implementations/configs duplicated; reconcile and centralize","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":75,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"RATE_LIMITS exist but exports/usage don't cover all; patterns differ per feature","files":["lib/constants.ts","lib/utils/rate-limiter.ts"],"symbols":["RATE_LIMITS","RateLimiter"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Mismatch between rate limit constants and actual limiter exports/usage","instances":[{"file":"lib/constants.ts","symbol":"RATE_LIMITS"},{"file":"lib/utils/rate-limiter.ts","symbol":"RateLimiter"}]},"why_it_matters":"Inconsistent throttling creates uneven UX and abuse resistance and makes future hardening harder.","suggested_fix":"Ensure all RATE_LIMITS have corresponding limiter exports; standardize usage patterns and add small tests.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"misc","dependencies":[]}
{"canonical_id":"CANON-0014","category":"Hygiene/Duplication","title":"localStorage key strings are scattered; centralize into constants","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":80,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Multiple string literals used as storage keys","files":["hooks/*","components/*","lib/constants.ts"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Repeated storage key string literals across hooks/components","instances":[{"file":"hooks/*","symbol":"(varies)"}]},"why_it_matters":"Key drift causes lost state, broken migrations, and inconsistent behavior across features.","suggested_fix":"Introduce STORAGE_KEYS constants and migrate call sites; consider versioning/migration helper.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"misc","dependencies":[]}
{"canonical_id":"CANON-0015","category":"Hygiene/Duplication","title":"Suspected duplicate skeleton/loading components; verify before consolidating","severity":"S3","effort":"E1","status":"SUSPECTED","final_confidence":30,"consensus_score":1,"sources":["Gemini"],"confirmations":0,"suspects":1,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"Needs confirmation of true duplication and compatibility","files":["components/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Consolidation can cause UI regressions if subtle differences exist.","suggested_fix":"Inventory skeleton components and consolidate only if identical or trivially parameterizable.","acceptance_tests":["Manual UI check"],"pr_bucket_suggestion":"misc","dependencies":[]}
{"canonical_id":"CANON-0016","category":"Hygiene/Duplication","title":"Suspected duplicated listener utilities; verify and centralize if truly repeated","severity":"S3","effort":"E1","status":"SUSPECTED","final_confidence":30,"consensus_score":1,"sources":["Gemini"],"confirmations":0,"suspects":1,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"Needs verification of duplicated listener patterns","files":["hooks/*","lib/utils/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Duplicated listeners are a source of leaks and inconsistent cleanup semantics.","suggested_fix":"Identify common listener pattern and extract helper/hook; ensure cleanup semantics identical.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"misc","dependencies":[]}
{"canonical_id":"CANON-0026","category":"Security","title":"Align rate limiter presets used across features and ensure consistent API","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Multiple limiter presets referenced; naming/usage inconsistent","files":["lib/utils/rate-limiter.ts","components/*"],"symbols":["authLimiter","readLimiter","saveDailyLogLimiter"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Limiter presets exist but feature usage is inconsistent; some presets missing","instances":[{"file":"lib/utils/rate-limiter.ts","symbol":"authLimiter"}]},"why_it_matters":"Inconsistent limiter usage undermines UX predictability and security posture assumptions.","suggested_fix":"Standardize limiter preset names/exports and adopt them consistently at call sites.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"misc","dependencies":["CANON-0013"]}

PR5 Payload
PR_OBJECT:
{
  "pr_id": "PR5",
  "title": "Unify growth card dialogs, notifications, and quote widgets",
  "goal": "Extract shared primitives for growth cards and notifications while deduplicating quote fetching flows.",
  "bucket": "ui-primitives",
  "included_canonical_ids": [
    "CANON-0018",
    "CANON-0022",
    "CANON-0025",
    "CANON-0035"
  ],
  "risk_level": "medium",
  "estimated_effort": "E1",
  "acceptance_tests": [
    "npm run lint",
    "npm run test"
  ],
  "notes": "Refactor growth cards onto a shared wizard, centralize toast/notification handling, provide a shared quote-of-the-day hook/provider, and add a reusable Badge primitive."
}

CANON_FINDINGS_JSONL:
{"canonical_id":"CANON-0018","category":"Hygiene/Duplication","title":"Growth card wizard/save logic duplicated across multiple cards; extract shared primitive","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":80,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Multiple growth cards repeat handleSave patterns with similar UX/toast behavior","files":["components/growth/SpotCheckCard.tsx","components/growth/GratitudeCard.tsx","components/growth/NightReviewCard.tsx","components/growth/Step1WorksheetCard.tsx"],"symbols":["handleSave"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Repeated save flow: guard user, isSaving, save inventory, save notebook journal, toast, close","instances":[{"file":"components/growth/SpotCheckCard.tsx","symbol":"handleSave"},{"file":"components/growth/GratitudeCard.tsx","symbol":"handleSave"},{"file":"components/growth/NightReviewCard.tsx","symbol":"handleSave"},{"file":"components/growth/Step1WorksheetCard.tsx","symbol":"handleSave"}]},"why_it_matters":"Repeated UX/save patterns drift and complicate security/rate limiting changes.","suggested_fix":"Extract a shared hook/component (growth entry wizard) that standardizes save behavior, toast messaging, and cleanup.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"ui-primitives","dependencies":[]}
{"canonical_id":"CANON-0022","category":"Hygiene/Duplication","title":"Quote-of-the-day logic/widgets duplicated; provide shared hook/provider","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Multiple places compute/display quote-of-the-day with similar patterns","files":["components/*","lib/db/quotes.ts"],"symbols":["(varies)","QuotesService.getQuoteForToday"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Repeated quote fetching/display patterns across widgets/pages","instances":[{"file":"lib/db/quotes.ts","symbol":"getQuoteForToday"}]},"why_it_matters":"Duplication increases drift risk (rotation policy, caching, loading UX).","suggested_fix":"Create useQuoteOfTheDay hook/provider and migrate widgets to consume it.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"ui-primitives","dependencies":["CANON-0020"]}
{"canonical_id":"CANON-0025","category":"Hygiene/Duplication","title":"Toast/notification handling duplicated; centralize helper","severity":"S2","effort":"E0","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Repeated toast.success/error patterns across components","files":["components/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Repeated toast messaging conventions and copy","instances":[{"file":"components/*","symbol":"(varies)"}]},"why_it_matters":"Messaging drifts and makes it harder to unify UX and logging.","suggested_fix":"Create notifySuccess/notifyError helper with consistent messaging and optional error normalization.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"ui-primitives","dependencies":["CANON-0010"]}
{"canonical_id":"CANON-0035","category":"Hygiene/Duplication","title":"Badge primitive is duplicated or missing; create reusable Badge component","severity":"S2","effort":"E0","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Badge-like UI appears in multiple components with slight variations","files":["components/*","components/ui/*"],"symbols":["Badge"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Multiple badge-like implementations or style variants","instances":[{"file":"components/*","symbol":"(varies)"}]},"why_it_matters":"UI primitives should be consistent and centralized for maintainability.","suggested_fix":"Add a Badge primitive in components/ui and migrate call sites.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"ui-primitives","dependencies":[]}

PR6 Payload
PR_OBJECT:
{
  "pr_id": "PR6",
  "title": "Consolidate content rotation and CRUD factories",
  "goal": "Create shared utilities for time-based content rotation and Firestore CRUD boilerplate across DB services.",
  "bucket": "hooks-standardization",
  "included_canonical_ids": [
    "CANON-0020",
    "CANON-0021",
    "CANON-0029",
    "CANON-0032",
    "CANON-0045"
  ],
  "risk_level": "medium",
  "estimated_effort": "E2",
  "acceptance_tests": [
    "npm run lint",
    "npm run test"
  ],
  "notes": "Extract rotation helpers for quotes/slogans and introduce a createCrudService factory to reduce duplicated DB boilerplate."
}

CANON_FINDINGS_JSONL:
{"canonical_id":"CANON-0020","category":"Hygiene/Duplication","title":"Time-of-day rotation logic duplicated (quotes vs slogans); extract shared rotation helper","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":85,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Both QuotesService and SlogansService implement similar time-of-day + deterministic selection logic","files":["lib/db/quotes.ts","lib/db/slogans.ts"],"symbols":["QuotesService.getTimeOfDay","QuotesService.getQuoteForNow","SlogansService.getTimeOfDay","SlogansService.getSloganForNow"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Same bucketing and deterministic pick logic duplicated across domains","instances":[{"file":"lib/db/quotes.ts","symbol":"getTimeOfDay"},{"file":"lib/db/slogans.ts","symbol":"getTimeOfDay"}]},"why_it_matters":"Any bug fix or UX tweak must be made twice and will drift over time.","suggested_fix":"Extract shared rotation helper (getTimeOfDay + deterministic pick) and have both services use it; test the helper.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"hooks-standardization","dependencies":[]}
{"canonical_id":"CANON-0021","category":"Hygiene/Duplication","title":"CRUD boilerplate duplicated across DB services; introduce factory (createCrudService)","severity":"S2","effort":"E2","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Repeated getAll/add/update/delete patterns in db modules","files":["lib/db/*"],"symbols":["getAll*","add*","update*","delete*"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Similar CRUD patterns repeated per collection with slight variations","instances":[{"file":"lib/db/*","symbol":"(varies)"}]},"why_it_matters":"Duplication makes typing/validation fixes expensive and error-prone.","suggested_fix":"Create createCrudService factory with typed mapping and optional transform; migrate one module at a time.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"hooks-standardization","dependencies":["CANON-0030"]}
{"canonical_id":"CANON-0029","category":"Hygiene/Duplication","title":"Meeting countdown/widgets share repeated logic; centralize helper/hook","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":65,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Countdown/time formatting logic appears multiple times","files":["components/meetings/*","lib/db/meetings.ts"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Repeated meeting time formatting/countdown computations","instances":[{"file":"components/meetings/*","symbol":"(varies)"}]},"why_it_matters":"Time logic is a drift magnet (time zones, formatting), so duplication multiplies bugs.","suggested_fix":"Create a shared meeting time helper/hook and migrate call sites.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"hooks-standardization","dependencies":[]}
{"canonical_id":"CANON-0032","category":"Hygiene/Duplication","title":"Suspected loading-state boilerplate duplication; consolidate only if verified","severity":"S3","effort":"E1","status":"SUSPECTED","final_confidence":35,"consensus_score":1,"sources":["Gemini"],"confirmations":0,"suspects":1,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"Needs confirmation of repeated loading state patterns","files":["components/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Overzealous consolidation can regress UX if subtle differences exist.","suggested_fix":"Inventory and unify only identical patterns or extract a small helper.","acceptance_tests":["Manual UI check"],"pr_bucket_suggestion":"hooks-standardization","dependencies":[]}
{"canonical_id":"CANON-0045","category":"Testing","title":"No tests cover quote/slogan rotation determinism","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":80,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"UNVERIFIED","verification_notes":"No unit tests found for getQuoteForToday/getSloganForNow","files":["lib/db/quotes.ts","lib/db/slogans.ts","tests/"],"symbols":["QuotesService.getQuoteForToday","SlogansService.getSloganForNow"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Rotation logic can silently drift with time zone/DST changes without tests.","suggested_fix":"Add frozen-time unit tests covering deterministic selection and boundary hours (12/17) or test shared rotation helper.","acceptance_tests":["npm test","npm run test:coverage"],"pr_bucket_suggestion":"tests-hardening","dependencies":["CANON-0020"]}

PR7 Payload
PR_OBJECT:
{
  "pr_id": "PR7",
  "title": "Increase coverage for auth and DB services",
  "goal": "Address critical coverage gaps for account linking and Firestore services.",
  "bucket": "tests-hardening",
  "included_canonical_ids": [
    "CANON-0019",
    "CANON-0027",
    "CANON-0033"
  ],
  "risk_level": "medium",
  "estimated_effort": "E2",
  "acceptance_tests": [
    "npm run test"
  ],
  "notes": "Add targeted suites for account-linking flows, CRUD services, and Cloud Functions to raise coverage and protect data integrity."
}

CANON_FINDINGS_JSONL:
{"canonical_id":"CANON-0019","category":"Testing","title":"Account linking flows lack targeted tests; add coverage around edge cases","severity":"S1","effort":"E2","status":"CONFIRMED","final_confidence":70,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Auth linking is security- and UX-critical; tests are missing or thin","files":["lib/auth/*","tests/*"],"symbols":["linkWithPopup","linkWithCredential"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Linking regressions can lock users out or create duplicate accounts.","suggested_fix":"Add unit tests for linking helpers with mocked Firebase auth; cover error codes and already-linked cases.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"tests-hardening","dependencies":[]}
{"canonical_id":"CANON-0027","category":"Testing","title":"DB service layer lacks tests; add targeted suites for CRUD and mapping helpers","severity":"S2","effort":"E2","status":"CONFIRMED","final_confidence":60,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"DB services implement mapping/selection logic with little unit coverage","files":["lib/db/*","tests/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Refactors to consolidate CRUD and rotation logic are risky without tests.","suggested_fix":"Add unit tests for shared helpers/services first; mock Firestore snapshots or use converters.","acceptance_tests":["npm test"],"pr_bucket_suggestion":"tests-hardening","dependencies":["CANON-0020","CANON-0030"]}
{"canonical_id":"CANON-0033","category":"Testing","title":"Cloud Functions callable wrappers lack tests; add coverage for request/response contracts","severity":"S1","effort":"E2","status":"CONFIRMED","final_confidence":70,"consensus_score":2,"sources":["ChatGPT","Gemini"],"confirmations":2,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Callable usage is central to security posture but contracts aren’t tested","files":["functions/src/index.ts","lib/functions/*","tests/*"],"symbols":["onCall","httpsCallable","callFunction"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Contract regressions break writes and can create security gaps if validation is bypassed.","suggested_fix":"Add tests for callable handlers (unit) and wrappers (client) validating input validation and error mapping.","acceptance_tests":["npm test","npm run test:coverage"],"pr_bucket_suggestion":"tests-hardening","dependencies":["CANON-0028"]}

PR8 Payload
PR_OBJECT:
{
  "pr_id": "PR8",
  "title": "Align journal hook with shared auth state",
  "goal": "Ensure useJournal derives authentication context from the shared provider instead of direct SDK listeners.",
  "bucket": "boundaries",
  "included_canonical_ids": [
    "CANON-0034",
    "CANON-0037"
  ],
  "risk_level": "medium",
  "estimated_effort": "E1",
  "acceptance_tests": [
    "npm run lint",
    "npm run test"
  ],
  "notes": "Remove duplicate auth listeners in useJournal and drop unnecessary page-level use client directives by isolating interactive leaf components."
}

CANON_FINDINGS_JSONL:
{"canonical_id":"CANON-0034","category":"Hygiene/Duplication","title":"useJournal registers its own auth listener; should consume shared auth provider state","severity":"S1","effort":"E1","status":"CONFIRMED","final_confidence":80,"consensus_score":1,"sources":["ChatGPT"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"AuthProvider exists; useJournal also uses onAuthStateChanged directly","files":["components/providers/auth-provider.tsx","hooks/use-journal.ts"],"symbols":["useAuth","useJournal"],"duplication_cluster":{"is_cluster":true,"cluster_summary":"Parallel auth-state sources: provider vs direct auth listener","instances":[{"file":"components/providers/auth-provider.tsx","symbol":"useAuth"},{"file":"hooks/use-journal.ts","symbol":"useJournal"}]},"why_it_matters":"Duplicate listeners and divergent loading states cause subtle bugs and complicate future refactors.","suggested_fix":"Refactor useJournal to rely on useAuth/useAuthCore (or accept userId as param) and remove direct onAuthStateChanged subscription.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"boundaries","dependencies":[]}
{"canonical_id":"CANON-0037","category":"Next/React Boundaries","title":"Reduce unnecessary `use client` at page level by isolating interactive leaf components","severity":"S2","effort":"E1","status":"CONFIRMED","final_confidence":60,"consensus_score":1,"sources":["Gemini"],"confirmations":1,"suspects":0,"tool_confirmed_sources":0,"verification_status":"VERIFIED","verification_notes":"Some page components may be marked client due to a small interactive portion","files":["app/*"],"symbols":["(varies)"],"duplication_cluster":{"is_cluster":false,"cluster_summary":"","instances":[]},"why_it_matters":"Overusing client components reduces SSR benefits and can introduce hydration complexity.","suggested_fix":"Move interactive subtrees into leaf client components; keep pages/layouts server where possible.","acceptance_tests":["npm run lint","npm test"],"pr_bucket_suggestion":"boundaries","dependencies":["CANON-0034"]}

Quick note on “why this fixes your issue”

Now every PR run has:

the canonical requirement text (suggested_fix, files, symbols, dependencies)

the same execution contract

deterministic, comparable outputs for your reviewer/aggregator to validate

If you want, next I can also generate a single “PR Runner” wrapper prompt that says: “Paste the Master Prompt + exactly one PR payload; do not include anything else,” which helps keep Copilot/Claude/Gemini from wandering.

should i be doing something between these PRs?

Yes — but keep it lightweight and repeatable, otherwise you’ll accidentally turn “small PRs” into a never-ending integration project.
Here’s the between-PR checklist I recommend (and why), optimized for your multi-AI pipeline.
Between-PR Checklist (do this every time)
1) Rebase + sanity build


Pull main, rebase/merge your branch strategy.


Run:


npm run lint


npm run test


npm run build (high value for Next.js boundary mistakes)




Why: catches “PR compiles but breaks the app router build” issues early.
2) Lock the new canonical surface (1–2 sentences in a running log)
After each PR, write one tiny note somewhere (even a markdown file like docs/refactor-log.md or a GitHub PR comment):


What became canonical (e.g., “All slogan reads go through SlogansService”)


What is now forbidden (e.g., “No direct collection(db, 'slogans') in components”)


Why: prevents the next AI PR from reintroducing the old pattern.
3) Grep guardrails to prevent drift
After PRs that change a “surface” (Firestore paths, callables, auth), do 2–3 quick searches to ensure the old path/pattern is gone:
Examples:


Old Firestore paths: users/${ / /journalEntries / /journal


Direct callables usage: httpsCallable( (if you standardized on a wrapper)


Auth listeners: onAuthStateChanged( (if you standardized on provider)


Why: this is the fastest way to stop “cross-cutting inconsistency” from creeping back.
4) Update the aggregator’s “state” (don’t re-aggregate)
Don’t ask the aggregator model to re-scan the whole repo between PRs.
Instead, feed it:


the PR diff summary + changed files


any new helper APIs you introduced


any followups you intentionally deferred


Why: re-aggregating every time wastes tokens and causes dedupe noise (“findings about findings”).
5) Run one targeted manual smoke test (2–3 minutes)
Pick a small scenario tied to the PR:


PR touching journal writes: create/edit an entry, ensure it persists


PR touching auth: sign in/out, refresh, verify no flicker


PR touching Growth cards: submit one entry, verify toasts and resulting data


Why: tests don’t catch everything with Firebase + UI state.

When you should do a “bigger” step (occasionally)
After PR1 / PR2 (security + write surfaces)
Do a slightly heavier pass:


Verify Firestore Rules + App Check behavior in your expected envs (dev/stage/prod)


If you use emulators: run emulator tests or a quick manual emulator session


Because: these PRs change trust boundaries and are the easiest to “think” you fixed while leaving a bypass.
Every ~3 PRs: dependency/lockfile cleanup


npm dedupe (if you’re getting dependency churn)


ensure lockfile is stable and committed correctly



One optional but powerful improvement: add a “Refactor Guardrails” doc
A single file REFRACTOR_RULES.md that lists:


canonical Firestore service boundaries


canonical auth state source


canonical callable wrapper


forbidden patterns (direct SDK in UI, raw path strings, etc.)


Then paste it into each implementer prompt as a short “read-only” context.

If you tell me your branch strategy (feature branches → main, or stacked PRs), I’ll tailor the between-PR checklist to avoid merge pain.

