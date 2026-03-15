# scripts/archive/

Deprecated scripts preserved for reference. These were superseded by the
JSONL-canonical review pipeline (Task 7, 2026-03-15).

## Scripts

| Script                        | Replaced By            | Notes                                                                             |
| ----------------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| `sync-reviews-to-jsonl.js`    | `review-lifecycle.js`  | Was the MD-to-JSONL sync bridge; JSONL is now canonical                           |
| `sync-reviews-to-jsonl.v1.js` | `review-lifecycle.js`  | Earlier version of the sync script                                                |
| `archive-reviews.js`          | `review-lifecycle.js`  | Was the markdown archival script; archiving now handled by lifecycle orchestrator |
| `run-consolidation.v1.js`     | `run-consolidation.js` | Earlier version of the consolidation script                                       |

## Why archived (not deleted)

These scripts contain parsing logic and edge-case handling that may be useful as
reference when maintaining the current pipeline. They are not wired into any npm
scripts or CI pipelines.
