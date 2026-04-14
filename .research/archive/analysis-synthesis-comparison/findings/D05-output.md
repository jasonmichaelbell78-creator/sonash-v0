# Findings: Output Artifacts & Schemas Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-005

---

## Key Findings

### 1. Each skill produces a distinct but partially shared artifact set [CONFIDENCE: HIGH]

All four skills write to sibling directories under `.research/`. The analysis
skills write per-entity output; the synthesis skills write a single cross-entity
output. Artifacts divide into three categories: shared-schema files (alignment
deliberate), skill-specific files (no equivalent), and cross-entity files
(shared pools across multiple analyses).

Sources: website-analysis REFERENCE.md §1.0:20-45, repo-analysis REFERENCE.md
§3:199-205, website-synthesis REFERENCE.md §8:678-698, repo-synthesis
SKILL.md:75-79.

---

### 2. `analysis.json` schema versions diverge between the two analysis skills [CONFIDENCE: HIGH]

| Skill            | schema_version | Top-level type field           | Summary bands                                                                     |
| ---------------- | -------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| website-analysis | `"1.0"`        | `site_type` (15-type taxonomy) | 3 bands: Content Quality, Technical Health, Creator Value                         |
| repo-analysis    | `"2.0"`        | `repo_type` (6-type taxonomy)  | 6 bands: Security, Reliability, Maintainability, Documentation, Process, Velocity |

Both use the same nested structure (`meta`, `ecosystem_tags`,
`absence_patterns`, `summary_bands`) but the band dimensions and type taxonomies
are domain-specific. The REFERENCE.md explicitly documents shared field parity:
`schema_version`, `meta.scan_date`, `meta.scan_depth`, `meta.scan_version`,
`ecosystem_tags`, `absence_patterns`, `summary_bands` structure.

Actual observed files (`.research/repo-analysis/`) use a DIFFERENT top-level
structure than what REFERENCE.md v2.0 specifies — the real files use camelCase
keys (`skillVersion`, `scanDepth`, `repoType`) not snake_case (`schema_version`,
`scan_depth`, `repo_type`). This is a schema drift gap.

Sources: website-analysis REFERENCE.md §1.1:47-183, repo-analysis REFERENCE.md
§3.1:207-334, actual file
`.research/repo-analysis/codecrafters-io-build-your-own-x/analysis.json`
(observed keys: `repo`, `skillVersion`, `scanDepth`, `repoType`, `metadata`).

---

### 3. `value-map.json` schemas are structurally divergent — different candidate models [CONFIDENCE: HIGH]

**Repo-analysis REFERENCE.md (v2.0 spec):** Single `extraction_candidates[]`
array with numeric dual scores (`objective_score`, `personal_fit_score`),
code-specific fields (`code_portability`, `adoption_readiness`, `location`), and
`related_repos[]`.

**Website-analysis REFERENCE.md (v1.0 spec):** Single `extraction_candidates[]`
array with numeric dual scores, website-specific fields (`candidate_type`,
`confidence`, `location` as URL not file path), and `related_sites[]`. Website
extraction effort is 3-level (E0-E2) vs repo's 4-level (E0-E3).

**Actual repo-analysis files (v4.2 runtime):** The live schema diverges
significantly from REFERENCE.md v2.0 spec. Top-level keys are: `repo`,
`skillVersion`, `generated`, `scoring`, `patternCandidates`,
`knowledgeCandidates`, `contentCandidates`, `antiPatternCandidates`,
`cross_repo_connections`, `related_repos`. The single `extraction_candidates[]`
array was replaced with FOUR separate typed arrays. Candidate objects use
`{name, novelty, effort, relevance, description, relevance_to_home}` — no
numeric scores (`objective_score`, `personal_fit_score` are absent in actual
files).

This is the largest schema gap: REFERENCE.md §3.3 specifies a v2.0 schema that
REFERENCE.md §3 itself says exists, but the actual runtime schema (v4.2 per
SKILL.md) is structurally different. The REFERENCE.md was not updated to match
the v4.2 candidate model.

Sources: website-analysis REFERENCE.md §1.3:220-294, repo-analysis REFERENCE.md
§3.3:381-474, actual file inspection (python3 on `value-map.json`).

---

### 4. `findings.jsonl` schema is shared in structure but diverges on required fields [CONFIDENCE: HIGH]

