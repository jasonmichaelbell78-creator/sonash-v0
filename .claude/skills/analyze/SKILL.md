---
name: analyze
description: >-
  Content Analysis System router. Feed it a URL or file path — repo, website,
  YouTube link, PDF, or gist. Auto-detects type, dispatches to the right
  handler, and indexes results for /recall.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-04-15
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`

Also supports: `--type`, `--depth`, `--synthesize`.

# Analyze

The front door to the Content Analysis System. One command for everything:
`/analyze <anything>`.

## Critical Rules (MUST)

1. **MUST keep the router thin** — all analysis logic lives in handler skills;
   this router only detects type, dispatches, and updates the index.
2. **MUST update the index** after every successful analysis (see REFERENCE §5 —
   Index Update Procedure).
3. **MUST pass unknown flags through** to the handler unchanged (see REFERENCE
   §2.4 — Flag Passthrough).
4. **MUST stop and ask on ambiguous input** — never guess; follow the numbered
   resolution protocol (see REFERENCE §6.1 — Ambiguous Input Resolution).
5. **MUST validate handler artifacts** before running `update-index.js` (see
   Router Flow Step 4.5).
6. **MUST sanitize all error messages** via `scripts/lib/sanitize-error.js` per
   CLAUDE.md §5 Top 5 Anti-Patterns.
7. **SHOULD log routing decisions** to `.claude/state/analyze-routing-log.jsonl`
   (one JSON object per line) for future detection tuning.

## When to Use

- User invokes `/analyze` with any URL, file path, or no input
- Need to route a source through CAS without knowing its type upfront
- Need cross-source synthesis without specifying a scope
- Want indexed results immediately available via `/recall`

## When NOT to Use

- Source type is already known → use the handler directly (`/repo-analysis`,
  `/website-analysis`, `/document-analysis`, `/media-analysis`) for slightly
  faster dispatch with no detection step
- Source is arbitrary unstructured text / ideas → use `/brainstorm` or
  `/deep-research`
- Querying existing analyzed sources → use `/recall`
- Batch analysis of a URL list → call `/analyze` once per source (multi-URL
  batching is out of scope)

## Routing Guide

| When…                           | Use                                                                  |
| ------------------------------- | -------------------------------------------------------------------- |
| Know source type                | `/repo-analysis` (etc.) directly                                     |
| Unsure of type                  | `/analyze <input>`                                                   |
| Want cross-source synthesis     | `/analyze --synthesize` OR `/synthesize` (equivalent)                |
| Synthesis filtered to one type  | `/analyze --synthesize --type=<type>` OR `/synthesize --type=<type>` |
| Query existing analyzed sources | `/recall`                                                            |
| Analyze arbitrary text / ideas  | `/brainstorm` or `/deep-research` (NOT `/analyze`)                   |
| Re-index after manual file edit | `node scripts/cas/rebuild-index.js`                                  |

**CAS pipeline flow:** `/brainstorm` or `/deep-research` → **`/analyze`** →
`/synthesize` → `/recall`.

## Scope

**IN scope:**

- Type detection (regex priority chain; see REFERENCE §1.6)
- Dispatch to one of 4 handler skills (or `/synthesize` for synthesis mode)
- Post-handler SQLite index update + `EXTRACTIONS.md` regeneration
- Ambiguous-input resolution (hard stop, never guess)
- Routing-decision logging (retro signal)

**OUT of scope:**

- Actual analysis logic (delegated to handlers)
- Synthesis logic (delegated to `/synthesize`)
- Querying analyzed sources (→ `/recall`)
- Arbitrary unstructured text analysis
- Multi-URL / URL-list batch processing (one input per invocation)

**Network dependency:** URL inputs require network; local file paths work
offline.

**`/analyze` vs `/deep-research`:** `/deep-research` writes to
`.research/research-index.jsonl` + `.research/<topic-slug>/`. `/analyze` writes
to `.research/analysis/<slug>/` + `.research/content-analysis.db`. Separate
indexes, complementary; no overlap.

## Handoff Contract (v1.2)

The router dispatches to handler skills with a standard payload. All 4 CAS
handlers (`/repo-analysis` v5.0, `/website-analysis` v2.0, `/document-analysis`
v2.0, `/media-analysis` v2.0) acknowledge this contract in their SKILL.md
headers.

**Payload:**

```json
{
  "target": "<raw input the user provided>",
  "auto_detected_type": "repo|website|document|media",
  "flags": { "depth": "...", "type": "..." /* passthrough */ }
}
```

**Dispatch mechanism:** the main session invokes the handler skill via the
`Skill` tool. Control returns to this router when the handler's invocation ends.

**Handler responsibilities:** Run the full pipeline per its SKILL.md. The
handler treats the call as if invoked directly
(`/repo-analysis <target> --depth=…`); `auto_detected_type` is informational.

**Router responsibilities after handler returns:** Run post-handler index update
steps (Router Flow Step 5 below).

## Input

All forms optional — an empty invocation triggers synthesis mode.

```
/analyze <github-repo-url>              # Routes to repo-analysis
/analyze <website-url>                  # Routes to website-analysis
/analyze <youtube-or-tiktok-url>        # Routes to media-analysis
/analyze <file-path.pdf>                # Routes to document-analysis
/analyze <gist-url>                     # Routes to document-analysis
/analyze <arxiv-url>                    # Routes to document-analysis
/analyze --synthesize                   # Synthesis mode (all sources)
/analyze --synthesize --type=repo       # Synthesis mode (repos only)
/analyze <input> --type=<override>      # Force source type detection
/analyze <input> --depth=standard       # Pass depth to handler
```

## Output

Writes to: `.research/analysis/<slug>/`, `.research/content-analysis.db`,
`.research/EXTRACTIONS.md`, `.claude/state/analyze-routing-log.jsonl`.

**Console messages (exact format):**

```
Detected: <type> (<detection-reason>). Routing to /<handler>.
Typical duration: <per-type estimate>.
…dispatching to /<handler>…
[handler emits its own pipeline output]
✓ Detected: <type> · Routed to /<handler> · Indexed
Artifacts at: .research/analysis/<slug>/
Next: /recall --source=<slug>
```

**Handler-produced artifacts** (per REFERENCE §4.2 — conforms to CONVENTIONS.md
§11 Extraction Context + §13 Handler Output Contract):

- `.research/analysis/<slug>/analysis.json`
- `.research/analysis/<slug>/value-map.json`
- `.research/analysis/<slug>/creator-view.md`
- Appended entries in `.research/extraction-journal.jsonl` (JSONL canonical per
  CONVENTIONS.md §11)

**Router side-effects:**

- SQLite `sources` + `extractions` + tag junction tables upserted (see REFERENCE
  §5 for full procedure)
- `.research/EXTRACTIONS.md` regenerated
- One JSONL line appended to `.claude/state/analyze-routing-log.jsonl`

## Type Detection

| Input Pattern                          | Detected Type | Handler Skill        |
| -------------------------------------- | ------------- | -------------------- |
| `github.com/<owner>/<repo>` (not gist) | repo          | `/repo-analysis`     |
| `youtu.be/*`, `youtube.com/watch*`     | media         | `/media-analysis`    |
| `tiktok.com/*`                         | media         | `/media-analysis`    |
| `*.mp3`, `*.wav`, `*.m4a`, `*.mp4`     | media         | `/media-analysis`    |
| `gist.github.com/*`                    | document      | `/document-analysis` |
| `arxiv.org/*`                          | document      | `/document-analysis` |
| `*.pdf`, `*.md`, `*.txt`               | document      | `/document-analysis` |
| Local file paths                       | document      | `/document-analysis` |
| Other URLs                             | website       | `/website-analysis`  |
| No input                               | synthesis     | Synthesis mode       |
| `--synthesize` flag                    | synthesis     | Synthesis mode       |

**Override:** `--type=repo|website|media|document` forces detection.

## Router Flow

> Two modes: **Analysis** (input provided) | **Synthesis** (no input or
> `--synthesize`).

### Analysis Mode

1. **Step 0 — Parse flags.** If `--type` present, skip detection. If
   incompatible flags (`--synthesize` + typed input, or invalid `--type` value),
   reject with a specific error.
2. **Step 1 — Detect source type** (REFERENCE §1.6 priority order).
3. **Step 1.5 — Resolve ambiguity (HARD STOP).** If the input doesn't uniquely
   match a type (REFERENCE §6.1), present numbered options including a
   **Cancel** option. Never guess. Wait for user response.
4. **Step 2 — Announce with reason + estimate.** _"Detected: [type] ([reason]).
   Routing to [handler]. Typical duration: [per-type estimate]."_ If `--type`
   override conflicts with detection, surface the conflict: _"Detected X, but
   --type=Y overrides."_
5. **Step 3 — Pass flags through** to the handler unchanged.
6. **Step 4 — Dispatch to handler** via `Skill` tool call. Emit _"…dispatching
   to /<handler>…"_ while handler runs.
7. **Step 4.5 — Validate handler artifacts.** Verify
   `.research/analysis/<slug>/analysis.json` exists. If missing → route to
   partial-failure handling (REFERENCE §6.2); do not run update-index.
8. **Step 5 — MANDATORY post-handler pipeline:**
   - Read slug from handler output directory
   - `node scripts/cas/update-index.js --slug=<slug>`
   - If index update fails, warn (don't fail the analysis) — see REFERENCE §5.4
   - `node scripts/cas/generate-extractions-md.js`
   - Append routing-decision entry to `.claude/state/analyze-routing-log.jsonl`
   - Emit rich closure:
     `✓ Detected … · Routed … · Indexed / Artifacts at … / Next: /recall --source=<slug>`

**Done when:** handler produced `analysis.json`, index update returned (pass or
graceful-degraded), `EXTRACTIONS.md` regenerated, routing log appended, rich
closure emitted.

### Synthesis Mode

1. **Step 0 — Parse flags** (`--type`, `--scope`, `--paradigm`).
2. **Step 1 — Delegate to `/synthesize`** via `Skill` tool, passing flags
   through unchanged.
3. **Step 2 — Resume control.** No post-delegation action required; the router
   performs **NO post-synthesis index/extractions work** — `/synthesize` owns
   its own index refresh per CONVENTIONS.md §17.

**Done when:** `/synthesize` exited without error.

## Guard Rails

- **Scope explosion** — confirm before dispatching to handler for media > 1 hr
  or local files > 100 MB. Reject URL lists (one input per invocation).
- **Disengagement** — user may abort via Ctrl-C or say _"cancel"_ at any prompt.
  Router preserves partial handler artifacts, does NOT update index, does NOT
  regenerate EXTRACTIONS.md.
- **Retry ceiling** — after 2 failed retries on a given source, exit with
  _"Handler failed repeatedly. Inspect [path]."_ instead of offering another
  retry.
- **Invalid response** — if user response to an ambiguity or failure prompt
  doesn't match any option, re-present with _"Invalid — please choose 1, 2, …"_
- **Idempotency** — re-analyzing overwrites prior `analysis.json`. Handler
  decides re-fetch vs cache (see handler `--skip-clone`, `--resume`).
- **URL normalization** — strip query/fragment/trailing slash; follow one
  redirect before type detection. Further hops delegated to handler.
- **Compaction recovery** — handler pipelines may exceed context. If /analyze
  loses control mid-dispatch, run
  `node scripts/cas/update-index.js --slug=<slug>` manually.
- **Anti-patterns** — reference CLAUDE.md §5 Top 5 (error sanitization, path
  traversal, test mocking, file reads, exec loops). Do not duplicate here.

## Convergence Loops (T25)

**N/A — router decisions are deterministic.** Convergence loops apply downstream
in handlers (e.g., `/repo-analysis` Phase 4 dimension agents) and `/synthesize`
(parallel theme/gap finders). See `/convergence-loop` skill for the pattern.

## Self-Audit

Run `node scripts/skills/analyze/self-audit.js --target=<slug>` to audit a
single invocation's lifecycle, or `--all` for regression sweep across every slug
in `.research/analysis/`. The script checks Dim 1 completeness (artifacts

- SQLite row + extraction-journal + EXTRACTIONS.md freshness), Dim 8 contract
  (slug path, Handoff Contract payload acknowledgments, Zod schema validation),
  and the shared CAS floor. Exit 0 PASS, 1 FAIL, 2 WARN. Dims 6 (multi-agent)
  and 7 (regression) skipped with rationale (deterministic router, no multi-run
  history). See `.claude/skills/_shared/SELF_AUDIT_PATTERN.md`.

## Version History

| Version | Date       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.0     | 2026-04-15 | Full skill-audit rewrite (Session #283, 67 decisions across 12 categories). Added When to Use / When NOT to Use / Routing Guide / Scope / Output / Guard Rails sections (REQUIRED per SKILL_STANDARDS.md). Critical Rules promoted to top third with RFC 2119 MUST + REFERENCE cross-refs. Router Flow restructured: Step 0 flag parse, Step 1.5 ambiguity hard stop, Step 4.5 artifact validation, Step 6 dropped (handler-emitted, not router). Synthesis Mode simplified. Post-handler pipeline now includes routing-log append + rich closure. Committed on Skill-tool dispatch mechanism. Per-type effort estimates. Idempotency + retry ceiling + scope-explosion + disengagement + URL normalization + compaction guard rails added. Cat 11 scored N/A (router is deterministic). Cat 12 wired to new `scripts/skills/analyze/self-audit.js` with `--target=<slug>` / `--all` modes. |
| 1.2     | 2026-04-15 | Skill-audit batch Wave 4: formalize handoff contract, T28 tagline cleanup, CONVENTIONS.md reference added.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.1     | 2026-04-09 | Fix: post-handler index update is router's responsibility, add generate-extractions-md step (Session #270).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### Learnings since v1.0

- **v1.0 → v1.1:** post-handler index update is the router's responsibility, not
  the handler's
- **v1.1 → v1.2:** formalized handoff contract so handlers can acknowledge it
  explicitly
- **v1.2 → v2.0:** structural gaps (missing REQUIRED sections, no self-audit, no
  RFC 2119 hierarchy, ambiguity buried in REFERENCE) surfaced via `/skill-audit`
  single-mode run. Primary lesson: thin routers still need the full
  SKILL_STANDARDS.md scaffolding — "thin" describes the dispatch logic, not the
  documentation.
