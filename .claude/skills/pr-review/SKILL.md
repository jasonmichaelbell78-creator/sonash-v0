---
name: pr-review
description: PR Code Review Processor
---

# PR Code Review Processor

You are about to process AI code review feedback. This is a **standardized,
thorough review protocol** that ensures every issue is caught, addressed, and
documented.

## When to Use

- PR Code Review Processor
- User explicitly invokes `/pr-review`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Scope

- **Formal PR gate reviews** with standardized 8-step protocol
- Processing external review feedback (CodeRabbit, Qodo, SonarCloud)
- Ensuring every issue is fixed or tracked to TDMS before merge

> **Not for ad-hoc development reviews.** Use `code-reviewer` for post-task
> quality checks, quick reviews during development, or pre-merge self-review.

## Core Principles

1. **Fix Everything** - Including trivial items
2. **Learning First** - Create log entry before fixes
3. **Multi-Pass Verification** - Never miss an issue
4. **Parallel Agent Execution** - For 20+ items, spawn specialized agents
5. **Fix-or-Track** - Every issue is either fixed or logged to TDMS with a DEBT
   ID. No silent dismissals.

## Protocol Overview

```
STEP 0: CONTEXT (Load tiered docs)  →  STEP 1: PARSE (Multi-pass + validate)
  →  STEP 1.5: SONARCLOUD ENRICHMENT  →  STEP 2: CATEGORIZE (Severity/Origin)
  →  STEP 3: PLAN (TodoWrite)  →  STEP 4: AGENTS (Parallel if 20+)
  →  STEP 5: FIX (Priority order)  →  STEP 6: DOCUMENT (Deferred/rejected)
  →  STEP 6.5: TDMS  →  STEP 7: LEARNING  →  STEP 7.5: JSONL PIPELINE
  →  STEP 8: SUMMARY  →  STEP 9: COMMIT
```

---

## INPUT: Copy/Paste Feedback

Copy/paste from CodeRabbit, Qodo, SonarCloud, or CI logs provides the most
specific and thorough feedback.

---

## STEP 0.5: PRE-PUSH CHECKS (Mandatory Before First CI Push)

Run ALL applicable checks before the first push. Each prevents known multi-round
churn patterns. See [ARCHIVE.md](ARCHIVE.md) for full evidence.

### 1. New File Pre-Review

New files >500 lines: run `code-reviewer` agent FIRST, fix issues, THEN push.

### 2. Local Pattern Compliance

```bash
npm run patterns:check -- --staged
```

### 3. Security Pattern Sweep

If PR introduces security-adjacent code, grep for unguarded write paths:

```bash
grep -rn 'writeFileSync\|renameSync\|appendFileSync' .claude/hooks/ scripts/ --include="*.js" | grep -v 'isSafeToWrite'
```

### 4. Cognitive Complexity

Pre-commit hook auto-blocks CC >15 on staged files. After extracting helpers,
re-check the ENTIRE file.

### 5. Filesystem Guard Pre-Check

If PR modifies guard functions, verify against full lifecycle matrix (file
exists, doesn't exist, parent doesn't exist, fresh checkout, symlink). See
FIX_TEMPLATES #31, #33.

### 6. Shared Utility Caller Audit

If PR modifies shared utility functions, grep ALL callers and verify
compatibility.

### 7. Algorithm Design Pre-Check

**Trigger:** Non-trivial algorithm or heuristic/analysis function. Design the
full algorithm before committing: define invariants, enumerate edge cases,
handle all input types, add depth/size caps. For heuristics, define a test
matrix of inputs->outputs covering true positives, true negatives, and edge
cases.

### 8. Mapping/Enumeration Completeness

When modifying mapping logic (severity, priority, etc.): list ALL possible input
values and verify each maps correctly. Use case-insensitive matching and `\b`
word boundaries where needed.

### 9. Dual-File JSONL Write Check

If PR modifies scripts that write to MASTER_DEBT.jsonl, verify ALL write paths
also update `raw/deduped.jsonl`.

### 10. Same-File Regex DoS Sweep

After fixing a flagged regex, grep the same file for ALL other vulnerable
regexes. Two-strikes rule: if SonarCloud flags same regex twice, replace with
string parsing.

### 11. Large PR Scope Pre-Check

20+ files? Consider splitting. Grep for shared patterns across all files and fix
in one pass.

