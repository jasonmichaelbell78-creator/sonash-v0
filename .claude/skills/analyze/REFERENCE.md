<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-04-15
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Analyze Reference

Type detection patterns, flags reference, synthesis mode specification, handler
dispatch contract, index update procedure, and error handling for the analyze
router skill.

---

## 1. Type Detection Patterns

The router evaluates input against these patterns in priority order. The first
match wins. If no pattern matches and the input looks like a URL, it falls
through to `website`. If no input is provided, it enters synthesis mode.

### 1.1 Repo Detection

Matches GitHub repository URLs, excluding gist URLs.

**Patterns:**

```
github.com/<owner>/<repo>
github.com/<owner>/<repo>/tree/<branch>
github.com/<owner>/<repo>/blob/<path>
github.com/<owner>/<repo>/issues
github.com/<owner>/<repo>/pulls
```

**Regex (conceptual):**

```
/^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+(\/.*)?$/
```

**Exclusions (checked before repo match):**

- `gist.github.com/*` -- routes to document, not repo
- `github.com/orgs/*` -- not a repo, ambiguous input
- `github.com/<owner>` (no repo segment) -- ambiguous, ask user

**Edge cases:**

| Input                                           | Result    | Reason                               |
| ----------------------------------------------- | --------- | ------------------------------------ |
| `https://github.com/vercel/next.js`             | repo      | Standard repo URL                    |
| `https://github.com/vercel/next.js/tree/canary` | repo      | Branch URL, strip to owner/repo      |
| `github.com/vercel/next.js` (no protocol)       | repo      | Prepend https://, then match         |
| `https://gist.github.com/user/abc123`           | document  | Gist exclusion takes priority        |
| `https://github.com/vercel`                     | ambiguous | No repo segment -- ask user          |
| `https://gitlab.com/owner/repo`                 | website   | Not GitHub, falls through to website |

### 1.2 Media Detection

Matches video and audio content from known platforms or by file extension.

**URL patterns:**

```
youtu.be/*
youtube.com/watch*
youtube.com/shorts/*
youtube.com/live/*
youtube.com/playlist*
tiktok.com/@*/video/*
tiktok.com/t/*
vimeo.com/*
```

**File extension patterns:**

```
*.mp3, *.wav, *.m4a, *.flac, *.ogg, *.aac     (audio)
*.mp4, *.mkv, *.webm, *.avi, *.mov              (video)
```

**Regex (URL-based):**

```
/^https?:\/\/(www\.)?(youtu\.be\/|youtube\.com\/(watch|shorts|live|playlist)|tiktok\.com\/)/
```

**Regex (extension-based):**

```
/\.(mp3|wav|m4a|flac|ogg|aac|mp4|mkv|webm|avi|mov)$/i
```

**Edge cases:**

| Input                                     | Result  | Reason                             |
| ----------------------------------------- | ------- | ---------------------------------- |
| `https://youtu.be/dQw4w9WgXcQ`            | media   | Short YouTube URL                  |
| `https://www.youtube.com/watch?v=abc123`  | media   | Standard YouTube watch             |
| `https://youtube.com/playlist?list=PLabc` | media   | Playlist URL                       |
| `https://www.tiktok.com/@user/video/123`  | media   | TikTok video                       |
| `/path/to/recording.mp3`                  | media   | Local audio file extension         |
| `https://podcast.example.com/episode/42`  | website | No media extension or known domain |

### 1.3 Document Detection

Matches files (local or remote) that contain structured text content.

**URL patterns:**

```
gist.github.com/*
arxiv.org/abs/*
arxiv.org/pdf/*
```

**File extension patterns:**

```
*.pdf, *.md, *.txt, *.rst, *.docx, *.csv, *.json, *.yaml, *.yml
```

**Regex (URL-based):**

```
/^https?:\/\/(gist\.github\.com|arxiv\.org)\//
```

**Regex (extension-based):**

```
/\.(pdf|md|txt|rst|docx|csv|json|ya?ml)$/i
```

**Local file detection:** If the input does not start with `http` and matches a
file extension above, or if the path exists on the filesystem, it routes to
document.

**Edge cases:**

