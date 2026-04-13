# Deep Read — Claude Code Swarm Orchestration Skill

**Status:** Deep Read skipped per T29 Step 10.5 Cat F4 decision.

## Why skipped

This source is a single-file gist / short-form content. Deep Read is a pass
designed for repositories with multiple artifacts (READMEs, docs, code, tests).
For single-file sources, the creator-view summary and candidate list already
capture the full analysis surface.

Candidates, tags, and findings are complete and remain the canonical output for
this source. See:

- `analysis.json` — unified summary + candidates + scoring
- `value-map.json` — full candidate objects with descriptions
- `creator-view.md` — 6-section conversational analysis
- `findings.jsonl` — F# findings referenced by candidates
- Extraction journal entries (`.research/extraction-journal.jsonl`)

## Machine-readable flag

`analysis.json.deep_read_skipped: true`

Downstream consumers (`/synthesize`, self-audit) should treat this as PASS for
Deep Read artifact checks.