Both skills use
`{schema_version, id, severity, dimension, title, detail, recommendation}`.
Website-analysis adds two required website-specific fields: `source_url` (URL
where finding was detected) and `source_mode` (`static|js-rendered|webfetch`).
Website-analysis also makes `category` required (5-value enum vs repo's optional
field).

Actual repo-analysis `findings.jsonl` uses `description` (not `detail`) and
lacks `schema_version`. The actual observed schema is:
`{id, severity, category, title, description, recommendation}`. No
`schema_version` present in real files.

Sources: website-analysis REFERENCE.md §1.2:185-218, repo-analysis REFERENCE.md
§3.2:335-380, actual file
`.research/repo-analysis/codecrafters-io-build-your-own-x/findings.jsonl`.

---

### 5. `trends.jsonl` schemas track different temporal signals [CONFIDENCE: HIGH]

Both are append-only, one record per run. The repo-analysis `trends.jsonl`
tracks engineering metrics: overall_score, critical_health_metric, per-dimension
scores, finding counts by S0-S3 severity, delta tracking, regression_flags. The
website-analysis `trends.jsonl` tracks content quality: creator_verdict,
creator_verdict_score, content_quality_score, value_axes_summary (4 axes
sampled), findings by high/medium/low/info severity (not S0-S3),
delta_verdict_score.

Actual observed repo-analysis trends.jsonl does not include `schema_version` or
`analysis_id` (both required in REFERENCE.md spec). Real schema:
`{repo, scan_date, depth, bands, stars, forks, contributors, findings, adoption}`.

Sources: website-analysis REFERENCE.md §1.10:513-548, repo-analysis REFERENCE.md
§3.4:474-534, actual file
`.research/repo-analysis/hkuds-cli-anything/trends.jsonl`.

---

### 6. Cross-entity artifact paths diverge between analysis skills [CONFIDENCE: HIGH]

This is a significant architectural inconsistency:

| Artifact                   | repo-analysis                                      | website-analysis                                                 |
| -------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `extraction-journal.jsonl` | `.research/repo-analysis/extraction-journal.jsonl` | `.research/extraction-journal.jsonl` (shared with repo-analysis) |
| `EXTRACTIONS.md`           | `.research/repo-analysis/EXTRACTIONS.md`           | `.research/EXTRACTIONS.md` (shared)                              |
| `reading-chain.jsonl`      | `.research/repo-analysis/reading-chain.jsonl`      | `.research/reading-chain.jsonl` (shared)                         |
| `research-index.jsonl`     | `.research/research-index.jsonl`                   | `.research/research-index.jsonl` (shared)                        |

