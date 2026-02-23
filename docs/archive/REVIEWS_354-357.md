<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Archived Reviews #354-#357

Reviews archived from AI_REVIEW_LEARNINGS_LOG.md on 2026-02-23.

---

#### Review #354: SonarCloud + Qodo R2 — CC Reduction, DoS Caps, Error Sanitization (2026-02-18)

**Source:** SonarCloud (2 issues) + Qodo Incremental (4 suggestions) + Qodo
Compliance (2 flags) **PR/Branch:** claude/new-session-KE2kF **Suggestions:** 8
total, 6 unique after dedup (Fixed: 5, Rejected: 1)

**Patterns:**

1. **Cognitive Complexity reduction** — `extractReviewIds` CC 22→~8. Extracted
   `parseHeadingIds()` and `parseTableIds()` helpers. Also adopted Set-based
   dedup (`[...new Set([...headings.ids, ...table.ids])]`) replacing O(n) array
   `includes()` checks.
2. **DoS caps** — Range expansion in `parseTableIds` capped at 5000
   (`MAX_RANGE_EXPANSION`). Gap scan loop capped at 10,000 (`MAX_GAP_SCAN_SPAN`)
   with early exit + `process.exitCode = 2`.
3. **Error log sanitization** — All 4 catch blocks now use
   `err instanceof Error ? err.message : String(err)` with
   `.replaceAll(/C:\\Users\\[^\\]+/gi, "[PATH]")` to prevent leaking absolute
   paths in CI logs. Addresses Qodo Secure Error Handling + Secure Logging
   compliance flags.
4. **Nested ternary extraction** — SonarCloud S3358 at L248: replaced
   `fmt === "table" ? "..." : fmt === "mixed" ? "..." : ""` with lookup object
   `FMT_LABELS[fmt] || ""`.

**Rejected:**

- JSONL ordering note — `reviews.jsonl` is managed by the sync tool
  (`npm run reviews:sync`), not this script. Ordering is a sync concern.

**Key Learnings:**

- Extracting regex-parsing loops into pure functions is the most effective CC
  reduction technique for file-scanning scripts
- Set-based dedup at extraction time produces cleaner inventory counts but
  removes within-file duplicate detection (acceptable trade-off)
- DoS caps should be applied to any loop driven by parsed numeric ranges

---

#### Review #355: Gemini Code Assist — EXIT Trap, Evidence Dedup, mktemp Guards (2026-02-19)

**Source:** Gemini Code Assist **PR/Branch:** PR #379 / claude/new-session-DQVDk
**Suggestions:** 4 total (Fixed: 3, Deferred: 1)

**Patterns Identified:**

1. **Silent hook output after POSIX migration** (MAJOR): Replacing
   `exec > >(tee ...)` with `exec > file` makes failures invisible to
   developers. Added EXIT trap that dumps log to stderr on non-zero exit.
2. **Object dedup by reference vs value** (MINOR): `Array.includes()` uses
   reference equality for objects. Evidence arrays in MASTER_DEBT.jsonl had 27
   items with duplicated object entries because dedup-multi-pass.js used
   `.includes()` instead of `JSON.stringify` comparison. Root cause fixed.
3. **mktemp + mv error handling** (MINOR): POSIX mktemp + mv rename pattern
   should guard both commands to prevent orphaned temp files on failure.

**Key Learning:** When replacing bash-isms with POSIX equivalents, audit the DX
impact — POSIX compatibility shouldn't come at the cost of debuggability. The
EXIT trap pattern restores the tee-like behavior for the failure case.

---

#### Review #356: Gemini Code Assist R2 — Evidence Canonicalization, TDMS Data Quality (2026-02-19)

**Source:** Gemini Code Assist R2 **PR/Branch:** PR #379 /
claude/new-session-DQVDk **Suggestions:** 9 unique (after dedup from 15 raw)
(Fixed: 6, Already tracked: 1, Rejected: 2)

**Patterns Identified:**

1. **Key-order-sensitive JSON.stringify** (MAJOR): `JSON.stringify` produces
   different strings for `{a:1,b:2}` vs `{b:2,a:1}`. Evidence objects from
   different audit sources may have identical content but different key order.
   Added recursive canonicalize function that sorts keys before stringify.
2. **TDMS data quality: 246 backslash paths** (MINOR): Windows-originated
   `source_file` paths had backslashes. Fixed in normalize-all.js to prevent
   future occurrences + one-shot cleanup of existing data.
3. **Absolute home-dir paths leaked into TDMS** (MINOR): 50 `file` fields and 1
   intake-log `input_file` contained `/home/user/sonash-v0/...`. Fixed in
   normalize-all.js with repo-root anchor stripping.
4. **Public keys falsely flagged as credentials** (REJECTED): `NEXT_PUBLIC_*`
   Sentry DSN and reCAPTCHA site keys are public by design — they're in client
   bundles. Gemini doesn't distinguish public vs secret keys.

**Key Learning:** TDMS pipeline data quality issues compound — 246 backslash
paths accumulated silently because the normalize script passed them through.
Always normalize at ingestion, not just at display. The propagation check
mindset applies to data pipelines too, not just code patterns.

---

#### Review #357: PR #379 R3 — SonarCloud + Qodo + Gemini Mixed Review (2026-02-20)

**Source:** SonarCloud + Qodo + Gemini **PR/Branch:** PR #379 /
claude/cherry-pick-commits-thZGO **Suggestions:** ~40 total (Critical: 2, Major:
8, Minor: 15, Trivial: 2, Architectural: ~13) (Fixed: 27, Rejected: ~13)

**Process Failure:** This review was handled WITHOUT invoking the `/pr-review`
skill. Jumped directly to fixing without proper intake, categorization, or
learning capture. This entry is retroactive.

**Patterns Identified:**

1. **ReDoS in extract-scattered-debt.js** (CRITICAL): `KEYWORD_RE` used
   `\b(TODO|FIXME|...)(?=[:(\s])` with a lookahead that could backtrack.
   Replaced with anchored `(?=[:(])` without `\s` alternative.
2. **Cognitive complexity via monolithic main()** (MAJOR): Both
   check-backlog-health.js and extract-scattered-debt.js had main() functions
   with CC >15 due to inline result reporting and file scanning. Extracted
   `reportResults`, `collectAllFiles`, `scanFile` helpers.
3. **Block comment detection missing string tracking** (MAJOR): Original
   `updateBlockCommentState` didn't track string literals, so `/*` inside a
   string would toggle comment state. Added `quoteChar` tracking with escape
   handling.
4. **Widen look-back windows for heuristic checks** (MINOR): Gemini flagged
   5-line and 10-line windows as too narrow for detecting try-blocks and
   fallback patterns. Widened to 15 and 20 lines per Gemini suggestion.
5. **appendFileSync without symlink guard** (MAJOR): state-manager.js guarded
   writeFileSync but not appendFileSync, leaving a symlink-attack surface. Added
   `isSafeToWrite` check before append.

**Key Learning:** When a file introduces new functions (like
`updateBlockCommentState`), the function needs the SAME safety invariants as
existing functions in the file. String-literal tracking was present in
`findCommentStart` but absent from the new block-comment functions — a
propagation failure caught only by external review.

---