| Input                                 | Result   | Reason                 |
| ------------------------------------- | -------- | ---------------------- |
| `https://gist.github.com/user/abc123` | document | Gist URL pattern       |
| `https://arxiv.org/abs/2301.12345`    | document | ArXiv abstract         |
| `https://arxiv.org/pdf/2301.12345`    | document | ArXiv PDF              |
| `./docs/README.md`                    | document | Local markdown file    |
| `/absolute/path/to/report.pdf`        | document | Local PDF file         |
| `notes.txt`                           | document | Extension match        |
| `https://example.com/paper.pdf`       | document | Extension match on URL |

### 1.4 Website Detection (fallback)

Any URL that does not match repo, media, or document patterns.

**Regex:**

```
/^https?:\/\//
```

This is the catch-all for URLs. If it looks like a URL but did not match any
prior pattern, it is a website.

**Edge cases:**

| Input                                | Result    | Reason                              |
| ------------------------------------ | --------- | ----------------------------------- |
| `https://docs.composio.dev/patterns` | website   | Generic URL, no special pattern     |
| `https://blog.example.com/post/123`  | website   | Blog URL                            |
| `http://localhost:3000`              | website   | Local dev URL, still treated as URL |
| `ftp://files.example.com/data`       | ambiguous | Not http/https, ask user            |

### 1.5 Synthesis Detection

No input provided, or `--synthesize` flag present.

**Triggers:**

- Empty input (no arguments after `/analyze`)
- `--synthesize` flag present (with or without `--type`)

### 1.6 Priority Order Summary

```
1. --type override (if present, skip detection entirely)
2. Gist URL → document
3. ArXiv URL → document
4. GitHub repo URL → repo
5. YouTube/TikTok/Vimeo URL → media
6. Media file extension → media
7. Document file extension → document
8. Local file path → document
9. Any http/https URL → website
10. No input or --synthesize → synthesis
11. Anything else → ambiguous (ask user)
```

---

## 2. Flags Reference

### 2.1 `--type=<type>`

Force source type detection. Overrides all pattern matching.

**Valid values:** `repo`, `website`, `media`, `document`

**Examples:**

```
/analyze https://gitlab.com/owner/repo --type=repo
  # GitLab URL would normally route to website; --type forces repo handler

/analyze https://example.com/api-docs.pdf --type=website
  # PDF extension would route to document; --type forces website handler

/analyze some-ambiguous-input --type=document
  # Skips detection entirely, routes to document handler
```

**Validation:** If the value is not one of the four valid types, the router
rejects the command: "Invalid --type value. Use: repo, website, media, or
document."

### 2.2 `--depth=<level>`

Set the analysis depth. Passed through to the handler unchanged.

**Valid values:** `quick`, `standard`, `deep`

**Default behavior:** If omitted, each handler uses its own default depth
(typically `standard` for repos and websites, `quick` for documents).

**Examples:**

```
/analyze https://github.com/vercel/next.js --depth=deep
  # Deep clone + full dimension analysis

/analyze https://docs.example.com --depth=quick
  # Quick site scan, fewer pages

/analyze report.pdf --depth=standard
  # Standard document analysis
```

### 2.3 `--synthesize`

Enter synthesis mode. Can be combined with `--type` to scope synthesis to a
single source type.

**Examples:**

```
/analyze --synthesize
  # Delegates to /synthesize — cross-source synthesis of all analyzed sources

/analyze --synthesize --type=repo
  # Delegates to /synthesize with --type=repo (scoped synthesis)

/analyze --synthesize --type=website
  # Delegates to /synthesize with --type=website (scoped synthesis)

/analyze --synthesize --type=document
  # Delegates to /synthesize with --type=document (scoped synthesis)

/analyze --synthesize --type=media
  # Delegates to /synthesize with --type=media (scoped synthesis)
```

**Note:** The router delegates all synthesis modes to the unified `/synthesize`
skill. `--type=<type>` is passed through as a scope filter. The router does not
perform synthesis logic itself.

### 2.4 Flag Passthrough

Any flag not recognized by the router is passed through to the handler skill
unchanged. This allows handler-specific flags without router changes.

**Known handler-specific flags (for reference):**

