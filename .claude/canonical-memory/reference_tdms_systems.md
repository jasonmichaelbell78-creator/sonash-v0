---
name: reference_tdms_systems
description: Tech debt pipeline — intake to views, MASTER_DEBT overwrite hazard, ID format
type: reference
status: active
---
- Pipeline: intake-audit.js -> dedup -> assign-roadmap-refs.js -> generate-views.js
- CRITICAL: generate-views.js OVERWRITES MASTER_DEBT.jsonl from deduped.jsonl
- Any script appending to MASTER_DEBT must also append to raw/deduped.jsonl
- ID format: DEBT-XXXXX
- Location: docs/technical-debt/MASTER_DEBT.jsonl