The website-analysis design (Decision #8 per REFERENCE.md) places the extraction
journal at the root of `.research/` — shared across repo and website analyses.
The repo-analysis design keeps it within `.research/repo-analysis/`. The
SKILL.md for repo-analysis references
`.research/repo-analysis/extraction-journal.jsonl` at line 439. The
extraction-journal schemas also add `source_type: "website"` in the website
version, absent from the repo-analysis version.

Sources: website-analysis REFERENCE.md §1.12-1.14:560-614, repo-analysis
REFERENCE.md §3.6.2:587-616, repo-analysis SKILL.md:439.

---

### 7. Synthesis skills consume only existing artifacts — no re-analysis [CONFIDENCE: HIGH]

Both synthesis skills enforce a hard rule: read existing artifacts, never
re-fetch or re-analyze. The input contracts are explicit:

**repo-synthesis inputs (from `.research/repo-analysis/*/`):**

- MUST: `analysis.json`, `value-map.json`, `creator-view.md`,
  `content-eval.jsonl`
- SHOULD: `deep-read.md`, `coverage-audit.jsonl`, `findings.jsonl`
- MAY: `mined-links.jsonl` (curated-list repos only)
- Cross-repo SHOULD: `reading-chain.jsonl`, `EXTRACTIONS.md`,
  `extraction-journal.jsonl`

**website-synthesis inputs (from `.research/website-analysis/*/`):**

- MUST: `analysis.json`, `value-map.json`, `SITE-ANALYSIS.md`
- SHOULD: `links.json`, `meta.json`
- MAY: `findings.jsonl`

The adapter pattern is direct read — no transformation layer. Synthesis skills
build internal structures (candidate pool, prose corpus, relationship graph)
from raw artifact files during Phase 1.

Sources: repo-synthesis SKILL.md:56-79, website-synthesis SKILL.md:65-76,
repo-synthesis REFERENCE.md §8:386-415.

---

### 8. Synthesis output schemas share structural shape but differ in content [CONFIDENCE: HIGH]

Both produce two files: a human-readable markdown report and a structured JSON.

| Attribute             | repo-synthesis                                                                             | website-synthesis                                                   |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Primary output        | `SYNTHESIS.md` (uppercase, no subdir)                                                      | `synthesis.md` (lowercase, in `synthesis/` subdir)                  |
| Structured output     | `synthesis.json` (same dir as SYNTHESIS.md)                                                | `synthesis.json` (in `synthesis/` subdir)                           |
| Output path           | `.research/repo-analysis/`                                                                 | `.research/website-analysis/synthesis/`                             |
| JSON top-level key    | `version` (value: `"1.2"`)                                                                 | `schema_version` (value: `"1.0"`)                                   |
| JSON content sections | 6 fixed: themes, ecosystem_gaps, reading_chain, mental_model, fit_portfolio, knowledge_map | Paradigm-driven: one of 4 paradigms + signals + knowledge_portfolio |
| Minimum inputs        | 3 repos                                                                                    | 3 sites                                                             |

The repo-synthesis JSON uses `version` at the top level while website-synthesis
uses `schema_version` — a naming inconsistency. Repo-synthesis JSON requires all
6 output keys present even if empty (per `--focus`). Website-synthesis JSON uses
`paradigm_output` as a polymorphic container for one of 4 paradigm schemas.

Sources: repo-synthesis REFERENCE.md §7:347-383, website-synthesis REFERENCE.md
§4:455-593.

---

### 9. State file patterns share structure but website-analysis is per-site while others are singleton [CONFIDENCE: HIGH]

| Skill             | State file path                                         | Multi-file?        |
| ----------------- | ------------------------------------------------------- | ------------------ |
| website-analysis  | `.claude/state/website-analysis.<site-slug>.state.json` | YES — one per site |
| repo-analysis     | `.claude/state/repo-analysis.<repo-slug>.state.json`    | YES — one per repo |
| website-synthesis | `.claude/state/website-synthesis.state.json`            | NO — single global |
| repo-synthesis    | `.claude/state/repo-synthesis.state.json`               | NO — single global |

Website-analysis tracks `phases_completed[]` and `phases_failed[]` (named
phases). Repo-analysis tracks `dimensions_completed[]` and `dimensions_failed[]`
(dimension IDs). Synthesis skills track `outputs_completed[]` (named output
sections).

Both synthesis state files include a `follow_up_actions[]` structure to persist
user-selected post-synthesis actions, absent from analysis state files.

Sources: website-analysis REFERENCE.md §14:2049-2116, repo-analysis REFERENCE.md
§8:1119-1176, website-synthesis REFERENCE.md §6:637-657, repo-synthesis
REFERENCE.md §10:439-476.

---

### 10. Website-analysis has 8-10 artifacts; repo-analysis has more at Standard/Deep [CONFIDENCE: HIGH]

**website-analysis per-site artifacts:**

- Always: `meta.json`, `analysis.json` (partial at Quick)
- Standard/Deep: `findings.jsonl`, `value-map.json`, `links.json`,
  `SITE-ANALYSIS.md`, `trends.jsonl`
- Deep only: `assets.json`, `tables.json`, `sitemap.json`
- Expedition: `expedition-{ts}.meta.json`, `expedition-{ts}.snap.json`,
  `expedition-{ts}.jsonl`

**repo-analysis per-repo artifacts:**

- Quick: `analysis.json`, `findings.jsonl`, `summary.md`, `trends.jsonl`
- Standard/Deep adds: `value-map.json`, `creator-view.md`, `deep-read.md`,
  `content-eval.jsonl`, `coverage-audit.jsonl`, `EXTRACTIONS.md` (cross-repo
  updated)
- Curated-list repos: `mined-links.jsonl` (replaces `content-eval.jsonl`)
- Deep only: repomix-output.txt (gitignored)
- Per-candidate: `extractions/<candidate-slug>.json`

Actual observed files in
`.research/repo-analysis/codecrafters-io-build-your-own-x/`:
`analysis.json, content-eval.jsonl, coverage-audit.jsonl, creator-view.md, deep-read.md, dimensions/, findings.jsonl, mined-links.jsonl, repomix-output.txt, summary.md, trends.jsonl, value-map.json`
— matches expectation for a curated-list Standard scan.

Sources: website-analysis REFERENCE.md §1.0:20-45, repo-analysis REFERENCE.md
§3:199-206, SKILL.md artifact verification sections, filesystem inspection.

---

### 11. Naming conventions show one inconsistency: synthesis primary report [CONFIDENCE: HIGH]

All per-entity markdown reports use a domain-specific name:

- `SITE-ANALYSIS.md` (website-analysis, uppercase)
- `creator-view.md` (repo-analysis, lowercase)
- `summary.md` (repo-analysis, lowercase)

Cross-entity synthesis reports:

- `SYNTHESIS.md` (repo-synthesis, uppercase, placed at
  `.research/repo-analysis/`)
- `synthesis.md` (website-synthesis, lowercase, placed at
  `.research/website-analysis/synthesis/`)

The website-synthesis output is nested in a `synthesis/` subdirectory — which
website-analysis REFERENCE.md §8 confirms. Repo-synthesis places SYNTHESIS.md at
the root of `.research/repo-analysis/` alongside EXTRACTIONS.md. This asymmetry
means website synthesis is isolated in a subdir while repo synthesis co-mingles
with per-repo dirs.

Sources: website-synthesis REFERENCE.md §8:678-698, repo-synthesis
SKILL.md:76-79, SKILL.md:263-265.

---

### 12. `content-eval.jsonl` and `extraction-journal.jsonl` have different schemas between skills [CONFIDENCE: HIGH]

**`content-eval.jsonl` (repo-analysis v4.2, per SKILL.md §Content Evaluation):**

```json
{
  "category": "guide|api|tutorial|paper|repo|notebook|skill-file",
  "name": "...",
  "url": "...",
  "relevance": "high|medium|low|none",
  "applicability": "...",
  "home_connection": "..."
}
```

Consumed by repo-synthesis as a MUST artifact.

**`extraction-journal.jsonl` (repo-analysis, per REFERENCE.md §3.6.2):**

```json
{
  "schema_version": "2.0",
  "repo": "...",
  "candidate": "...",
  "status": "...",
  "decision": "...",
  "decision_date": "...",
  "extracted_to": "...",
  "notes": "..."
}
```

**`extraction-journal.jsonl` (website-analysis, per REFERENCE.md §1.12):**

```json
{
  "schema_version": "1.0",
  "source_type": "website",
  "source": "url",
  "candidate": "...",
  "candidate_type": "...",
  "status": "...",
  "decision": "...",
  "decision_date": "...",
  "extracted_to": "...",
  "notes": "..."
}
```

The website version adds `source_type` and `candidate_type`, changes `repo` to
`source`. The schema_version differs (1.0 vs 2.0). Both are supposed to feed
into the same shared `.research/extraction-journal.jsonl` — but the schema
differences mean a consumer must handle both shapes.

Actual observed `extraction-journal.jsonl` uses:
`{repo, candidate, type, status, decision, decision_date, extracted_to, notes, novelty, effort, relevance}`
— which matches neither the REFERENCE.md v2.0 spec (missing `schema_version`,
has extra `type`, `novelty`, `effort`, `relevance`).

Sources: repo-analysis SKILL.md:439-456, website-analysis REFERENCE.md
§1.12:560-579, actual file inspection.

---

### 13. Version/date metadata is present but inconsistent across artifact types [CONFIDENCE: HIGH]

All JSON artifacts are supposed to include `schema_version`. However:

- Website-analysis artifacts use `"1.0"` uniformly
- Repo-analysis REFERENCE.md specifies `"2.0"` for all artifacts
- Actual repo-analysis files omit `schema_version` entirely and use
  `skillVersion` in analysis.json and value-map.json
- Trends.jsonl in actual files omit `schema_version` and `analysis_id`
- Repo-synthesis synthesis.json uses `"version"` (not `"schema_version"`) with
  value `"1.2"`
- Website-synthesis synthesis.json uses `"schema_version"` with value `"1.0"`

All per-entity artifacts include `scan_date` or `generated` (date only, not
ISO8601 timestamp) for when the analysis ran. Synthesis files include
`synthesized_at` (website) or `generated_at` (repo) as ISO8601 timestamps.

Sources: repo-analysis REFERENCE.md §3:200-204, website-analysis REFERENCE.md
§1.1:54, repo-synthesis REFERENCE.md §7:352-354, actual file inspection.

---

### 14. Repo-analysis has a unique `research-index.jsonl` and dimensions directory; website has no equivalent [CONFIDENCE: HIGH]

**Unique to repo-analysis:**

- `dimensions/` subdirectory — agent output files for parallel dimension
  analysis
- Per-candidate `extractions/<slug>.json` files — individual extraction
  decisions
- `research-index.jsonl` at root of `.research/` (shared with `/deep-research`
  skill)
- `reading-chain.jsonl` (its version is at `.research/repo-analysis/`, not root)

**Unique to website-analysis:**

- `links.json` — scored link graph with per-link semantic scoring
- `assets.json` — images and downloadable files
- `tables.json` — extracted HTML tables with structure preservation
- `sitemap.json` — site structure map (Site mode)
- `expedition-*.{meta.json,snap.json,jsonl}` — three-file pattern for Expedition
  mode
- `meta.json` — Open Graph, JSON-LD, Twitter Card metadata

**Research index note:** The actual `.research/research-index.jsonl` is
populated by `/deep-research` outputs (per observed content), not repo-analysis.
REFERENCE.md §12b says repo-analysis appends to it, but the actual observed
entries are all from deep-research runs. This may indicate the indexing step is
not being executed.

Sources: website-analysis REFERENCE.md §1.0:24-46, repo-analysis REFERENCE.md
§3:199-210, §12b:1352-1371, actual filesystem inspection.

---

### 15. Intermediate artifacts: repomix-output.txt is temporary but kept; no cleanup defined [CONFIDENCE: MEDIUM]

`repomix-output.txt` is listed as gitignored in repo-analysis. It is generated
during Phase 1 and used during Extract routing. SKILL.md states it as an
expected artifact but REFERENCE.md §3 doesn't include it in the official schema.
It appears in actual output directories. No cleanup mechanism is specified — it
persists until the user manually removes it or the next re-scan.

Website-analysis has no equivalent large intermediate artifact (no cloning
occurs).

Neither analysis skill specifies what gets cleaned up vs retained. The "Done"
routing option lists artifacts but doesn't delete them (only the state file is
removed).