### 12. Stale Reviewer HEAD Check

Before investigating reviewer items, compare reviewer's commit against HEAD. If
stale (2+ behind), reject ALL items from that reviewer as a batch.

### 13. Qodo Compliance Batch Rejection

Qodo Compliance re-raises the same items across rounds even when already
rejected. When processing R2+ rounds:

1. Check learning log for prior rejections in the same PR
2. If an item matches a previously rejected item (same rule ID + same file),
   mark as **repeat-rejected** without re-investigating
3. Add a single batch note: "N items repeat-rejected (same justification as RX)"
4. Known repeat offenders: S4036 (PATH binary hijacking on hardcoded
   `execFileSync`), swallowed exceptions in graceful degradation chains

### 14. Cross-Platform Path Normalization

**Trigger:** PR modifies path-handling code (includes, endsWith, has, startsWith
on file paths). Verify ALL string-based path comparisons in modified files use
POSIX-normalized paths. After fixing one path comparison, grep the same file for
all others:

```bash
grep -n 'includes\|endsWith\|\.has(\|startsWith' <modified-file> | grep -iv 'toPosixPath\|normalize'
```

### 15. Logic Fix Test Matrix

**Trigger:** PR fixes logic bugs in pattern-matching, filtering, or detection
code. Before committing, define a test matrix of inputs→outputs covering: (1)
target present + changed, (2) target present + unchanged, (3) target removed +
changed, (4) no target + changed. Validate each case mentally or with examples.

### 16. ESLint Rule CC: Extract Helpers Proactively

**Trigger:** PR adds or modifies ESLint rules. If any `create()` function or
helper has CC >10, extract into helper functions NOW (not after SonarCloud flags
it). Use the visitChild/visitAstChild pattern from `ast-utils.js` (see
FIX_TEMPLATE #42). Target CC ≤10 (not ≤15) to leave margin for future additions.

```bash
# Quick CC estimate — count branching keywords in a function
grep -c 'if\|&&\|||\|case\|?\|catch' eslint-plugin-sonash/rules/<rule>.js
```

### 17. Fix-One-Audit-All Propagation Check

**Trigger:** PR fixes a bug or adds handling for a pattern (ChainExpression,
path normalization, guard pattern, etc.) in one file. Before committing, grep
the codebase for ALL other instances of the same pattern gap:

```bash
# Example: after adding ChainExpression unwrap to one rule
grep -rn 'node\.type\|callee\.type\|expression\.type' eslint-plugin-sonash/rules/ --include="*.js" | grep -v 'unwrapNode\|ChainExpression'

# Example: after fixing path normalization in one file
grep -rn 'includes\|endsWith\|\.has(\|startsWith' scripts/ --include="*.js" | grep -iv 'toPosixPath\|normalize'
```

If any other files have the same gap, fix them in the same commit to prevent
review ping-pong. See pr-retro Pattern 13 (Fix-One-Audit-All).

### 18. Test-Production Regex Sync

**Trigger:** PR modifies a regex in a checker or compliance script. After
updating the production regex, verify that corresponding test files use the
matching pattern. Regex changes that break tests cause avoidable review rounds.

```bash
# After modifying a regex in a checker script, find the corresponding test
grep -rn 'pattern_you_changed' tests/ --include="*.test.*"
```

Source: PR #396 retro (Chain 1: test regex not updated with production regex,
~0.5 avoidable rounds).

---

## STEP 0: CONTEXT LOADING

### 0.1 Episodic Memory Search

Search episodic memory for relevant past reviews.

### 0.2 Tiered Document Loading

| Tier | When          | Documents                                                              |
| ---- | ------------- | ---------------------------------------------------------------------- |
| 1    | Always        | `claude.md` (root)                                                     |
| 2    | Quick Lookup  | `docs/agent_docs/CODE_PATTERNS.md`, `docs/agent_docs/FIX_TEMPLATES.md` |
| 3    | Investigating | `docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/AI_REVIEW_PROCESS.md`         |
| 4    | Rarely        | `docs/archive/REVIEWS_*.md`                                            |

---

## STEP 1: INITIAL INTAKE & PARSING

1. **Identify source** (CodeRabbit, Qodo, SonarCloud, Mixed)
2. **Extract ALL suggestions** - For >200 lines: 3-pass extraction
3. **Announce count**: "I identified **N total suggestions**"
4. **Validate critical claims** - Before accepting "data loss" claims, verify
   via `git log --all --grep` and `git log --follow`
