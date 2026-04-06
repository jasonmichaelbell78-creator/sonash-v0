# AUDIT: Creator View Comprehensive Upgrade

**Date:** 2026-04-05 **Auditor:** Claude Opus 4.6 **Scope:** 30 decisions
(DECISIONS.md) traced through SKILL.md v4.0 + REFERENCE.md v4.0 **Method:** Full
context-dependency tracing, not grep-and-check

---

## 8a. Decision-to-Spec Traceability

For each of the 30 decisions, verification of where it is reflected in SKILL.md
and/or REFERENCE.md.

| #   | Decision                                       | Verdict  | Location                                                                                                                                                      | Notes                                                                                   |
| --- | ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Fit-separation model                           | **PASS** | REFERENCE.md:401-434 (value-map.json `objective_score`, `personal_fit_score`); SKILL.md:233-234                                                               | Both score fields documented in schema with types and descriptions                      |
| 2   | Link-mining output location                    | **PASS** | REFERENCE.md:660-703 (Section 3.7, `mined-links.jsonl` as separate per-repo file); SKILL.md:201-209                                                           | Separate JSONL, not in value-map.json                                                   |
| 3   | Repo type classification                       | **PASS** | REFERENCE.md:921-1009 (Section 5b, full enum); REFERENCE.md:224 (`analysis.json` schema); SKILL.md:80 (Phase 4b conditional)                                  | 6-value enum: library, application, curated-list, registry, documentation-hub, monorepo |
| 4   | Scoring lens architecture                      | **PASS** | REFERENCE.md:756-798 (Sections 4.1, 4.2, 4.3); SKILL.md:222-224                                                                                               | Dual output, both always computed, primary inferred from repo_type                      |
| 5   | Anti-ideas placement                           | **PASS** | SKILL.md:192-197 (Section 6 "What's Worth Avoiding"); REFERENCE.md:1517-1542 (Section 14.8)                                                                   | 6th Creator View section + `cautionary` category in findings.jsonl                      |
| 6   | Schema versioning                              | **PASS** | REFERENCE.md:201-205 (intro text); REFERENCE.md:214 (`analysis.json`); REFERENCE.md:388 (`value-map.json`)                                                    | See 8b for gaps in other files                                                          |
| 7   | Repo type detection heuristic                  | **PASS** | REFERENCE.md:929-955 (signal matrix + classification thresholds in Section 5b)                                                                                | 6 signals, 3+ strong = curated-list threshold                                           |
| 8   | Link mining recursion depth                    | **PASS** | REFERENCE.md:1600-1611 (Section 16.1, steps 4b.1 through 4b.10); SKILL.md:204-208                                                                             | Depth 0 default, Depth 1 opt-in, Depth 2 targeted                                       |
| 9   | Relevance scoring                              | **PASS** | REFERENCE.md:1603-1604 (step 4b.3, category match + keyword overlap); REFERENCE.md:698-699 (confidence field)                                                 | `confidence: "low"` vs `"high"` documented                                              |
| 10  | mined-links.jsonl schema                       | **PASS** | REFERENCE.md:669-703 (Section 3.7, full 13-field schema with example and field table)                                                                         | All 13 fields from decision present                                                     |
| 11  | Negative-space detection folded into Section 1 | **PASS** | SKILL.md:165-170 (Section 1 titled "What This Repo Understands (+ Blindspots)"); REFERENCE.md:1431-1450 (Section 14.3 blindspot prompts)                      | Contrast strengthens both halves                                                        |
| 12  | 6-section Creator View                         | **PASS** | SKILL.md:164-198 (all 6 section headings); REFERENCE.md:1392-1542 (Sections 14.1-14.8)                                                                        | All 6 sections specified                                                                |
| 13  | Synthesis architecture                         | **PASS** | SKILL.md:257 (routing option 8, cross-repo synthesis); REFERENCE.md:1684-1718 (Section 17, cross-repo awareness); SKILL.md:198 (cross-references)             | Lightweight per-repo + companion /repo-synthesis                                        |
| 14  | Reading chain                                  | **PASS** | REFERENCE.md:705-736 (Section 3.8, `reading-chain.jsonl`); SKILL.md:238-240 (appending during Value Map phase); REFERENCE.md:1700-1706 (Section 17.2)         | Per-repo `related_repos[]` + cross-repo `reading-chain.jsonl`                           |
| 15  | Recency weighting                              | **PASS** | REFERENCE.md:1412-1423 (Section 14.2, priority ranking with SESSION_CONTEXT primary, ROADMAP secondary)                                                       | Formalized loading order                                                                |
| 16  | Mental-model-shift tracking deferred           | **PASS** | Not present in SKILL.md or REFERENCE.md (correctly deferred)                                                                                                  | Decision was to defer to synthesis skill                                                |
| 17  | Ecosystem meta-patterns                        | **PASS** | REFERENCE.md:226 (`ecosystem_tags` in analysis.json); REFERENCE.md:313 (field definition)                                                                     | Lightweight tags per-repo, heavy pattern in synthesis                                   |
| 18  | EXTRACTIONS.md update                          | **PASS** | REFERENCE.md:612-658 (Section 3.6.3, EXTRACTIONS.md spec with badges and both scores)                                                                         | `[ACTIVE-SPRINT]` / `[PARK]` / `[EVERGREEN]` badges; both Obj and Fit in detail tables  |
| 19  | Creator lens weight table                      | **PASS** | REFERENCE.md:769-782 (Section 4.2, 7 dimensions with Knowledge at 35%)                                                                                        | Weights sum to 100% (verified in 8c)                                                    |
| 20  | Creator lens verdicts                          | **PASS** | REFERENCE.md:811-818 (Section 4.4 creator lens verdict table)                                                                                                 | Study/Explore/Extract/Note with correct band ranges                                     |
| 21  | Quick Scan impact                              | **PASS** | SKILL.md:98-106 (lightweight creator lens + enriched gate for curated-list); REFERENCE.md:922-925 (classification runs during Quick Scan)                     | Enriched gate message referenced                                                        |
| 22  | Brilliant-but-off-sprint display               | **PASS** | REFERENCE.md:1501-1506 (Section 14.7 dedicated paragraph + reasoning); REFERENCE.md:654-658 (badge derivation in EXTRACTIONS.md)                              | Badges for scanning, prose for context                                                  |
| 23  | Synthesis skill scope                          | **PASS** | SKILL.md:257 (routing option 8); REFERENCE.md:1684-1718 (Section 17, synthesis auto-offer)                                                                    | Input contract verified in 8e below                                                     |
| 24  | Fit computation timing                         | **PASS** | REFERENCE.md:1508 (fit badge derivation for scan-time baking); Section 17.3 synthesis auto-offer                                                              | Scan-time baking for per-repo; synthesis-time refresh as overlay                        |
| 25  | Rollout order                                  | N/A      | Process decision, not spec content                                                                                                                            | Implementation ordering, not reflected in skill/reference                               |
| 26  | Synthesis skill location                       | N/A      | Process decision, not reflected here                                                                                                                          | Separate `.claude/skills/repo-synthesis/` directory                                     |
| 27  | Synthesis skill design timing                  | N/A      | Process decision                                                                                                                                              | Implementation process, not spec content                                                |
| 28  | Mixed-type repos                               | **PASS** | REFERENCE.md:224-225 (`repo_type` + `repo_type_secondary` in analysis.json); REFERENCE.md:312 (field definition); REFERENCE.md:956-963 (secondary type rules) | Primary drives behavior, secondary informational                                        |
| 29  | Rate limiting                                  | **PASS** | REFERENCE.md:1643-1664 (Section 16.3, HEAD at 5 req/sec, full fetch at 1 req/sec); SKILL.md:208                                                               | HEAD-first strategy with selective full fetch                                           |
| 30  | Implementation scope                           | N/A      | Process decision                                                                                                                                              | Two separate invocations, not spec content                                              |