Sources: repo-analysis SKILL.md:67-71, actual filesystem inspection,
website-analysis SKILL.md routing §:238-242.

---

## Output Artifact Comparison Table

| Artifact                               | website-analysis                                   | repo-analysis                                      | website-synthesis                            | repo-synthesis                            |
| -------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| `analysis.json`                        | Per-site, v1.0 schema                              | Per-repo, v2.0 spec (actual: camelCase)            | Consumed input                               | Consumed input                            |
| `findings.jsonl`                       | Per-site, shared + 2 extra fields                  | Per-repo, shared base schema                       | SHOULD input                                 | SHOULD input                              |
| `value-map.json`                       | Per-site, single candidates array                  | Per-repo, 4 typed arrays (v4.2 actual)             | MUST input                                   | MUST input                                |
| `trends.jsonl`                         | Per-site, content metrics                          | Per-repo, engineering metrics                      | Not used                                     | Not used                                  |
| `creator-view.md` / `SITE-ANALYSIS.md` | Per-site markdown                                  | Per-repo markdown                                  | MUST input (SITE-ANALYSIS.md)                | MUST input (creator-view.md)              |
| `meta.json`                            | Per-site, OG/JSON-LD metadata                      | Not present                                        | SHOULD input                                 | Not applicable                            |
| `links.json`                           | Per-site, scored link graph                        | Not present                                        | SHOULD input                                 | Not applicable                            |
| `content-eval.jsonl`                   | Not present                                        | Per-repo, v4.2+                                    | Not applicable                               | MUST input                                |
| `deep-read.md`                         | Not present                                        | Per-repo, v4.2+                                    | Not applicable                               | SHOULD input                              |
| `coverage-audit.jsonl`                 | Not present                                        | Per-repo, v4.2+                                    | Not applicable                               | SHOULD input                              |
| `mined-links.jsonl`                    | Not present                                        | Per-repo (curated-list only)                       | Not applicable                               | MAY input                                 |
| `summary.md`                           | Not present                                        | Per-repo (deep-plan injectable)                    | Not applicable                               | Not applicable                            |
| `reading-chain.jsonl`                  | `.research/reading-chain.jsonl`                    | `.research/repo-analysis/reading-chain.jsonl`      | Not directly used                            | SHOULD input                              |
| `extraction-journal.jsonl`             | `.research/extraction-journal.jsonl`               | `.research/repo-analysis/extraction-journal.jsonl` | Not directly used                            | SHOULD input                              |
| `EXTRACTIONS.md`                       | `.research/EXTRACTIONS.md`                         | `.research/repo-analysis/EXTRACTIONS.md`           | Not directly used                            | SHOULD input                              |
| **synthesis primary output**           | —                                                  | —                                                  | `synthesis/synthesis.md`                     | `SYNTHESIS.md`                            |
| **synthesis structured output**        | —                                                  | —                                                  | `synthesis/synthesis.json`                   | `synthesis.json`                          |
| State file                             | `.claude/state/website-analysis.<slug>.state.json` | `.claude/state/repo-analysis.<slug>.state.json`    | `.claude/state/website-synthesis.state.json` | `.claude/state/repo-synthesis.state.json` |
| `assets.json`                          | Per-site (website-only)                            | —                                                  | Not used                                     | —                                         |
| `tables.json`                          | Per-site (website-only)                            | —                                                  | Not used                                     | —                                         |
| `sitemap.json`                         | Per-site (website-only, Site mode)                 | —                                                  | Not used                                     | —                                         |
| `expedition-*.jsonl`                   | Per-expedition (website-only)                      | —                                                  | Not used                                     | —                                         |
| `repomix-output.txt`                   | —                                                  | Per-repo (gitignored, temp)                        | —                                            | —                                         |
| `dimensions/` dir                      | —                                                  | Per-repo (agent outputs)                           | —                                            | —                                         |
| `extractions/<slug>.json`              | —                                                  | Per-repo, per-candidate                            | —                                            | —                                         |
| `research-index.jsonl`                 | `.research/research-index.jsonl`                   | `.research/research-index.jsonl`                   | Not produced                                 | Not produced                              |