| Flag                | Handler          | Purpose                       |
| ------------------- | ---------------- | ----------------------------- |
| `--mode=expedition` | website-analysis | Multi-page expedition crawl   |
| `--resume`          | website-analysis | Resume interrupted expedition |
| `--branch=<name>`   | repo-analysis    | Analyze specific branch       |
| `--skip-clone`      | repo-analysis    | Use existing clone            |

---

## 3. Synthesis Mode Specification

### 3.1 Unified Synthesis Delegation

All `--synthesize` invocations delegate to the unified `/synthesize` skill,
regardless of `--type`:

| `--type` value | Delegated to  | Behavior                                 |
| -------------- | ------------- | ---------------------------------------- |
| (none)         | `/synthesize` | Cross-source synthesis across all types  |
| `repo`         | `/synthesize` | Scoped synthesis — repo sources only     |
| `website`      | `/synthesize` | Scoped synthesis — website sources only  |
| `document`     | `/synthesize` | Scoped synthesis — document sources only |
| `media`        | `/synthesize` | Scoped synthesis — media sources only    |

The router passes `--type` through as a scope filter but performs no synthesis
logic itself. The `/synthesize` skill reads its own state files
(`.claude/state/synthesize.state.json`) and the `.research/analysis/` directory.
See CONVENTIONS.md §17 for the synthesis output contract.

### 3.2 Cross-Type Synthesis

When `--synthesize` is used without `--type`, or with `--type=document` or
`--type=media`, the router runs cross-type synthesis directly.

**Step-by-step procedure:**

1. **Source inventory.** Read all `analysis.json` files from:
   - `.research/analysis/<slug>/analysis.json`
   - `.research/repo-analysis/<slug>/analysis.json`
   - `.research/website-analysis/<slug>/analysis.json`

2. **Filter by type (if applicable).** If `--type=document` or `--type=media`,
   only include sources where `source_type` matches.

3. **Incremental check.** For each source, compare `analyzed_at` against
   `last_synthesized_at`:
   - If `last_synthesized_at` is null or older than `analyzed_at`, the source is
     considered new/changed.
   - If all sources have `last_synthesized_at >= analyzed_at`, report "Nothing
     new to synthesize."

4. **Load previous synthesis.** Read `.research/analysis/SYNTHESIS.md` if it
   exists. This provides continuity for incremental updates.

5. **Spawn parallel agents:**

   **Theme Finder Agent:**

   ```
   Role: Cross-source pattern identifier
   Input: All new/changed analysis.json summaries + candidate lists
   Task: Identify recurring themes, shared patterns, and cross-source
         connections. Group findings by theme. Note which sources
         contribute to each theme.
   Output: themes[] array with { name, description, sources[], strength }
   ```

   **Gap Finder Agent:**

   ```
   Role: Cross-source gap and contradiction detector
   Input: All new/changed analysis.json summaries + candidate lists
   Task: Identify gaps (topics mentioned by some sources but absent from
         others), contradictions (conflicting approaches), and unexplored
         areas suggested by the combined knowledge.
   Output: gaps[] array with { name, description, type, sources[] }
   ```

6. **Produce SYNTHESIS.md.** Merge agent outputs with previous synthesis (if
   any) into `.research/analysis/SYNTHESIS.md`. Format:

   ```markdown
   # Cross-Source Synthesis

   **Last updated:** <ISO8601> **Sources included:** <count> (<new_count> new
   since last synthesis)

   ## Themes

   ### <Theme Name>

   <Conversational description of the theme>
   **Contributing sources:** source1, source2, source3

   ## Gaps and Contradictions

   ### <Gap Name>

   <Description of what is missing or contradictory>
   **Type:** gap | contradiction | unexplored
   **Relevant sources:** source1, source2
   ```

7. **Update timestamps.** Set `last_synthesized_at` to current ISO8601 timestamp
   on all processed `analysis.json` files.

8. **Rebuild index.** Run `node scripts/cas/rebuild-index.js` to update the
   `last_synthesized_at` column in the SQLite index.

### 3.3 `last_synthesized_at` Tracking

This field exists on every `analysis.json` record and in the `sources` SQLite
table.