5. **Stale HEAD check** - Verify reviewer analyzed current HEAD, not stale
   commit

---

## STEP 1.5: SONARCLOUD ENRICHMENT (Automatic)

When SonarCloud issues detected, auto-fetch code snippets. Triggers on
`javascript:S####` rule IDs or SonarCloud labels.

> **Details:** See
> [reference/SONARCLOUD_ENRICHMENT.md](reference/SONARCLOUD_ENRICHMENT.md)

---

## STEP 2: CATEGORIZATION (ALWAYS)

**Severity:** CRITICAL (security/data loss) | MAJOR (bugs/perf) | MINOR
(style/tests) | TRIVIAL (typos) -- Fix ALL levels, no skipping.

**Origin (MANDATORY):**

| Origin                    | Action                                  |
| ------------------------- | --------------------------------------- |
| **This-PR**               | Must fix                                |
| **Pre-existing, fixable** | Fix now (< 5 min)                       |
| **Pre-existing, complex** | Track via `/add-debt` with DEBT-XXXX ID |
| **Architectural**         | Flag to user -- do NOT silently dismiss |

---

## STEP 3: CREATE TODO LIST

Use **TodoWrite** for ALL issues. Learning log entry (`#TBD` stub) is ALWAYS the
FIRST todo item.

---

## STEP 4: INVOKE SPECIALIZED AGENTS

**Parallel** for 20+ items across 3+ files/concerns. **Sequential** otherwise.

| Issue Type   | Agent                                       |
| ------------ | ------------------------------------------- |
| Security     | `security-auditor`                          |
| Tests        | `test-engineer`                             |
| Performance  | `performance-engineer`                      |
| Docs         | `technical-writer`                          |
| Architecture | `backend-architect` or `frontend-developer` |
| Code quality | `code-reviewer`                             |

**CRITICAL RETURN PROTOCOL:** Agents return ONLY:
`COMPLETE: [agent-id] fixed N items in [file-list]`

> **Details:** See
> [reference/PARALLEL_AGENT_STRATEGY.md](reference/PARALLEL_AGENT_STRATEGY.md)

---

## STEP 5: ADDRESS ISSUES (In Priority Order)

### 5.1 Fix Order

CRITICAL (separate commit) -> MAJOR (batch related) -> MINOR (batch by file) ->
TRIVIAL (batch all).

### 5.2 For Each Fix

- Check FIX_TEMPLATES first for copy-paste fixes
- Read file, understand context, apply fix
- **PROPAGATION CHECK (MANDATORY)** - grep entire codebase for same pattern, fix
  ALL instances before committing