---

## Schema Comparison Tables

### `analysis.json` Field Comparison

| Field               | website-analysis                 | repo-analysis (spec)       | repo-analysis (actual) |
| ------------------- | -------------------------------- | -------------------------- | ---------------------- |
| Schema version key  | `schema_version: "1.0"`          | `schema_version: "2.0"`    | `skillVersion: "4.1"`  |
| Date                | `meta.scan_date`                 | `meta.scan_date`           | `date`                 |
| Depth               | `meta.scan_depth`                | `meta.scan_depth`          | `scanDepth`            |
| Entity type         | `site_type` (15 values)          | `repo_type` (6 values)     | `repoType`             |
| Entity identifier   | `meta.url` + `meta.domain`       | `meta.repo` + `meta.url`   | `repo` + `url`         |
| Summary bands       | 3 bands                          | 6 bands                    | nested under `scoring` |
| Compliance field    | Yes (website-only)               | No                         | No                     |
| Adoption assessment | No                               | Yes (WR-01 to WR-06)       | Under `scoring`        |
| Creator verdict     | Yes (Study/Explore/Extract/Note) | Computed from creator lens | Under `scoring`        |

### `value-map.json` Candidate Schema Comparison

| Field                  | website-analysis (spec)                         | repo-analysis (spec v2.0)                       | repo-analysis (actual v4.2)                    |
| ---------------------- | ----------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| Array structure        | `extraction_candidates[]`                       | `extraction_candidates[]`                       | 4 typed arrays                                 |
| Candidate type tagging | `candidate_type` field                          | Implicit (single array)                         | Array name = type                              |
| Scoring                | `objective_score`, `personal_fit_score` (0-100) | `objective_score`, `personal_fit_score` (0-100) | `novelty/effort/relevance` (qualitative)       |
| Code portability       | No                                              | `code_portability` (0-15)                       | Not observed                                   |
| Location               | URL string                                      | File path string                                | Not applicable                                 |
| Cross-entity refs      | `related_sites[]`                               | `related_repos[]`                               | `related_repos[]` + `cross_repo_connections[]` |
| Effort scale           | E0-E2 (3 levels)                                | E0-E3 (4 levels)                                | E0-E2 observed                                 |