**Summary:** 27 applicable decisions, all 27 **PASS**. 3 decisions are
process/rollout (N/A).

---

## 8b. Schema Consistency

### schema_version presence

| File                                       | schema_version present?                                                                                                         | Verdict  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `analysis.json` (Section 3.1)              | Yes, line 214: `"schema_version": "2.0"`                                                                                        | **PASS** |
| `value-map.json` (Section 3.3)             | Yes, line 388: `"schema_version": "2.0"`                                                                                        | **PASS** |
| `extraction-journal.jsonl` (Section 3.6.2) | **No** -- schema example (lines 590-599) has no `schema_version` field; field table (lines 602-610) has no `schema_version` row | **FAIL** |
| `findings.jsonl` (Section 3.2)             | **No** -- schema example (lines 341-349) has no `schema_version` field                                                          | **FAIL** |
| `trends.jsonl` (Section 3.4)               | **No** -- schema example (lines 478-510) has no `schema_version` field                                                          | **FAIL** |
| `mined-links.jsonl` (Section 3.7)          | **No** -- schema example (lines 669-684) has no `schema_version` field                                                          | **FAIL** |
| `reading-chain.jsonl` (Section 3.8)        | **No** -- schema example (lines 715-724) has no `schema_version` field                                                          | **FAIL** |

