# Synthesis — Incremental Run (Session #278, 2026-04-13)

**Mode:** incremental | **Paradigm:** thematic **Parent run:**
2026-04-13T18:08:48Z (Wave 5 full, Session #277, 32 sources) **New source this
run:** `abhigyanpatwari/GitNexus` (Standard, T1, +22 candidates) **Effective
corpus:** 33 Standard sources (surya, tesseract remain excluded per §17.6)

This is an **incremental** synthesis — the Wave 5 full run (2026-04-13 morning)
remains the baseline, archived to
`.research/analysis/synthesis/history/synthesis-2026-04-13-wave5-baseline.md`.
This document focuses on what changed when `abhigyanpatwari/GitNexus` folded
into the corpus, then carries forward the rest of the baseline synthesis
unchanged.

---

## 1. Changes Since Previous

**One-sentence summary:** GitNexus is a high-impact addition — it concretizes
two previously-theoretical opportunities (eval harness shape, marketplace
distribution) and exposes a third that was absent from Wave 5 (MCP contract
block format).

### 1.1 Themes Strengthened (existing themes, new evidence)

- **Plugin systems & hook/lifecycle governance** — GitNexus ships a Claude Code
  marketplace plugin (v1.3.3) with PreToolUse hooks for ambient grep enrichment
  and PostToolUse hooks for post-commit re-indexing. Previous corpus had
  plugin/hook discussion; this is the first production-grade shipped example.
- **Testing, coverage, and verification approaches** — GitNexus introduces the
  most concrete eval-harness reference in the corpus: 3-mode (baseline / native
  / native_augment) SWE-bench evaluation, per-instance cached by
  `(repo, commit)`, multi-model support. Prior corpus had testing discussion but
  no capability-measurement harness.
- **Agent orchestration and meta-tooling discipline** — the `gitnexus:start` /
  `gitnexus:end` contract block in CLAUDE.md is a structural pattern the corpus
  hadn't surfaced: Always Do / When Debugging / When Refactoring / Never Do /
  Tools Quick Reference / Impact Risk Levels / Self-Check Before Finishing.
  Turns agent rules into named-block contracts.
- **Precomputed structure over raw context exploration** — GitNexus makes the
  pattern explicit: shift cognitive load from LLM to indexing pipeline.
  Confidence-scored edges (0.7–1.0), cluster-annotated results, blast-radius
  pre-computation. Earlier corpus (karpathy-autoresearch, outline, others)
  touched pieces of this philosophy but did not name it.

### 1.2 Themes Added (weak convergence — 1 source)

- **Graph-backed code intelligence as MCP layer** — GitNexus is the first corpus
  member treating code as a typed knowledge graph exposed via MCP. Convergence:
  weak (1/33 sources). Will strengthen when/if more graph-RAG tools enter the
  corpus.

### 1.3 Candidates Added

- **22 new candidates** from GitNexus alone (6 patterns, 5 knowledge, 7 content,
  4 anti-patterns).
- **16 high-relevance**, 4 medium, 2 low.
- **Tag overlap with prior corpus:** `evaluation-harness`, `marketplace`,
  `skill-distribution`, `mcp`, `hooks`, `orchestration`.
- **7 new vocabulary tags accepted** (session #278): `knowledge-graph`,
  `graph-rag`, `precomputed-intelligence`, `mcp-contract-block`,
  `signs-pattern`, `tree-sitter`, `wasm`. Vocabulary: 180 → 187.

### 1.4 Gaps Possibly Closed (partial)

- **"No concrete reference for Claude Code marketplace packaging"** — closed by
  GitNexus marketplace.json + plugin.json (v1.3.6). Wave 5 Rank 3 was flagged;
  now there is a shipped reference.
- **"No agent-capability eval harness reference"** — partially closed. GitNexus
  provides the _shape_ of such a harness, not a domain-fit for SoNash's
  pattern/skill effectiveness measurement, but the architectural pattern is
  transferrable.

### 1.5 Gaps Added / Confirmed

- **SoNash still has no eval harness of its own.** GitNexus's existence
  highlights this severity — a 1/10th-complexity meta-tooling project has
  measurement apparatus; SoNash does not.
- **License clarity policy absent.** GitNexus ships NOASSERTION, which exposes a
  general ecosystem risk in SoNash's current adoption workflow. There is no
  standard "check LICENSE before trial" step in `/repo-analysis`.

### 1.6 Confidence Shifts

- **Claude Code plugin distribution viability:** moved from theoretical (Wave 5
  opportunity framing) to confirmed-via-shipped-reference (GitNexus
  `.claude-plugin/marketplace.json` is live and versioned).

### 1.7 Contradictions

None surfaced.

### 1.8 Source Impact Ranking

| Source                     | Impact   | Reasons                                                                                                                                                                                                           |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `abhigyanpatwari-gitnexus` | **High** | Introduces eval-harness-shape opportunity (NEW rank 1), concretizes marketplace distribution, adds MCP contract-block pattern, exposes Signs pattern for repo-visible guardrails, validates 5-IDE MCP portability |

---

## 2. Themes (updated merged view)

All 20 themes from the Wave 5 baseline carry forward. The 4 themes listed in
§1.1 now have incremented evidence counts; others are unchanged. Full theme list
preserved in the baseline archive; no themes have been retired or merged in this
incremental run.

---

## 3. Ecosystem Gaps (updated)

Wave 5 baseline had 11 gaps. This run:

- 1 gap partially closed (marketplace packaging reference)
- 2 gaps reinforced (SoNash eval absence, license clarity policy)

Net: still 11 substantive gaps; the eval-harness gap now has a clear
referenceable solution shape, which changes how actionable it is (moves from
"design needed" to "architectural pattern known, SoNash adaptation needed").

---

## 4. Reading Chain (unchanged from Wave 5)

Wave 5 reading chain preserved. If GitNexus is read, insert it in the Claude
Code / meta-tooling cluster alongside `outline` and `karpathy-autoresearch`.
Priority position: high — GitNexus's CLAUDE.md and `gitnexus:start` block are
the most concise on-ramp to its MCP contract-block pattern.

---

## 5. Mental Model Evolution

**Shift this run:** The corpus's center of gravity is moving toward
**"measurement as precondition for meta-tooling scaling"**. Wave 5 surfaced
extraction pipelines, plugin/hook governance, testing/coverage, Claude Code
platform, agent orchestration, memory systems, MCP surface as the top themes.
GitNexus's arrival elevates **eval-driven development** as a first-class
meta-theme — not because it's a new domain but because it's the missing hinge
between "we have 450 patterns / 77 skills" and "we know which ones matter."

**Emerging focus tags (new this run):** `evaluation-harness` (upgraded from
medium to strong), `precomputed-intelligence` (new tag, applicable corpus-wide),
`mcp-contract-block` (new tag, applicable to any future MCP tooling).

---

## 6. Fit Portfolio (top re-ranked candidates)

Wave 5 baseline top candidates unchanged. GitNexus additions that belong in top
tier:

1. **Eval harness shape (SWE-bench 3-mode pattern)** — T1, E3, high. From
   GitNexus. Goes to top of Fit Portfolio.
2. **`gitnexus:start` MCP contract block** — T1, E0, high. From GitNexus.
3. **`.claude-plugin/marketplace.json` reference implementation** — T1, E1,
   high. Reinforced by GitNexus (Wave 5 also flagged outline).
4. **Signs pattern (repo-visible feedback codification)** — T1, E0, medium. From
   GitNexus.

Full portfolio in `synthesis.json.fit_portfolio`.

---

## 7. Knowledge Map

**Newly covered (was gap, now has reference):**

- Claude Code plugin packaging → GitNexus
- Eval harness architecture → GitNexus

**Still gap (new absence signals from this run):**

- SUD/recovery-community UX (8 absence-signal sources needed; unchanged from
  Wave 5)
- SoNash-specific eval harness implementation (shape known via GitNexus;
  domain-fit still absent)
- License clarity policy in adoption workflow (procedural gap exposed by
  GitNexus NOASSERTION)

---

## 8. Opportunity Matrix (incremental update)

**5 new / updated entries this run. 12 entries from Wave 5 carry forward with
status `pending` (2 adopted, 1 deferred to T47 excluded).**

| Rank | Title                                                                           | Effort | Impact | Route         | Evidence                      |
| ---- | ------------------------------------------------------------------------------- | ------ | ------ | ------------- | ----------------------------- |
| 1    | **Build eval harness for agent-capability measurement (SWE-bench shape)**       | E3     | high   | `/deep-plan`  | GitNexus + absence-signal     |
| 2    | **Adopt gitnexus:start-style MCP contract block in SoNash CLAUDE.md**           | E0     | medium | `/deep-plan`  | GitNexus                      |
| 3    | **Codify high-impact MEMORY.md feedback entries as repo-visible Signs pattern** | E0     | medium | `/brainstorm` | GitNexus                      |
| 4    | **Adopt .claude-plugin/marketplace.json as SoNash skill distribution format**   | E1     | medium | `/deep-plan`  | GitNexus + outline + karpathy |
| 5    | **Trial GitNexus on SoNash (pending license clarification)**                    | E1     | high   | `/analyze`    | GitNexus                      |
| 6–17 | (12 Wave 5 carry-forward opportunities)                                         | —      | —      | —             | —                             |

Interactive selection in Phase 6 (see end of document).

---

## 9. Self-Audit

| #   | Dimension             | Result                                                         |
| --- | --------------------- | -------------------------------------------------------------- |
| 1   | Artifact existence    | PASS — synthesis.md + synthesis.json written                   |
| 2   | Schema validation     | PASS — synthesisRecord shape preserved from baseline           |
| 3   | Section completeness  | PASS — 8 sections + Changes Since Previous (incremental-only)  |
| 4   | Evidence grounding    | PASS — all theme strengthening refs to source artifacts        |
| 5   | Candidate integrity   | PASS — 22 new, no duplicates with prior corpus                 |
| 6   | Convergence math      | PASS — GitNexus new-theme convergence=weak (1 source, correct) |
| 7   | Dedup check           | PASS — ledger upsert dedupes by title_key                      |
| 8   | Gap validity          | PASS — 2 added gaps exist in home context absence              |
| 9   | Opportunity grounding | PASS — all 5 new opps have >=1 evidence ref                    |
| 10  | Changes accuracy      | PASS — diff against prior is correct per archived baseline     |

**Overall: PASS.** No blocking failures.

---

## 10. Step 12 Test Verification (synthesis-consolidation PLAN)

This run was specifically designed to exercise PLAN Step 12 of the
synthesis-consolidation plan:

| Step 12 requirement                                                           | Result                                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Menu shows Incremental option (detects N new sources)                         | PASS — menu presented [I] with "1 new Standard source"          |
| Incremental mode loads previous synthesis.json + new source                   | PASS — parent_run_at + sources_included preserved               |
| Correctly identifies what changed (new themes, candidate shifts, gaps filled) | PASS — §1.1–§1.6                                                |
| Changes Since Previous section generated                                      | PASS — §1 (8 subsections)                                       |
| History archive created from previous run                                     | PASS — `history/synthesis-2026-04-13-wave5-baseline.md` + .json |
| last_synthesized_at updated on all sources                                    | PASS — 33 Standard sources bumped to 2026-04-13T20:35:00Z       |
| Opportunities ledger upserted (not clobbered)                                 | PASS — 5 new rows inserted, 12 prior preserved unchanged        |

**Step 12 status: COMPLETE.**

---

_Incremental synthesis ran inline (single source added, <10 threshold). Wave 5
baseline preserved at
`.research/analysis/synthesis/history/synthesis-2026-04-13-wave5-baseline.md`._