### State File Field Comparison

| Field                 | website-analysis     | repo-analysis                     | website-synthesis                    | repo-synthesis                       |
| --------------------- | -------------------- | --------------------------------- | ------------------------------------ | ------------------------------------ |
| `skill`               | yes                  | yes                               | implicit                             | yes                                  |
| `version`             | yes                  | yes                               | yes                                  | yes                                  |
| `slug`                | yes                  | yes                               | n/a                                  | n/a                                  |
| `status`              | yes                  | yes                               | yes                                  | yes                                  |
| `phase`               | yes                  | yes                               | yes                                  | yes                                  |
| Phase tracking        | `phases_completed[]` | `dimensions_completed[]`          | `outputs_completed[]`                | `outputs_completed[]`                |
| `output_dir`          | yes                  | yes                               | implicit                             | implicit                             |
| `follow_up_actions[]` | no                   | no                                | no                                   | yes                                  |
| `process_feedback`    | no                   | no                                | no                                   | yes                                  |
| `agent_budget`        | no                   | yes (allocated/spawned/completed) | no                                   | no                                   |
| Site/repo tracking    | single entity        | single entity                     | `sites_loaded[]`, `sites_excluded[]` | `repos_loaded[]`, `repos_excluded[]` |

---

## Contradictions

### Contradiction 1: extraction-journal.jsonl location

