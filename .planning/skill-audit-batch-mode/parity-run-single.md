# Parity Test — Run 1 (single mode)

**Target:** recall **Mode:** single (Phase 2a) **Started:** 2026-04-15 (Session
#282) **Scope:** Findings only (categories 1-12). No decisions, no Phase 3+.

---

## Findings by Category

### Category 1: Intent Fidelity — 7/10

**Pros:** (1) All 4 tagline modes implemented in Input block; (2) body exceeds
tagline with `--target=sources` and `--stats`; (3) Critical Rule 1 auto-rebuild
makes missing-index a non-error path; (4) category-aware tag groupings deliver
"find specific ideas"; (5) v1.1 scoped to T40 Part C — semantic tagline
alignment.

**Cons:** (1) "across all analyzed sources" promise has no cross-source example
in body; (2) "extraction candidates" undefined inline; (3) "Part of T28 CAS" is
internal marker, not routing guidance; (4) result ranking semantics (BM25→id
DESC) only in REFERENCE.md.

**Gaps:** (1) No When-to-Use; (2) No When-NOT-to-Use (both required by
SKILL_STANDARDS); (3) No success criteria; (4) FTS5 syntax promise
(phrase/OR/NOT/prefix) only in REFERENCE.md.

**Suggestions:** A. Add When-to-Use + When-NOT-to-Use (ACCEPT — structural req).
B. Define "extraction candidate" inline (ACCEPT — one sentence). C. Surface FTS5
syntax in SKILL.md (REJECT — keep in REFERENCE.md, link instead).

**Opportunities:** "Common query patterns" mini-section (e.g.,
`--tag=anti-pattern --type=repo`).

**Meta:** AskUserQuestion usage = none. Confidence = high.

### Category 2: Workflow Sequencing — 7/10

**Pros:** (1) 4-step linear flow appropriate to query-skill scope; (2)
missing-index path documented; (3) three presentation variants covered; (4)
follow-up options give defined terminal step.

**Cons:** (1) Auto-rebuild documented twice (§When-Index-Missing + Critical
Rule 1) but not in "How It Works" — sequencing not canonicalized; (2) no
explicit routing rule for which presentation variant fires when; (3) no
error-path sequencing for query parse failures.

**Gaps:** (1) No "step 0: check/rebuild index" in flow; (2) no combined-filter
sequencing statement in SKILL.md (only in REFERENCE.md §1.2); (3) no
neighbor-handoff (`/synthesize`) in follow-up options.

**Suggestions:** A. Fold auto-rebuild into step 0 (ACCEPT — canonicalizes). B.
Presentation-mode routing line (ACCEPT — removes ambiguity). C. Parse-error
clause (ACCEPT minor). D. Handoff to `/synthesize` in follow-ups (ACCEPT).

**Opportunities:** None substantive.

**Meta:** Confidence = medium (category loose-fit for query skill).

### Category 3: Input/Output Quality — 6/10

**Pros:** (1) Exhaustive flag enumeration + combined-filter example block; (2)
three result shapes have literal examples; (3) default limit stated (20); (4)
Critical Rules pin auto-rebuild + result count + empty-path behavior; (5) tag
grouping mapped to CONVENTIONS.md §14 versioned contract.

**Cons:** (1) "Always show result count" format unpinned (Found N vs variant?);
(2) `--sort` values mentioned but not enumerated as a valid-values list; (3)
`--stats` four groupings prose-only, no literal example; (4) empty-result
phrasing not exemplified in presentation section.

**Gaps:** (1) No input validation contract (bogus `--type=` → ?); (2) no
JSON→human schema anchor for consumer/test verification; (3) no "Done when:"
criterion; (4) bare `/recall` behavior unspecified; (5) zero-sources output
format unpinned.

**Suggestions:** A. Enumerate `--sort` values (ACCEPT). B. "Done when:"
criterion (ACCEPT). C. Bare-invocation default (ACCEPT). D. Literal `--stats`
example (ACCEPT — matches existing pattern). E. Invalid-flag contract (ACCEPT
minor). F. Link Critical Rule 2 to REFERENCE.md schema (ACCEPT).

**Opportunities:** `--format=json` flag for programmatic consumers (scope
expansion, flag-only).

**Meta:** Confidence = high (surface concretely verifiable).

### Category 4: Decision Points — 6/10

**Pros:** (1) Four explicit post-result follow-up paths; (2) empty-result path
has refinement suggestion; (3) zero forced questions — flags do all capture at
invocation; (4) "Done" is a first-class exit option.

**Cons:** (1) Follow-up #1 doesn't specify which analysis (top/selected/all);
(2) #2 "Narrow search" filter source unstated; (3) #3 "Show related" relation
unspecified; (4) multi-value flag inference not declared (`--tag=a --tag=b`
behavior undefined).

**Gaps:** (1) Follow-up option mechanics unpinned — labels without contracts;
(2) multi-value flag semantics silent; (3) no "did you mean" disambiguation for
misspelled tags; (4) no last-result context capture for sequential
narrow/related follow-ups.

**Suggestions:** A. Pin follow-up mechanics — 1 line per option (ACCEPT). B.
Declare multi-value flag semantics (ACCEPT — closes silent-failure vector). C.
Disambiguation hint on empty results (ACCEPT nice-to-have). D. Capture
last-result context (DEFER — recall.js change, out of skill-surface scope).

**Opportunities:** None — decision surface correctly minimal.

**Meta:** Confidence = medium-low (category loose-fit).

### Category 5: Integration Surface — 5/10

**Pros:** (1) Version history ties to T28 CAS + T40 Part C; (2) clean
skill/script separation (recall.js sole backend); (3) auto-rebuild hook into
rebuild-index.js explicit; (4) tag grouping anchored to CONVENTIONS.md §14.

**Cons:** (1) No mention of peer skills (`/analyze`, `/synthesize`) in body; (2)
only "Part of T28 CAS" tagline-mention ties recall to cluster; (3) follow-up #4
dead-ends to conversation with no route forward; (4) `.research/` input shape
contract with `/analyze` not declared — silent-break vector.

**Gaps:** (1) No Integration section (structural peer-parity gap); (2) no
neighbor routing; (3) no declared contract with `.research/` input shape; (4) no
`/recall` → `/gsd:add-todo` handoff; (5) no auto-rebuild failure recovery
contract.

**Suggestions:** A. Add Integration section with
neighbors/inputs/outputs/handoff (ACCEPT — peer parity). B. Forward-route
follow-ups to `/synthesize` (ACCEPT). C. Declare `.research/` input-shape
contract (ACCEPT — silent-break mitigation). D. `/gsd:add-todo` handoff hint
(ACCEPT minor). E. Document auto-rebuild failure recovery (ACCEPT).

**Opportunities:** None substantive.

**Meta:** Confidence = high (surface mechanically inspectable).

### Category 6: Guard Rails — 5/10

**Pros:** (1) Auto-rebuild on missing index is explicit recovery; (2) follow-up
#4 "Done" = clean disengagement; (3) empty-result path has refinement
suggestion; (4) atomic single-query — no runaway-scope risk.

**Cons:** (1) No failure recovery for non-zero `recall.js` exits; (2) no
auto-rebuild failure recovery (cascade gap); (3) no warnings for known misuses
(invalid flag values, vocabulary mismatches); (4) no concurrency guard
documented for auto-rebuild.

**Gaps:** (1) No anti-patterns list; (2) no `--limit` ceiling; (3) no non-zero
exit handling; (4) no auto-rebuild failure recovery contract; (5) no
concurrent-invocation discussion; (6) no FTS5 syntax error path.

**Suggestions:** A. Anti-Patterns mini-section (ACCEPT). B. `--limit` ceiling
(ACCEPT). C. Non-zero exit behavior (ACCEPT). D. Auto-rebuild failure recovery
(ACCEPT). E. FTS5 syntax error path (ACCEPT minor). F. Concurrency note (DEFER —
verify lockfile exists first).

**Opportunities:** None substantive.

**Meta:** Confidence = medium (some failure modes theoretical).

### Category 7: Prompt Engineering Quality — 6/10

**Pros:** (1) 142 lines, well under 300-line target; (2) REFERENCE.md extracts
SQL/FTS5 internals; (3) concrete literal examples throughout; (4) compressed
Input block; (5) 2-row version history.

**Cons:** (1) Critical Rules at line 128 (bottom third) — primacy violation per
SKILL_STANDARDS.md; (2) no MUST/SHOULD/MAY hierarchy — all 4 rules flat; (3)
auto-rebuild documented in 3 places; (4) follow-up labels terse (#4 "Return to
conversation" underspecified).

**Gaps:** (1) Critical Rules buried at bottom; (2) no MUST/SHOULD/MAY markers;
(3) no repeat of critical rules at point-of-use.

**Suggestions:** A. Move Critical Rules to top (ACCEPT — primacy fix). B.
MUST/SHOULD/MAY markers (ACCEPT — Rule 1/2 MUST, 3/4 SHOULD). C. Dedupe
auto-rebuild to single canonical location (ACCEPT — drift reduction). D. Expand
follow-up option labels (ACCEPT — cross-refs Cat 4). E. Add
When-to-Use/NOT-to-Use (ACCEPT — cross-refs Cat 1).

**Opportunities:** None substantive.

**Meta:** Confidence = high (attention-mgmt mechanically inspectable).

### Category 8: Scope Boundaries — 5/10

**Pros:** (1) Scope intrinsically bounded — "query" is clean concept; (2) all 8
query modes read-only; (3) auto-rebuild narrowly scoped to index recovery; (4)
v1.1 scopes T40 Part C change explicitly.

**Cons:** (1) No neighbor-differentiation — `/recall` vs `/synthesize` boundary
unstated; (2) only "Part of T28 CAS" positions recall in the cluster; (3) no
explicit scope-out list; (4) no positive statement that recall is non-mutation
(beyond rebuild).

**Gaps:** (1) No Routing Guide (peer skills have one); (2) no
When-to-Use/NOT-to-Use (cross-refs Cat 1/7); (3) no scope-out list; (4) no GSD
boundary note for peer-parity; (5) no handoff to `/synthesize` on query
patterns.

**Suggestions:** A. Add Routing Guide (ACCEPT). B. When-to-Use/NOT-to-Use with
neighbor routing (ACCEPT — consolidates Cats 1/5/7/8). C. Explicit scope-out
list (ACCEPT). D. Cross-reference `/synthesize` (ACCEPT — compounds Cat 5).

**Opportunities:** One-line "scope" tagline augmentation ("Read-only query
surface over the CAS index").

**Meta:** Confidence = high.

### Category 9: Institutional Memory — 6/10

**Pros:** (1) Multiple project-specific anchors (recall.js, .research/,
rebuild-index.js, CONVENTIONS.md §14, T28/T40); (2) convention deferred not
duplicated (tag grouping → CONVENTIONS.md §14); (3) version history ties to
track IDs + session markers; (4) data format (SQLite + JSON) appropriate; (5)
Critical Rule 4 implicitly references vocabulary.

**Cons:** (1) No retro/learning loop after queries; (2) no rationale captured
for Critical Rules ("why" missing); (3) T40 Part C lesson implicit — version
history says what, not why; (4) no cross-ref to CAS
LEARNINGS/extraction-journal.

**Gaps:** (1) No learning loop on empty-result; (2) no link to project-level
docs beyond CONVENTIONS.md §14; (3) no rationale anchors in Critical Rules; (4)
no audit integration (N/A for query skill); (5) version history lacks rationale.

**Suggestions:** A. Retro prompt on empty-result (ACCEPT — turns dead-end into
learning). B. One-line rationale anchors in Critical Rules (ACCEPT). C. Expand
version history rationale (ACCEPT). D. Cross-reference CAS
architecture/ROADMAP.md T28 (ACCEPT minor). E. Retro-capture follow-up #5 (DEFER
— overlaps Cat 5 D).

**Opportunities:** None substantive.

**Meta:** Confidence = high.

### Category 10: User Experience — 7/10

**Pros:** (1) Clean visual structure (headers, code blocks, bold labels); (2)
result presentation scannable with concrete field labels; (3) "Found N results
for X:" natural opener; (4) structured follow-up closure with first-class
"Done"; (5) empty-result soft-fails via Rule 4; (6) three result shapes have
shape-specific formatting.

**Cons:** (1) No preflight echo — silent on flag typos; (2) no warm-up —
acceptable for fast queries, but auto-rebuild is long without feedback; (3)
rigid follow-up (4 options, no free-form); (4) no explicit tail closure signal;
(5) auto-rebuild placeholder opaque — can take minutes with no progress.

**Gaps:** (1) No auto-rebuild progress signal (biggest UX hole); (2) no
query-plan preview; (3) no "you're in /recall" context marker; (4) no welcoming
prompt; (5) empty-field rendering undocumented.

**Suggestions:** A. Preflight echo line (ACCEPT — cheap typo-catcher). B.
Auto-rebuild progress indicator (ACCEPT — biggest fix). C. Explicit closure
signal (ACCEPT minor). D. Free-form follow-up allowance (ACCEPT). E. Empty-field
rendering spec (ACCEPT minor).

**Opportunities:** Visual novelty marker (⚡) — design refresh, out of scope.

**Meta:** Confidence = high.

### Category 11: Convergence Loop Integration (T25) — N/A

**Applicability:** recall has no discovery/verification/iterative-refinement
phase. Per Cat 11 scoring guide, N/A — excluded from total (denominator 100→90).

**Pros:** (1) Atomic single-pass execution correct for a query skill; (2) no
contrived discovery phase. **Cons:** None applicable. **Gaps:** None applicable.
**Suggestions:** None. **Meta:** Confidence = high (N/A determination
mechanical).

### Category 12: Completion Verification Design — N/A (Simple tier)

**Applicability:** recall is Simple tier (atomic query, no phases, no artifacts,
no decisions). Per SKILL_STANDARDS.md "Standard and Complex skills MUST include
a self-audit phase" — Simple exempt. If forced to score: 7/10.

**Pros:** (1) Atomic execution — no partial-state recovery needed; (2) Critical
Rules 3+4 function as lightweight dim-5 functional verification; (3) no false
self-audit phase tacked on.

**Cons:** (1) No explicit tier classification — future auditors may question why
self-audit missing; (2) implicit recall.js contract unverified; (3) no
regression baseline at skill level; (4) no partial-execution detection for
interrupted auto-rebuild.

**Gaps:** (1) No explicit "tier: Simple" declaration; (2) no contract
verification for recall.js → skill JSON handoff; (3) no stale-index detection;
(4) no regression hook on Critical Rules.

**Suggestions:** A. Add explicit tier classification (ACCEPT — removes
ambiguity). B. Pin recall.js output-schema contract in REFERENCE.md (ACCEPT —
cross-refs Cat 3 F). C. Stale-index detection (DEFER — recall.js change). D.
Index-freshness self-check (DEFER — scope expansion).

**Opportunities:** Canonical Simple-tier self-audit pattern (cross-skill work,
out of scope).

**Meta:** Confidence = medium (tier classification is judgment call).

---

## Run 1 Summary

- **Categories scored:** 10 of 12 (Cat 11 + 12 = N/A for Simple tier)
- **Composite:** 60/80 → **75/100 (adjusted for N/A)**
- **Score distribution:** 1×7, 2×6, 2×6, 1×7, 2×5, 1×5, 1×6 =
  {7,7,6,6,5,5,6,5,6,7}
- **Lowest:** Cat 5 (Integration Surface), Cat 6 (Guard Rails), Cat 8 (Scope
  Boundaries) — all 5/10
- **Highest:** Cat 1, Cat 2, Cat 10 — 7/10
- **Total findings:** ~40 suggestions across all categories, ~85% ACCEPT, ~15%
  DEFER/REJECT
- **Recurring themes:** missing required sections (When-to-Use/NOT, Integration,
  Routing), contract gaps (recall.js schema, `.research/` input shape), UX
  auto-rebuild progress, Critical Rules buried at bottom
- **Stop point:** Run 1 complete at findings level; no Phase 2.B decisions
  collected per parity test scope.