**Finding F-01:** Decision #6 states `schema_version: "2.0"` field in **all**
output files. Only `analysis.json` and `value-map.json` have it. Five other
output files lack it: `findings.jsonl`, `trends.jsonl`,
`extraction-journal.jsonl`, `mined-links.jsonl`, `reading-chain.jsonl`. The
intro text (line 203) says "All v2.0 artifacts include a `schema_version` field"
which contradicts the actual schemas.

**Recommended fix:** Either: (a) add `schema_version` to all 5 missing file
schemas, or (b) narrow the scope of Decision #6 to apply only to the two primary
aggregate files (`analysis.json`, `value-map.json`) and update the intro text at
line 203 accordingly. Option (b) is more pragmatic since JSONL files are
append-only and adding `schema_version` to every line is redundant.

### repo_type and repo_type_secondary in analysis.json

| Check                                                        | Verdict  |
| ------------------------------------------------------------ | -------- |
| Documented in Section 3.1 schema (line 224-225)              | **PASS** |
| Field definition table (lines 311-312)                       | **PASS** |
| Type consistent (string, nullable string)                    | **PASS** |
| Consumed by Section 4.3 lens selection (line 784-798)        | **PASS** |
| Consumed by Section 16 Phase 4b conditional (line 1591-1595) | **PASS** |
| Enum values match Section 5b (line 924)                      | **PASS** |

### ecosystem_tags in analysis.json

| Check                                                     | Verdict  |
| --------------------------------------------------------- | -------- |
| Documented in Section 3.1 schema (line 226)               | **PASS** |
| Field definition table (line 313)                         | **PASS** |
| Type consistent (array of strings)                        | **PASS** |
| Consumed by Section 17.1 cross-repo awareness (line 1692) | **PASS** |

### objective_score and personal_fit_score in value-map.json

| Check                                              | Verdict  |
| -------------------------------------------------- | -------- |
| Documented in Section 3.3 schema (lines 401-402)   | **PASS** |
| Field definition table (lines 433-434)             | **PASS** |
| Type consistent (number, 0-100)                    | **PASS** |
| Consumed by fit_class derivation (line 435)        | **PASS** |
| Consumed by EXTRACTIONS.md display (lines 642-646) | **PASS** |
| Also in mined-links.jsonl (lines 676-677)          | **PASS** |

### fit_class in value-map.json