The website-analysis REFERENCE.md §1.12 places `extraction-journal.jsonl` at
`.research/extraction-journal.jsonl` (root level, shared). The repo-analysis
REFERENCE.md §3.6.2 places it at
`.research/repo-analysis/extraction-journal.jsonl`. The actual filesystem
confirms only `.research/repo-analysis/extraction-journal.jsonl` exists. The
website-analysis cross-entity design calls for a different (shared root) path
that does not match what repo-analysis produced.

### Contradiction 2: value-map.json schema — spec vs runtime

The repo-analysis REFERENCE.md §3.3 specifies a v2.0 schema with
`extraction_candidates[]` and numeric `objective_score`/`personal_fit_score`.
The actual runtime artifacts use a fundamentally different structure (4 typed
candidate arrays, qualitative scoring). The REFERENCE.md was not updated when
the v4.2 candidate model was introduced.

### Contradiction 3: findings.jsonl `detail` vs `description`

The repo-analysis REFERENCE.md §3.2 uses `detail` as the field name. Actual
findings.jsonl files use `description`. Website-analysis REFERENCE.md §1.2
correctly uses `detail`. This is a spec-to-reality drift in repo-analysis.

### Contradiction 4: repo-synthesis JSON uses `version` not `schema_version`

Website-synthesis uses `schema_version` at synthesis.json top level.
Repo-synthesis uses `version`. Both are documented as such in their respective
REFERENCE.md files (this is intentional asymmetry, not a bug), but it breaks the
stated forward-compatibility design for a future cross-type synthesizer
(website-synthesis REFERENCE.md §5.2 acknowledges this shared field).

---

## Gaps

1. **No actual website-analysis output exists to verify real-world schema.** The
   `.research/website-analysis/` directory contains only the deep-research
   findings subdirectory — no `/website-analysis/` per-site output exists,
   suggesting the skill has not been executed in this codebase. All
   website-analysis schema findings rely on REFERENCE.md spec only.

2. **No synthesis output exists for either skill.** Neither
   `.research/repo-analysis/SYNTHESIS.md` nor
   `.research/website-analysis/synthesis/` exist. Synthesis schemas verified
   against REFERENCE.md spec only, not real output files.

3. **The repo-analysis REFERENCE.md §3 v2.0 spec has not been updated to reflect
   the v4.2 candidate model.** The gap between documented schema and runtime
   schema is significant and could mislead implementation of the repo-synthesis
   consumer.

4. **Reading-chain.jsonl population is unclear.** The REFERENCE.md says
   repo-analysis populates `.research/repo-analysis/reading-chain.jsonl`, but
   this file was not observed in the filesystem. Whether it is produced during
   actual runs is unverified.

5. **The `research-index.jsonl` format for repo-analysis vs deep-research is
   different.** The observed entries are all from deep-research runs and use a
   different schema than what repo-analysis REFERENCE.md §12b specifies. Whether
   repo-analysis actually writes to this file in practice is unverified.

6. **`mined-links.jsonl` appears in the curated-list run of build-your-own-x.**
   However, the content-eval.jsonl ALSO appears. REFERENCE.md says these are
   alternatives (one or the other). Actual run produced both — this may indicate
   the curated-list path produces both, or may be a spec violation.

---

## Serendipity

