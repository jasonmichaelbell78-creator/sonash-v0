---
name: analyze
description: >-
  Content Analysis System router. Feed it anything — repo URL, website, YouTube
  link, PDF, gist, or no input for synthesis. Auto-detects source type and
  dispatches to the right handler skill.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-04-15
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`

# Analyze

The front door to the Content Analysis System. One command for everything:
`/analyze <anything>`.

## Handoff Contract (formalized v1.2)

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

**Handler responsibilities:** Run the full pipeline per its SKILL.md. The
handler treats the call as if invoked directly
(`/repo-analysis <target> --depth=...`); `auto_detected_type` is informational.

**Router responsibilities after handler returns:** Run post-handler index update
steps (below).

## How It Works

1. You provide an input (URL, file path, or nothing)
2. The router detects what type of source it is
3. It dispatches to the right handler skill
4. After analysis, the SQLite index updates automatically
5. The source is immediately available via `/recall`

## Input

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

### Analysis Mode (input provided)

```
1. Parse input → detect source type (or use --type override)
2. Announce: "Detected: [type]. Routing to [handler]."
3. Pass through all flags (--depth, etc.) to handler
4. Handler runs its full pipeline (per its SKILL.md)
5. MANDATORY post-handler step (router does this, not the handler):
   a. Determine slug from handler output directory name
   b. Run: node scripts/cas/update-index.js --slug=<slug>
   c. If index update fails, warn user but don't fail the analysis
   d. Run: node scripts/cas/generate-extractions-md.js
   e. Confirm: "Indexed. Available via /recall."
6. Handler presents its routing menu
```

**Post-handler step is the router's responsibility.** Handler skills do not run
index updates — they write artifacts. The router runs the index update after
control returns from the handler. If the router delegates via `/skill` and
doesn't get control back, the index update must be run manually.

### Synthesis Mode (no input or --synthesize)

Cross-source synthesis is handled by the unified `/synthesize` skill. The router
delegates entirely — it does not perform synthesis logic itself.

```
1. Delegate to /synthesize, passing through any flags
   (e.g., --type=<repo|website|document|media>, --scope=<tags>, --paradigm=<x>)
2. /synthesize handles:
   - Source inventory across all 4 types
   - Tier weighting and pre-flight validation
   - Paradigm selection (thematic, narrative, matrix, meta-pattern)
   - Parallel agent dispatch (theme finder, gap finder, reading-chain builder,
     opportunity router)
   - 8-section output (themes, gaps, reading chain, mental model evolution,
     fit portfolio, knowledge map, opportunity matrix, changes since previous)
   - Index rebuild and last_synthesized_at bookkeeping
3. Router resumes control after /synthesize exits — no post-processing needed
```

**Note:** `/synthesize` is a consumer skill — it reads handler output
(analysis.json + per-source artifacts) and produces synthesis artifacts in
`.research/analysis/synthesis/`. It supersedes the deprecated `/repo-synthesis`
and `/website-synthesis` skills and adds cross-type synthesis as a new
capability. See CONVENTIONS.md §17 for the synthesis output contract.

## Critical Rules

1. **Router is thin.** All analysis logic lives in handler skills. The router
   only detects type, dispatches, and updates the index.
2. **Always update index.** After every successful analysis, run
   `update-index.js`. If indexing fails, warn but don't fail the analysis.
3. **Pass flags through.** `--depth`, `--type`, and any handler-specific flags
   pass to the handler unchanged.
4. **Ambiguous inputs get a confirmation.** If type detection is uncertain, ask:
   "This looks like it could be [A] or [B]. Which? Or use --type to specify."

## Version History

| Version | Date       | Description                                                                                                                                                                                                                                                    |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.2     | 2026-04-15 | Skill-audit batch Wave 4: formalize handoff contract (`{target, auto_detected_type, flags}`) matching handler v2.0 declarations. T28 tagline removed from user-visible description. CONVENTIONS.md reference added. Full /analyze audit deferred as follow-up. |
| 1.1     | 2026-04-09 | Fix: post-handler index update is router's responsibility, add generate-extractions-md step (Session #270)                                                                                                                                                     |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269)                                                                                                                                                                                                                       |