| Check                                                                       | Verdict  |
| --------------------------------------------------------------------------- | -------- |
| Documented in Section 3.3 schema (line 403)                                 | **PASS** |
| Field definition table (line 435)                                           | **PASS** |
| Derivation rules in Section 14.7 (lines 1510-1515)                          | **PASS** |
| Consistent derivation in Section 3.6.3 (lines 654-658)                      | **PASS** |
| Enum values: `active-sprint`, `park-for-later`, `evergreen`, `not-relevant` | **PASS** |

### related_repos[] in value-map.json

| Check                                                            | Verdict  |
| ---------------------------------------------------------------- | -------- |
| Documented in Section 3.3 schema (lines 410-416)                 | **PASS** |
| Field definition table (lines 440-444)                           | **PASS** |
| Consumed by Section 17.1 cross-repo awareness (line 1697)        | **PASS** |
| Relationship enum consistent with reading-chain.jsonl (line 732) | **PASS** |

### category: "cautionary" in findings.jsonl

| Check                                               | Verdict  |
| --------------------------------------------------- | -------- |
| Documented in Section 3.2 field table (line 357)    | **PASS** |
| Marked as optional (correct -- only for anti-ideas) | **PASS** |
| Referenced in Section 14.8 (line 1538)              | **PASS** |

### mined-links.jsonl schema (13 fields)

| Field                 | In Example | In Field Table | Verdict  |
| --------------------- | ---------- | -------------- | -------- |
| title                 | line 671   | line 691       | **PASS** |
| url                   | line 672   | line 692       | **PASS** |
| category              | line 673   | line 693       | **PASS** |
| source_line           | line 674   | line 694       | **PASS** |
| description           | line 675   | line 695       | **PASS** |
| objective_score       | line 676   | line 696       | **PASS** |
| personal_fit_score    | line 677   | line 697       | **PASS** |
| personal_fit_projects | line 678   | line 698       | **PASS** |
| confidence            | line 679   | line 699       | **PASS** |
| depth                 | line 680   | line 700       | **PASS** |
| fetch_status          | line 681   | line 701       | **PASS** |
| tags                  | line 682   | line 702       | **PASS** |
| notes                 | line 683   | line 703       | **PASS** |

All 13 fields present and consistent. **PASS**.

### reading-chain.jsonl schema (6 fields)

| Field             | In Example | In Field Table | Verdict  |
| ----------------- | ---------- | -------------- | -------- |
| from_repo         | line 717   | line 730       | **PASS** |
| to_repo           | line 718   | line 731       | **PASS** |
| relationship      | line 719   | line 732       | **PASS** |
| discovery_context | line 720   | line 733       | **PASS** |
| discovered_during | line 721   | line 734       | **PASS** |
| date              | line 722   | line 735       | **PASS** |

All 6 fields present and consistent. **PASS**.

### Phantom field check (references to fields that don't exist)

No phantom field references found. All field references trace to actual schema
definitions.

---

## 8c. Cross-Section Coherence

### Section 4.1 adoption weights sum to 100%?

Security 25% + Reliability 20% + Maintainability 20% + Documentation 10% +
Process 15% + Velocity 10% = **100%**. **PASS**.

### Section 4.2 creator weights sum to 100%?

Security 5% + Reliability 10% + Maintainability 15% + Documentation 25% +
Process 5% + Velocity 5% + Knowledge 35% = **100%**. **PASS**.

### Creator lens includes Knowledge dimension; adoption does not?

Section 4.1 (adoption): 6 dimensions, no Knowledge. Section 4.2 (creator): 7
dimensions, includes Knowledge at 35%. **PASS**.

### Verdict tables match band thresholds?

**FAIL** -- Adoption verdict bands are **inconsistent** between two locations:

| Location                   | Adopt  | Trial | Extract | Avoid |
| -------------------------- | ------ | ----- | ------- | ----- |
| Section 1.3 (line 126-132) | 75-100 | 55-74 | 30-54   | 0-29  |
| Section 4.4 (line 805-809) | 80+    | 60-79 | 40-59   | 0-39  |

