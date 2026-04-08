---
name: analyze
description: >-
  Content Analysis System router. Feed it anything — repo URL, website, YouTube
  link, PDF, gist, or no input for synthesis. Auto-detects source type and
  dispatches to the right handler skill. Part of T28 CAS.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Analyze

The front door to the Content Analysis System. One command for everything:
`/analyze <anything>`.

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
5. After handler completes:
   a. Run: node scripts/cas/update-index.js --slug=<slug>
   b. Confirm: "Indexed. Available via /recall."
6. Handler presents its routing menu
```

### Synthesis Mode (no input or --synthesize)

```
1. Count sources in .research/analysis/ by type
2. If --type=repo: delegate to /repo-synthesis (mature, v1.3)
3. If --type=website: delegate to /website-synthesis (mature, v1.1)
4. If no --type flag (cross-type synthesis):
   a. Read all analysis.json files from .research/analysis/
   b. Check last_synthesized_at — identify new/changed sources
   c. If no new sources: "Nothing new to synthesize."
   d. Read previous SYNTHESIS.md (if exists)
   e. Spawn parallel agents:
      - Theme finder — cross-source patterns and recurring ideas
      - Gap finder — what's missing, what contradicts
   f. Produce updated SYNTHESIS.md at .research/analysis/SYNTHESIS.md
   g. Update last_synthesized_at on all processed sources
   h. Present synthesis results inline
5. After synthesis: run node scripts/cas/rebuild-index.js to update
   last_synthesized_at in the index
```

**Note:** Type-scoped synthesis delegates to the existing mature synthesis
skills. Cross-type synthesis is the new capability — it finds patterns that span
repos, websites, documents, and media.

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

| Version | Date       | Description                              |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2026-04-08 | Initial creation (T28 CAS, Session #269) |
