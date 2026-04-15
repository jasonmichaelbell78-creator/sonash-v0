# Parity Test — Run 2 (batch mode)

**Target:** recall **Mode:** batch (Phase 2b) **Started:** 2026-04-15 (Session
#282) **Scope:** Findings only (all 12 categories produced at once). No Phase
2.B decisions. **Bias disclosure:** Same-session as Run 1 — working memory
overlap is unavoidable. Run 2 approached via batch-mode framing (cross-category
synthesis, terser per-cat, pattern-surfacing).

---

## Phase 2b Findings — Batched

### Cross-Category Patterns (surfaced by batch framing)

Before per-category findings, three patterns jump out when looking at the skill
whole:

1. **Missing required sections cascade** — absence of When-to-Use /
   When-NOT-to-Use / Routing Guide hits Cat 1 (intent fidelity), Cat 5
   (integration), Cat 7 (primacy anchors), Cat 8 (scope boundaries). Fixing
   these three sections resolves 4 categories' worth of findings
2. **Implicit contracts are the central risk class** — recall.js JSON shape,
   `.research/` input shape, FTS5 syntax surface, `--sort` valid values,
   `--limit` ceiling, bare-invocation behavior, empty-field rendering. Cat 3,
   Cat 5, Cat 6, Cat 12 all converge on this theme: the skill delegates much to
   implementation without pinning contracts
3. **Auto-rebuild is underserved** — mentioned 3× in the skill (§When Index
   Missing, Rule 1, implicit step 2 in How It Works) but has no progress
   indicator (Cat 10), no failure-recovery contract (Cat 6), no stale-detection
   (Cat 12), no concurrency guard (Cat 6). The skill's longest-running operation
   has the thinnest UX and resilience surface

### Category 1 — Intent Fidelity — 7/10

- Pros: all 4 tagline modes implemented; body exceeds tagline
  (`--target=sources`, `--stats`); auto-rebuild exceeds "just works" promise;
  category-aware tags deliver "specific ideas"
- Cons: "across all sources" promise lacks cross-source example; "extraction
  candidate" undefined; "Part of T28 CAS" is internal marker not routing; result
  ranking (BM25→id DESC) only in REFERENCE.md
- Gaps: no When-to-Use; no When-NOT-to-Use; no success criteria; FTS5 syntax
  promise only in REFERENCE.md
- Suggestions: A. Add When-to-Use + When-NOT-to-Use (ACCEPT). B. Define
  "extraction candidate" inline (ACCEPT). C. Surface FTS5 syntax in SKILL.md
  (REJECT — belongs in REFERENCE.md)
- Meta: confidence high

### Category 2 — Workflow Sequencing — 7/10

- Pros: 4-step flow appropriate to query-skill scope; missing-index path
  documented; three presentation variants covered; follow-up options = defined
  terminal
- Cons: auto-rebuild in 3 locations not canonicalized; no routing rule for which
  presentation variant fires; no error-path sequencing for FTS5 parse failures
- Gaps: no "step 0: check/rebuild" in flow; no combined-filter sequencing in
  SKILL.md; no neighbor-handoff in follow-ups
- Suggestions: A. Fold auto-rebuild into step 0 (ACCEPT). B. Presentation-mode
  routing line (ACCEPT). C. Parse-error clause (ACCEPT). D. `/synthesize`
  handoff in follow-ups (ACCEPT)
- Meta: confidence medium (loose-fit)

### Category 3 — Input/Output Quality — 6/10

- Pros: exhaustive flag enumeration + combined examples; three result shapes
  have literal examples; default limit stated; Critical Rules pin behavioral
  output contracts; tag grouping versioned via CONVENTIONS.md §14
- Cons: result-count format unpinned; `--sort` values mentioned not enumerated;
  `--stats` prose-only (no literal example); empty-result phrasing not
  exemplified
- Gaps: no input validation contract (bogus `--type=`?); no JSON→human schema
  anchor; no "Done when:"; bare `/recall` behavior unspecified; zero-sources
  output unpinned
- Suggestions: A. Enumerate `--sort` values (ACCEPT). B. "Done when:" criterion
  (ACCEPT). C. Bare-invocation default (ACCEPT). D. Literal `--stats` example
  (ACCEPT). E. Invalid-flag contract (ACCEPT minor). F. Link Rule 2 to
  REFERENCE.md schema (ACCEPT)
- Opportunities: `--format=json` for programmatic consumers (scope expansion)
- Meta: confidence high

### Category 4 — Decision Points — 6/10

- Pros: 4 explicit post-result follow-up paths; empty-result refinement
  suggestion; zero forced questions — flags do all capture; "Done" is
  first-class exit
- Cons: follow-up #1 doesn't specify which analysis; #2 filter source unstated;
  #3 relation unspecified; multi-value flag inference not declared
- Gaps: follow-up option mechanics unpinned (labels without contracts);
  multi-value flag semantics silent; no "did you mean"; no last-result context
  capture
- Suggestions: A. Pin follow-up mechanics per option (ACCEPT). B. Declare
  multi-value flag semantics (ACCEPT). C. Disambiguation hint on empty (ACCEPT).
  D. Capture last-result context (DEFER — recall.js change)
- Meta: confidence medium-low (category loose-fit for query skill)

### Category 5 — Integration Surface — 5/10

- Pros: T28 CAS + T40 Part C provenance; clean skill/script separation;
  auto-rebuild hook into rebuild-index.js explicit; CONVENTIONS.md §14 deferral
- Cons: no peer-skill mention in body; "Part of T28 CAS" is the only cluster
  tie; follow-ups dead-end; `.research/` contract with `/analyze` not declared
- Gaps: no Integration section (peer-parity gap); no neighbor routing; no
  declared `.research/` contract; no `/gsd:add-todo` handoff; no auto-rebuild
  failure recovery contract
- Suggestions: A. Integration section with neighbors/inputs/outputs/handoff
  (ACCEPT). B. Forward-route follow-ups (ACCEPT). C. Declare `.research/`
  contract (ACCEPT — silent-break mitigation). D. `/gsd:add-todo` handoff
  (ACCEPT minor). E. Document auto-rebuild failure recovery (ACCEPT)
- Meta: confidence high

### Category 6 — Guard Rails — 5/10

- Pros: auto-rebuild = explicit recovery; follow-up #4 = clean disengagement;
  empty-result refinement; atomic single-query — no runaway scope
- Cons: no failure recovery for non-zero recall.js exits; no auto-rebuild
  failure recovery cascade; no misuse warnings; no concurrency guard
- Gaps: no anti-patterns list; no `--limit` ceiling; no non-zero exit handling;
  no auto-rebuild failure recovery; no concurrency discussion; no FTS5 syntax
  error path
- Suggestions: A. Anti-Patterns mini-section (ACCEPT). B. `--limit` ceiling
  (ACCEPT). C. Non-zero exit (ACCEPT). D. Auto-rebuild failure recovery
  (ACCEPT). E. FTS5 syntax error path (ACCEPT minor). F. Concurrency note (DEFER
  — verify lockfile first)
- Meta: confidence medium (some failure modes theoretical)

### Category 7 — Prompt Engineering Quality — 6/10

- Pros: 142 lines (under 300); REFERENCE.md extracts SQL/FTS5; concrete examples
  throughout; compressed Input block; 2-row version history
- Cons: Critical Rules at line 128 (bottom third) — primacy violation; no
  MUST/SHOULD/MAY hierarchy; auto-rebuild in 3 places; follow-up labels terse
- Gaps: Critical Rules buried; no MUST/SHOULD/MAY markers; no repeat at
  point-of-use
- Suggestions: A. Move Critical Rules to top (ACCEPT — primacy fix). B.
  MUST/SHOULD/MAY markers (ACCEPT — Rule 1/2 MUST, 3/4 SHOULD). C. Dedupe
  auto-rebuild (ACCEPT). D. Expand follow-up labels (ACCEPT). E. Add
  When-to-Use/NOT (ACCEPT — cross-refs Cat 1)
- Meta: confidence high

### Category 8 — Scope Boundaries — 5/10

- Pros: scope intrinsically bounded; all 8 query modes read-only; auto-rebuild
  narrowly scoped; v1.1 scopes T40 Part C explicitly
- Cons: no neighbor-differentiation; only "Part of T28 CAS" positions recall; no
  explicit scope-out list; no positive non-mutation statement
- Gaps: no Routing Guide; no When-to-Use/NOT; no scope-out list; no GSD boundary
  note; no handoff to `/synthesize`
- Suggestions: A. Add Routing Guide (ACCEPT). B. When-to-Use/NOT with neighbor
  routing (ACCEPT — consolidates Cats 1/5/7/8). C. Explicit scope-out list
  (ACCEPT). D. Cross-ref `/synthesize` (ACCEPT — compounds Cat 5)
- Opportunities: one-line scope-tagline augmentation ("Read-only query surface
  over the CAS index")
- Meta: confidence high

### Category 9 — Institutional Memory — 6/10

- Pros: multiple project-specific anchors; convention deferred (CONVENTIONS.md
  §14) not duplicated; version history ties to track IDs + session markers; data
  format appropriate; Rule 4 implicitly references vocabulary
- Cons: no retro/learning loop; no rationale for Critical Rules ("why" missing);
  T40 Part C lesson implicit; no cross-ref to CAS LEARNINGS
- Gaps: no empty-result learning loop; no link to project docs beyond
  CONVENTIONS.md §14; no rationale anchors in Critical Rules; no audit
  integration (N/A); version history lacks rationale
- Suggestions: A. Retro prompt on empty-result (ACCEPT). B. One-line rationale
  anchors (ACCEPT). C. Expand version history rationale (ACCEPT). D. Cross-ref
  CAS architecture/T28 (ACCEPT minor). E. Retro-capture follow-up #5 (DEFER —
  overlaps Cat 5 D)
- Meta: confidence high

### Category 10 — User Experience — 7/10

- Pros: clean visual structure; scannable result presentation; "Found N results
  for X:" opener; structured follow-up closure; empty-result soft-fail; three
  result shapes have shape-specific formatting
- Cons: no preflight echo — silent on flag typos; no warm-up; rigid follow-up (4
  options, no free-form); no explicit tail closure; auto-rebuild placeholder
  opaque (can take minutes)
- Gaps: no auto-rebuild progress signal (biggest UX hole); no query-plan
  preview; no context marker; no welcoming prompt; empty-field rendering
  undocumented
- Suggestions: A. Preflight echo (ACCEPT). B. Auto-rebuild progress indicator
  (ACCEPT — biggest fix). C. Explicit closure signal (ACCEPT minor). D.
  Free-form follow-up (ACCEPT). E. Empty-field rendering spec (ACCEPT minor)
- Opportunities: visual novelty marker (design refresh, out of scope)
- Meta: confidence high

### Category 11 — Convergence Loop Integration (T25) — N/A

- Applicability: recall has no discovery/verification/iterative-refinement phase
  — N/A per Cat 11 scoring guide; excluded from total
- Pros: atomic single-pass correct for query skill; no contrived discovery phase
- Cons / Gaps / Suggestions: none applicable
- Meta: confidence high (mechanical N/A determination)

### Category 12 — Completion Verification Design — N/A (Simple tier)

- Applicability: recall is Simple tier — atomic query, no phases, no artifacts,
  no decisions. Per SKILL_STANDARDS.md Standard/Complex require self-audit;
  Simple exempt. If forced to score: 7/10
- Pros: atomic execution = no partial-state recovery needed; Rules 3+4 =
  lightweight dim-5 functional verification; no false self-audit tacked on
- Cons: no explicit tier classification; implicit recall.js contract unverified;
  no regression baseline; no partial-execution detection
- Gaps: no "Tier: Simple" declaration; no recall.js output-schema contract; no
  stale-index detection; no regression hook on Critical Rules
- Suggestions: A. Explicit tier classification (ACCEPT). B. Pin recall.js
  output-schema (ACCEPT — cross-refs Cat 3 F). C. Stale-index detection (DEFER).
  D. Index-freshness self-check (DEFER)
- Opportunities: canonical Simple-tier self-audit pattern (cross-skill, out of
  scope)
- Meta: confidence medium (tier judgment)

---

## Run 2 Summary

- **Categories scored:** 10 of 12 (Cat 11 + 12 = N/A for Simple tier)
- **Composite:** 60/80 → **75/100 (adjusted for N/A)**
- **Score distribution:** {7,7,6,6,5,5,6,5,6,7}
- **Cross-category patterns surfaced (batch mode value-add):** (1) missing
  required sections cascade; (2) implicit contracts as central risk class; (3)
  auto-rebuild is underserved across UX/guard-rails/verification
- **Stop point:** findings-only; no Phase 2.B decisions collected per parity
  test scope