**Schema:** `z.string().nullable().default(null)` (ISO8601 or null)

**Lifecycle:**

| Event                 | Value                                   |
| --------------------- | --------------------------------------- |
| Source first analyzed | `null`                                  |
| Source re-analyzed    | Reset to `null` (triggers re-synthesis) |
| Synthesis includes it | Set to synthesis timestamp              |

**Query:** To find sources needing synthesis:

```sql
SELECT * FROM sources
WHERE last_synthesized_at IS NULL
   OR last_synthesized_at < analyzed_at
```

---

## 4. Handler Dispatch Contract

### 4.1 What the Router Passes to Each Handler

The router does not invoke handlers programmatically. It dispatches by invoking
the handler skill with the original input and all flags. The handler skill reads
its own SKILL.md and runs its full pipeline.

**Dispatch format (conceptual):**

```
Invoke skill: /repo-analysis https://github.com/owner/repo --depth=deep
Invoke skill: /website-analysis https://example.com --depth=standard
Invoke skill: /media-analysis https://youtu.be/abc123
Invoke skill: /document-analysis ./report.pdf
```

**What the router provides:**

| Field           | Type   | Description                               |
| --------------- | ------ | ----------------------------------------- |
| `input`         | string | The original URL, path, or other input    |
| `detected_type` | string | What the router detected (for logging)    |
| `flags`         | object | All parsed flags passed through unchanged |

### 4.2 What the Router Expects Back

The router does not receive a programmatic return value. It expects the handler
to complete its full pipeline and produce the standard output artifacts per
CONVENTIONS.md Section 13:

| Artifact                   | Location                                      |
| -------------------------- | --------------------------------------------- |
| `analysis.json`            | `.research/analysis/<slug>/analysis.json`     |
| `value-map.json`           | `.research/analysis/<slug>/value-map.json`    |
| `creator-view.md`          | `.research/analysis/<slug>/creator-view.md`   |
| Extraction journal entries | `.research/extraction-journal.jsonl` (append) |

**Slug derivation:** Each handler generates the slug from its input. The router
reads the slug from the handler's output to pass to the index updater.