- Verify fix doesn't introduce new issues
- Two-strikes regex rule (see FIX_TEMPLATES #21)

### 5.3 Verification Passes

1. Re-read each modified file
2. `npm run lint`
3. `npm run test`
4. `npm run patterns:check`
5. Cross-reference original suggestions

### 5.4 Propagation Check

When fixing pattern-based issues, search ALL instances before committing:

```bash
grep -rn "PATTERN" scripts/ .claude/hooks/ --include="*.js"
```

**Search patterns:** Missing symlink guards, try/catch, atomic writes, statSync
vs lstatSync, env var validation, POSIX compliance, realpathSync guards, path
containment, shared util changes, dual-file JSONL.

### 5.5 Input Validation Completeness

When adding validation for user-controlled values, implement the FULL chain:
type check, trim, empty check, format, length limit, encoding safety.

---

## STEP 6: DOCUMENT DECISIONS

Every non-fixed item MUST have a DEBT ID or explicit user sign-off. Use strict
templates for Deferred (with DEBT-XXXX), Architectural (raise to user), and
Rejected (specific justification) items.

---

## STEP 6.5: TDMS INTEGRATION

Use `/add-debt` for deferred items. Severity mapping: CRITICAL->S0, MAJOR->S1,
MINOR->S2, TRIVIAL->S3.

> **Details:** See
> [reference/TDMS_INTEGRATION.md](reference/TDMS_INTEGRATION.md)

---

## STEP 7: LEARNING CAPTURE (MANDATORY)

Finalize review number, complete learning entry, run
`npm run reviews:sync -- --apply`.

> **Details:** See
> [reference/LEARNING_CAPTURE.md](reference/LEARNING_CAPTURE.md)

---

## STEP 7.5: JSONL PIPELINE

> This step writes structured data to the v2 JSONL pipeline. The JSONL record is
> the source of truth; the markdown learning log entry (Step 7) is a
> human-readable view that coexists during transition.

### 7.5.1 Write Review Record

```bash
cd scripts/reviews && npx tsc && node dist/write-review-record.js --data '{"pr":PR_NUM,"title":"PR #N RX - Source","date":"YYYY-MM-DD","schema_version":1,"completeness":"full","completeness_missing":[],"origin":{"type":"pr-review","pr":PR_NUM,"round":ROUND,"tool":"write-review-record.ts"},"source":"SOURCE","total":TOTAL,"fixed":FIXED,"deferred":DEFERRED,"rejected":REJECTED,"patterns":["pattern1"],"learnings":["learning1"],"severity_breakdown":{"critical":N,"major":N,"minor":N,"trivial":N},"per_round_detail":null,"rejection_analysis":null,"ping_pong_chains":null}'
```

Fill in actual values from the review. The `id` will be auto-assigned.

### 7.5.2 Create Deferred Items (if deferred > 0)

```bash
node dist/write-deferred-items.js --review-id REV_ID --date YYYY-MM-DD --items '[{"finding":"description","severity":"major"}]'
```

Create one item per deferred finding from Step 6.

### 7.5.3 Track Invocation

```bash
node dist/write-invocation.js --data '{"skill":"pr-review","type":"skill","duration_ms":null,"success":true,"error":null,"context":{"pr":PR_NUM,"trigger":"user-invoked"}}'
```

---

## STEP 8: FINAL SUMMARY

Statistics (total/fixed/deferred/rejected), files modified, agents invoked,
learning entry number, TDMS items, verification checklist, commit message.

---

## STEP 9: COMMIT

Prefix: `fix:` for bugs, `docs:` for documentation. Body: reference review
source. Separate commits for Critical fixes if needed.

---

## IMPORTANT RULES

1. **NEVER skip trivial items** - Fix everything
2. **ALWAYS create learning entry FIRST**
3. **ALWAYS read files before editing**
4. **ALWAYS verify fixes** - Multiple passes
5. **USE PARALLEL AGENTS for 20+ items**
6. **NEVER silently ignore** - Document all decisions
7. **NEVER dismiss as "pre-existing"** - Fix or track with DEBT ID

**Commands:** `npm run lint`, `npm run test`, `npm run patterns:check`

**Files to Update:** All review files + `docs/AI_REVIEW_LEARNINGS_LOG.md`

---

## Update Dependencies

| Document                           | What to Update            |
| ---------------------------------- | ------------------------- |
| `docs/SLASH_COMMANDS_REFERENCE.md` | `/pr-review` section      |
| `docs/AI_REVIEW_PROCESS.md`        | Related workflow sections |

---

## Version History

| Version | Date       | Description                                                                                         |
| ------- | ---------- | --------------------------------------------------------------------------------------------------- |
| 3.6     | 2026-02-28 | Add JSONL pipeline step (Step 7.5) for v2 data capture                                              |
| 3.5     | 2026-02-26 | Add pre-checks #16 (ESLint CC extraction) and #17 (fix-one-audit-all). Source: PR #393/#394 retros. |
| 3.4     | 2026-02-25 | Add pre-checks #14 (path normalization) and #15 (logic test matrix). Source: PR #392 retro.         |
| 3.3     | 2026-02-25 | Add Qodo Compliance batch rejection pre-check. Source: PR #390/#391 retro.                          |
| 3.2     | 2026-02-24 | Trim to <500 lines: archive evidence to ARCHIVE.md, condense pre-checks                             |
| 3.1     | 2026-02-24 | Add Stale Reviewer HEAD Check, expand heuristic test matrix. Source: PR #388.                       |
| 3.0     | 2026-02-23 | Add Local Pattern Compliance Check — mandatory pre-push. Source: PR #384.                           |
| 2.9     | 2026-02-22 | Add dual-file JSONL write check. Source: PR #383.                                                   |
| 2.8     | 2026-02-20 | Add mapping/enumeration + regex DoS sweep pre-checks. Source: PR #382.                              |