**Finding F-02:** The adoption verdict band thresholds in Section 1.3
(Whole-Repo Adoption Dimensions) do not match Section 4.4 (Verdict Tables).
Section 1.3 uses 75/55/30 boundaries; Section 4.4 uses 80/60/40 boundaries.
These are materially different -- a score of 76 would be "Adopt" in Section 1.3
but "Trial" in Section 4.4.

**Recommended fix:** Align both tables to a single set of thresholds. Section
4.4 is the canonical scoring section and uses the same breakpoints as the
creator lens (80/60/40), so Section 1.3 should be updated to match: Adopt 80+,
Trial 60-79, Extract 40-59, Avoid 0-39.

### Repo type enum values consistent between Section 5b and Section 3?

Section 3.1 (line 224):
`library|application|curated-list|registry|documentation-hub|monorepo` Section
5b (line 924): Same 6 values listed in classification thresholds. **PASS**.

### cautionary category referenced in both Section 14.8 and findings.jsonl schema?

Section 3.2 (line 357): `category` field with value `"cautionary"`. Section 14.8
(line 1538): `category: "cautionary"` in findings.jsonl. **PASS**.

### Fit badge derivation in Section 14.7 consistent with fit_class in value-map.json?

Section 3.3 (line 435): `active-sprint` (fit>=60), `park-for-later` (fit<60,
obj>=60), `evergreen` (both>=40), `not-relevant`. Section 14.7 (lines
1510-1515): fit>=60 -> ACTIVE-SPRINT, fit<60 AND obj>=60 -> PARK, obj>=40 AND
fit>=40 -> EVERGREEN, otherwise (no badge). Section 3.6.3 (lines 654-658): Same
as 14.7.

**PASS** -- The value-map.json `fit_class` enum includes `not-relevant` as the
name for the "no badge" case, which is the correct data-layer representation.

### Monorepo detection signals consistency

**FAIL** -- `lerna.json` is listed as a monorepo marker in Section 5b (line 947)
but is **missing** from the Section 9 monorepo detection signals table (lines
1197-1207).

**Finding F-03:** Section 5b lists `lerna.json` among monorepo markers for
classification thresholds, but the Section 9 Guard Rails monorepo detection
table omits it. An implementer following Section 9 would miss Lerna monorepos.

**Recommended fix:** Add `| lerna.json | Lerna |` to the Section 9 monorepo
detection signals table (after line 1207).

---

## 8d. Process Flow Integrity

### Flow 1: Library Repo

**Validate** -> SKILL.md lines 73: Home repo? Archived? Rate limits? Fork? No
fields consumed that don't exist yet. **PASS**.

**Phase 0 (Quick Scan)** -> SKILL.md lines 90-106:

- Repo type classification runs (Section 5b). Detection uses API data ->
  produces `repo_type: "library"` in analysis.json.
- 18 QS dimensions computed -> `dimensions` object in analysis.json.
- Lightweight creator lens from README -> 2-3 sentence teaser.
- Adoption lens is primary for library (Section 4.3).
- All fields produced exist in analysis.json schema. **PASS**.

**Gate** -> SKILL.md line 104:

- Standard gate (not enriched, since type is library, not curated-list).
- No special fields needed. **PASS**.

**Phase 1 (Clone+Repomix)** -> SKILL.md lines 110-119; REFERENCE.md Section
15.1:

- Blobless clone. Repomix generation. State file update.
- Repo type refinement possible (Section 5b lines 999-1009). Consumes
  `repo_type` from Phase 0.
- All dependencies satisfied. **PASS**.

**Phase 2 (Dimension Wave)** -> SKILL.md lines 125-136; REFERENCE.md Section
15.2:

- ST-01 through ST-15 dimensions computed.
- Produces dimension files under `dimensions/`.
- No forward references to unproduced fields. **PASS**.

**Phase 4 (Creator View)** -> SKILL.md lines 147-199:

- Loads home context (SESSION_CONTEXT.md, ROADMAP.md, etc.).
- 6 sections produced. Knowledge dimensions KN-01 through KN-05 scored.
- Consumes: `analysis.json` (produced in Phase 0), dimension files (Phase 2),
  home context.
- Produces: Creator View prose in `summary.md`, knowledge candidate entries.
- Populates `related_repos[]` in value-map.json for cross-references (Section
  17.1).
- No forward references. **PASS**.

**Phase 4b (Link Mining)** -> SKILL.md line 80, 201-209:

- Conditional on `repo_type` being `curated-list` or `registry`.
- For library repos: **Phase 4b does NOT trigger**. **PASS** -- correctly
  skipped.

**Phase 5 (Engineer View)** -> SKILL.md lines 212-224:

- Merges all dimensions. Computes both adoption + creator lens scores.
- Consumes: dimensions (Phase 2), absence patterns, KN-01-KN-05 (Phase 4).
- Produces: summary bands, adoption assessment, dual verdict.
- All consumed fields already produced. **PASS**.

**Phase 6 (Value Map)** -> SKILL.md lines 228-241:

- Produces: `value-map.json` with `objective_score`, `personal_fit_score`,
  `fit_class`, `related_repos[]`.
- Appends to `reading-chain.jsonl`.
- Consumes: dimension scores, Creator View knowledge candidates, analysis.json.
- All dependencies met. **PASS**.

**Routing** -> SKILL.md lines 245-258:

- 8 options. Option 8 (synthesis) conditional on 3+ repos.
- No field dependencies unmet. **PASS**.

**Library flow: PASS** -- no phase references a field not yet produced.

### Flow 2: Curated-List Repo

**Validate** -> Same as library. **PASS**.

**Phase 0 (Quick Scan)** -> SKILL.md lines 90-106:

- Signal matrix evaluated: README size, code-to-markdown ratio, topic tags, link
  density.
- 3+ strong signals -> `repo_type: "curated-list"`.
- Lightweight creator lens produced.
- Creator lens is primary (Section 4.3 table).
- **Enriched gate** (SKILL.md line 105-106): "showing link count and link mining
  option." The enriched gate needs link count -- this is available from the
  README parse done during Quick Scan lightweight creator lens. **PASS**.

**Gate** -> Enriched gate for curated-list. **PASS**.

**Phase 1 (Clone+Repomix)** -> Same as library. **PASS**.

**Phase 2 (Dimension Wave)** -> Same as library. **PASS**.

**Phase 4 (Creator View)** -> Same as library (6 sections, creator lens
primary). **PASS**.

**Phase 4b (Link Mining)** -> SKILL.md lines 201-209; REFERENCE.md Section 16:

- Conditional check: `repo_type == "curated-list"` -> **triggers**.
- Step 4b.1: Parse markdown -> extracts links with context. Consumes: cloned
  repo files (Phase 1).
- Step 4b.3: Score against home context. Consumes: SESSION_CONTEXT.md,
  ROADMAP.md (already loaded in Phase 4).
- Step 4b.4: Write `mined-links.jsonl` with `confidence: "low"`.
- Steps 4b.5-4b.10: Interactive deepening gates. Optional Depth 1/2.
- All consumed fields available from prior phases. **PASS**.

**Phase 5 (Engineer View)** -> Same as library. **PASS**.

**Phase 6 (Value Map)** -> Same as library. Also consumes mined-links.jsonl for
curated-list repos (synthesis skill downstream dependency). **PASS**.

**Routing** -> Same as library. **PASS**.

**Curated-list flow: PASS** -- no phase references a field not yet produced.
Phase 4b correctly triggers only for curated-list/registry.

---

## 8e. Output Contract for Synthesis Skill

Decision #23 defines the inputs the synthesis skill needs. Verification:

| Required Input                                                                   | Produced By                                  | Location in Spec                               | Verdict  |
| -------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- | -------- |
| `value-map.json` with `objective_score`, `personal_fit_score`, `related_repos[]` | Phase 6 (Value Map)                          | REFERENCE.md Section 3.3 (lines 388-416)       | **PASS** |
| `mined-links.jsonl` (for curated-list repos)                                     | Phase 4b (Link Mining)                       | REFERENCE.md Section 3.7 (lines 660-703)       | **PASS** |
| `analysis.json` with `repo_type`, `ecosystem_tags`, `schema_version`             | Phase 0 (Quick Scan)                         | REFERENCE.md Section 3.1 (lines 207-328)       | **PASS** |
| `reading-chain.jsonl`                                                            | Phase 6 (Value Map) + Phase 4 (Creator View) | REFERENCE.md Section 3.8 (lines 705-736)       | **PASS** |
| `EXTRACTIONS.md` with fit badges                                                 | Extract routing flow                         | REFERENCE.md Section 3.6.3 (lines 612-658)     | **PASS** |
| `extraction-journal.jsonl` with `schema_version`                                 | Extract routing flow                         | REFERENCE.md Section 3.6.2 (lines 584-610)     | **FAIL** |
| Creator View prose                                                               | Phase 4 (Creator View)                       | SKILL.md lines 147-199 (written to summary.md) | **PASS** |

**Finding F-04:** Decision #23 lists `extraction-journal.jsonl` as an input with
`schema_version`. However, the extraction-journal.jsonl schema (REFERENCE.md
lines 590-610) does NOT include a `schema_version` field. This is a subset of
Finding F-01 but specifically impacts the synthesis skill's ability to
version-check its inputs.

**Recommended fix:** If `schema_version` is required for synthesis compatibility
checking, add it to the extraction-journal.jsonl schema. Otherwise, clarify in
Decision #23 that extraction-journal.jsonl does not carry its own schema_version
(its version is implied by the analysis.json that produced it).

---

## 8f. Backward Compatibility

### v1 files (no schema_version) handled gracefully?

REFERENCE.md lines 201-205: "All v2.0 artifacts include a `schema_version`
field. Files without `schema_version` are implicitly v1.0 and will be migrated
on re-scan (re-scan IS the migration; old files archived to `archive/`)."

**PASS** -- explicit handling: absent = v1.0, re-scan migrates, old files
archived.

### Re-scan produces v2 and archives v1?

REFERENCE.md line 204: "will be migrated on re-scan (re-scan IS the migration;
old files archived to `archive/`)." State file schema (Section 8, line 1114)
includes `version` field.

**PASS** -- though no explicit archive directory path is documented. Minor: the
archive path `archive/` is mentioned but its location relative to the repo
output directory is not specified. This is a documentation gap but unlikely to
cause implementation issues.

### No spec text assumes v2 fields exist in v1 files?

Reviewed all cross-references:

- Section 4.3 lens selection references `repo_type` -- this field does not exist
  in v1. However, the only path to Section 4.3 is through a new scan (which
  produces v2), so existing v1 files would not be consulted for lens selection
  during active analysis.
- Section 17.1 cross-repo awareness reads existing `value-map.json` files and
  checks `ecosystem_tags`. If a v1 value-map.json exists (without
  `ecosystem_tags`), this would silently miss cross-references.

**Finding F-05 (MINOR):** Section 17.1 (line 1692) checks
`.research/repo-analysis/*/value-map.json` for `ecosystem_tags` to find
cross-repo matches. A v1 value-map.json (from a prior scan) would not have
`ecosystem_tags`, potentially causing a silent miss. No defensive check is
specified.

**Recommended fix:** Add a note to Section 17.1: "Skip cross-reference matching
for repos whose value-map.json lacks `schema_version` (v1 files). These will
gain cross-repo awareness when re-scanned."

---

## 8g. Line Count and Section Numbering

### SKILL.md under 300 lines?

Actual line count: **295 lines**. **PASS**.

### REFERENCE.md section numbering consistent?

Extracted section numbers:

```
1. Analysis Dimensions Catalog
2. Tool Stack
3. Output Schemas
4. Scoring Bands
5. Absence Pattern Definitions
5b. Repo Type Classification     <-- non-standard numbering
6. Code Portability Rubric
7. Temporal Fingerprint Specification
8. State File Schema
9. Guard Rails
10. Agent Allocation
11. Value Extraction Signals
12. Normalization and Comparison  <-- DUPLICATE
12. Research Index                <-- DUPLICATE
13. Knowledge Dimensions
14. Creator View Specification
15. Standard/Deep Process Details
16. Link Mining Pipeline
17. Cross-Repo Awareness
18. Version History
```

**Finding F-06:** Section 12 is duplicated. Lines 1317 and 1335 both use
`## 12.` -- "Normalization and Comparison" and "Research Index" respectively.
The second should be `## 12b` or the Research Index should be renumbered to 13
(with all subsequent sections bumped by 1).

**Finding F-07 (MINOR):** Section 5b uses a non-standard `5b` suffix rather than
sequential numbering. While technically not a "gap" (5 exists, 6 exists), it
creates an asymmetry. This is a minor style issue -- it was likely intentional
to keep the Repo Type Classification conceptually linked to Section 5 (Absence
Patterns) while preserving existing section numbers for downstream references.
No action required unless renumbering is desired.

**Recommended fix for F-06:** Renumber the second Section 12 ("Research Index")
to Section 12b (consistent with the 5b convention already used), or renumber to
13 and bump all subsequent sections by 1. The 12b approach is lower-risk since
it avoids invalidating any existing references to Sections 13-18.

---

## Summary

### All Findings

| ID   | Severity   | Section | Description                                                                                                                                                                                                    |
| ---- | ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 | **MEDIUM** | 8b      | `schema_version` missing from 5 of 7 output file schemas (extraction-journal.jsonl, findings.jsonl, trends.jsonl, mined-links.jsonl, reading-chain.jsonl), contradicting Decision #6 and REFERENCE.md line 203 |
| F-02 | **HIGH**   | 8c      | Adoption verdict band thresholds inconsistent between Section 1.3 (75/55/30) and Section 4.4 (80/60/40) -- materially different scoring outcomes                                                               |
| F-03 | **LOW**    | 8c      | `lerna.json` listed as monorepo marker in Section 5b but missing from Section 9 monorepo detection table                                                                                                       |
| F-04 | **MEDIUM** | 8e      | `extraction-journal.jsonl` listed in Decision #23 synthesis input contract with `schema_version` but field not in schema                                                                                       |
| F-05 | **LOW**    | 8f      | Section 17.1 cross-repo awareness may silently miss v1 value-map.json files lacking `ecosystem_tags`                                                                                                           |
| F-06 | **MEDIUM** | 8g      | Duplicate Section 12 numbering (lines 1317 and 1335 both `## 12.`)                                                                                                                                             |
| F-07 | **LOW**    | 8g      | Non-standard `5b` section suffix (minor style, no action required)                                                                                                                                             |

### Scorecard

| Audit Check                                       | Result                          |
| ------------------------------------------------- | ------------------------------- |
| 8a. Decision-to-spec traceability (27 applicable) | **27/27 PASS**                  |
| 8b. Schema consistency                            | **FAIL** (F-01, F-04)           |
| 8c. Cross-section coherence                       | **FAIL** (F-02, F-03)           |
| 8d. Process flow integrity                        | **PASS** (both flows verified)  |
| 8e. Output contract for synthesis skill           | **FAIL** (F-04)                 |
| 8f. Backward compatibility                        | **PASS** with minor note (F-05) |
| 8g. Line count and section numbering              | **FAIL** (F-06)                 |

### Critical Path

The **highest priority fix** is F-02 (adoption verdict band inconsistency). This
would produce materially different scoring outcomes at implementation time and
must be resolved before any implementation begins. F-01 and F-06 are cleanup
items that should be resolved but won't cause functional breakage.