**Slug path contract (LOCKED — do not change without router update):** Router
reads the slug from `.research/analysis/<slug>/analysis.json`. If a handler
renames its output directory or relocates `analysis.json`, this contract breaks
silently — update this section and `scripts/cas/update-index.js` before changing
any handler output path. All 4 handlers currently honor this path (verified via
`/skill-audit analyze` Session #283).

**Extraction-journal contract:** Handler-appended entries in
`.research/extraction-journal.jsonl` follow the canonical JSONL format described
in CONVENTIONS.md §11 (Extraction Context) and §13 (Handler Output Contract).
`/analyze` does not write to the extraction-journal; handlers do.

**Completion signal:** The handler presents its routing menu, which signals to
the router that the pipeline is complete and it can proceed to index update.

### 4.3 Handler Availability

| Handler              | Status | Notes                   |
| -------------------- | ------ | ----------------------- |
| `/repo-analysis`     | Mature | v5.0, fully implemented |
| `/website-analysis`  | Mature | v2.0, fully implemented |
| `/document-analysis` | Mature | v2.0, fully implemented |
| `/media-analysis`    | Mature | v2.0, fully implemented |

When a handler is not yet available, the router reports: "Handler for [type] is
not yet implemented. Use --type to route to an available handler, or defer this
source."

---

## 5. Index Update Procedure

### 5.1 Post-Analysis Update

After every successful handler completion, the router runs:

```bash
node scripts/cas/update-index.js --slug=<slug>
```

**What the script does:**

1. Reads `analysis.json` from the slug directory (searches
   `.research/analysis/`, `.research/repo-analysis/`,
   `.research/website-analysis/`)
2. Extracts a source record with fields: `id`, `source_type`, `source`, `slug`,
   `title`, `analyzed_at`, `depth`, `quality_band`, `quality_score`,
   `personal_fit_band`, `personal_fit_score`, `classification`, `summary`,
   `tags`, `last_synthesized_at`
3. Upserts the source record into the `sources` table (`INSERT OR REPLACE`)
4. Deletes old extraction entries for this source from `extractions` table
5. Re-reads `extraction-journal.jsonl` and inserts all entries matching this
   source
6. Updates tag junction tables (`source_tags`, `extraction_tags`)
7. Rebuilds FTS5 indexes (`search_sources`, `search_extractions`)

**Success output:**
`Updated index for <slug>: source upserted, N extractions synced.`

### 5.2 Post-Synthesis Rebuild

After cross-type synthesis, the router runs a full rebuild instead of an
incremental update:

```bash
node scripts/cas/rebuild-index.js
```

This is necessary because synthesis updates `last_synthesized_at` across
multiple sources.

**What the rebuild does:**

1. Deletes the existing SQLite database
2. Recreates the schema (5 tables + 2 FTS5 virtual tables)
3. Scans all three analysis directories for `analysis.json` files
4. Inserts all source records
5. Reads and inserts all extraction journal entries
6. Builds tag junction tables
7. Populates FTS5 indexes
8. Runs integrity and foreign key checks
9. Reports: `Sources: N, Extractions: M, Unique tags: K`

### 5.3 Database Path and Schema

**Database location:** `.research/content-analysis.db` (SQLite, WAL mode)

**Tables:**

| Table                | Type     | Purpose                                      |
| -------------------- | -------- | -------------------------------------------- |
| `sources`            | Regular  | One row per analyzed source                  |
| `extractions`        | Regular  | One row per extraction candidate             |
| `tags`               | Regular  | Unique tag names                             |
| `source_tags`        | Junction | Many-to-many: sources to tags                |
| `extraction_tags`    | Junction | Many-to-many: extractions to tags            |
| `search_sources`     | FTS5     | Full-text search over title, summary, tags   |
| `search_extractions` | FTS5     | Full-text search over candidate, notes, tags |

**FTS5 tokenizer:** `porter unicode61` (stemming + Unicode normalization)

### 5.4 Index Failure Handling

If `update-index.js` fails after a successful analysis:

1. The router warns: "Analysis completed but index update failed: [error]."
2. The analysis artifacts are preserved on disk.
3. The source will not appear in `/recall` results until indexed.
4. User can manually run: `node scripts/cas/rebuild-index.js` to recover.

The router does NOT fail the analysis due to an index failure. The analysis
output is the primary artifact; the index is a secondary convenience layer.

---

## 6. Error Handling

### 6.1 Ambiguous Input Resolution

When the router cannot confidently determine the source type:

**Ambiguous triggers:**

- URL without `http`/`https` that does not match a file extension
- GitHub org URL without repo segment
- URL with multiple possible type matches
- Non-URL, non-file input that does not match any pattern
- `ftp://` or other non-http protocols

**Resolution protocol:**

1. Present the ambiguity: "This input could be [type A] or [type B]."
2. List the options with numbers:
   ```
   1. Treat as [type A] (because [reason])
   2. Treat as [type B] (because [reason])
   3. Specify explicitly with --type=<type>
   ```
3. Wait for user response before proceeding.
4. Do NOT guess and proceed. Ambiguity is a hard stop.

### 6.2 Handler Failures

When a handler skill fails during its pipeline:

**Partial failure (some artifacts produced):**

1. The router checks which artifacts exist in the slug directory.
2. If `analysis.json` exists, attempt index update for whatever was produced.
3. Report: "Handler completed partially. [N/4] artifacts produced. Missing:
   [list]."
4. Offer: "Retry analysis? Or accept partial results?"

**Complete failure (no artifacts):**

1. Do not attempt index update.
2. Report: "Handler failed for [input]. Error: [sanitized error]."
3. Offer: "Retry with different flags? Or skip this source?"

**Handler not implemented:**

1. Report: "The [type] handler is not yet implemented."
2. Offer alternatives:
   - "Use --type=website to analyze the URL as a website instead."
   - "Defer this source until the handler is built."

### 6.3 Index Database Missing

When `update-index.js` is called but the database does not exist:

1. The script exits with: "Index not found. Run: node
   scripts/cas/rebuild-index.js first"
2. The router catches this and runs `rebuild-index.js` automatically.
3. After rebuild, retries the update.
4. If rebuild also fails, reports the error and continues.

### 6.4 Malformed Analysis Output

When a handler produces `analysis.json` that does not validate against the Zod
schema in `scripts/lib/analysis-schema.js`:

1. Validation error is surfaced to the user with specific field failures.
2. The invalid file is NOT indexed.
3. The router offers: "The handler produced invalid output. Retry analysis? Or
   manually inspect `.research/analysis/<slug>/analysis.json`?"

### 6.5 Error Sanitization

All error messages presented to the user MUST be sanitized using
`sanitizeError()` from `scripts/lib/sanitize-error.js`. Raw `error.message`
values are never displayed. This prevents leaking file paths, stack traces, or
sensitive system information.

### 6.6 Failure Recovery Matrix

One-line-per-class summary of all failure paths. All user-facing messages use
the standardized format: `[/analyze] FAILED <class>: <sanitized>. Recovery:

<option>`.

| Failure class                                  | Trigger                              | Artifacts state                | Recovery options                                          |
| ---------------------------------------------- | ------------------------------------ | ------------------------------ | --------------------------------------------------------- |
| Ambiguous input (§6.1)                         | Pattern match uncertain              | No artifacts written           | (1) pick A, (2) pick B, (3) explicit `--type`, (4) Cancel |
| Handler partial (§6.2)                         | Some artifacts produced              | `analysis.json` may exist      | Retry analysis / accept partial / defer                   |
| Handler complete failure (§6.2)                | No artifacts produced                | None                           | Retry with different flags / skip source                  |
| Handler not implemented (§6.2)                 | Type maps to planned handler         | None                           | Use `--type` to alternate handler / defer                 |
| Index database missing (§6.3)                  | `.research/content-analysis.db` gone | Handler artifacts preserved    | Auto-rebuild via `rebuild-index.js`                       |
| Malformed analysis output (§6.4)               | Zod validation fails                 | Artifacts on disk, not indexed | Retry / manual inspect / skip indexing                    |
| Retry ceiling exceeded (SKILL.md Guard Rails)  | 2 consecutive retries fail           | Preserved per attempt          | Exit with message, inspect logs manually                  |
| Invalid prompt response (SKILL.md Guard Rails) | User answer ≠ any option             | Unchanged                      | Re-present with "Invalid — please choose N"               |

---

## 7. Routing-Decision Log

### 7.1 Purpose

Lightweight operational signal captured on every `/analyze` invocation. Append-
only JSONL at `.claude/state/analyze-routing-log.jsonl` (gitignored by the
`.claude/state/` pattern). Feeds future detection-tuning work — e.g., if users
repeatedly override `--type` on a pattern, the detection regex may be missing a
case.

### 7.2 Schema (per line)

```json
{
  "ts": "2026-04-15T22:00:00Z",
  "input": "<raw input (url or path, truncated to 256 chars)>",
  "detected_type": "repo|website|document|media|synthesis|ambiguous",
  "detection_reason": "<short reason string, e.g. 'github.com pattern'>",
  "user_type_override": "repo|website|document|media|null",
  "ambiguity_resolution": "A|B|explicit|cancel|null",
  "handler_dispatched": "/repo-analysis|...|/synthesize|null",
  "slug": "<resulting slug or null>",
  "index_update_status": "ok|warn|fail|null",
  "duration_ms": 1234
}
```

### 7.3 Retention

Append-only. No rotation; the file grows slowly (one line per invocation).
Rotate manually if it exceeds ~10 MB (unlikely in practice). Never read by
/analyze runtime — consumed only by offline detection-tuning analysis.

### 7.4 Privacy

No transcript content, no handler output, no URL query strings are logged — only
the input (truncated), detection signals, and dispatch outcome. Respect
CLAUDE.md §2 privacy defaults.

---

## Version History

| Version | Date       | Description                                                                                                                                                                                               |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1     | 2026-04-15 | Session #283 skill-audit: locked slug path contract in §4.2, added extraction-journal JSONL reference (CONVENTIONS.md §11/§13), added §6.6 Failure Recovery Matrix, added §7 Routing-Decision Log schema. |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269)                                                                                                                                                                  |