- **The `dimensions/` subdirectory in repo-analysis** contains per-agent output
  files from parallel dimension analysis. This is an intermediate artifact with
  no defined schema in REFERENCE.md — it's raw agent output. No equivalent
  exists in website-analysis (which uses up to 3 agents but merges output
  inline).

- **Obsidian/Dataview compatibility** is explicitly designed into
  `SITE-ANALYSIS.md` via YAML frontmatter (website-analysis REFERENCE.md §1.9).
  No equivalent frontmatter is specified for `creator-view.md` in repo-analysis.
  This is a differentiator that website-analysis could export to other
  consumers.

- **The `content-eval.jsonl` schema is the cleanest of all JSONL schemas** —
  minimal fields, well-defined, no score inflation. It could serve as a template
  for simplifying other JSONL schemas.

- **The TDMS intake transform** defined in repo-analysis REFERENCE.md §3.2 is
  unique to that skill — it specifies how `findings.jsonl` maps to the tech debt
  pipeline. No equivalent transform is defined for website-analysis findings. If
  website findings need to enter TDMS, no transform spec exists.

- **Expedition mode's three-file pattern** (`meta.json`, `snap.json`, `.jsonl`)
  is an elegant resumability design: full rewrite for current-state files,
  append-only for the event log. This pattern could be adopted by any
  long-running multi-hop operation across skills.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The high confidence is supported by direct filesystem inspection of actual
output artifacts alongside REFERENCE.md spec reading. The primary uncertainty
(MEDIUM) concerns the temporary/intermediate artifact lifecycle, which is not
explicitly specified in any REFERENCE.md.

---

## Sources

| #   | File path                                                                       | Type        | Trust | Notes                                                     |
| --- | ------------------------------------------------------------------------------- | ----------- | ----- | --------------------------------------------------------- |
| 1   | `.claude/skills/website-analysis/SKILL.md`                                      | Skill spec  | HIGH  | Lines 72-74, 265-289                                      |
| 2   | `.claude/skills/website-analysis/REFERENCE.md`                                  | Skill spec  | HIGH  | §1.0-§1.14, §14 (lines 1-600, 2049-2116)                  |
| 3   | `.claude/skills/repo-analysis/SKILL.md`                                         | Skill spec  | HIGH  | Lines 65-71, 422-458                                      |
| 4   | `.claude/skills/repo-analysis/REFERENCE.md`                                     | Skill spec  | HIGH  | §3.1-§3.8, §8, §12b (lines 199-750, 1119-1175, 1352-1371) |
| 5   | `.claude/skills/website-synthesis/SKILL.md`                                     | Skill spec  | HIGH  | Lines 65-79, 252-257                                      |
| 6   | `.claude/skills/website-synthesis/REFERENCE.md`                                 | Skill spec  | HIGH  | §4, §6-§8 (lines 455-710)                                 |
| 7   | `.claude/skills/repo-synthesis/SKILL.md`                                        | Skill spec  | HIGH  | Lines 56-79, 263-265                                      |
| 8   | `.claude/skills/repo-synthesis/REFERENCE.md`                                    | Skill spec  | HIGH  | §7-§10 (lines 347-500)                                    |
| 9   | `.research/repo-analysis/codecrafters-io-build-your-own-x/analysis.json`        | Real output | HIGH  | Ground truth schema verification                          |
| 10  | `.research/repo-analysis/codecrafters-io-build-your-own-x/findings.jsonl`       | Real output | HIGH  | Ground truth schema verification                          |
| 11  | `.research/repo-analysis/codecrafters-io-build-your-own-x/value-map.json`       | Real output | HIGH  | Ground truth — reveals v4.2 schema vs spec drift          |
| 12  | `.research/repo-analysis/codecrafters-io-build-your-own-x/content-eval.jsonl`   | Real output | HIGH  | Ground truth for content-eval schema                      |
| 13  | `.research/repo-analysis/codecrafters-io-build-your-own-x/coverage-audit.jsonl` | Real output | HIGH  | Ground truth for coverage-audit schema                    |
| 14  | `.research/repo-analysis/extraction-journal.jsonl`                              | Real output | HIGH  | Ground truth — reveals actual cross-repo schema           |
| 15  | `.research/repo-analysis/hkuds-cli-anything/trends.jsonl`                       | Real output | HIGH  | Ground truth for trends.jsonl actual schema               |
| 16  | `.research/repo-analysis/EXTRACTIONS.md`                                        | Real output | HIGH  | EXTRACTIONS.md format verification                        |
