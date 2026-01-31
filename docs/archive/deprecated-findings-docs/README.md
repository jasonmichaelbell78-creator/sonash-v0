# Deprecated Findings Documentation

**Archived:** 2026-01-30 | **Session:** #116

---

## Why These Were Archived

These documents were deprecated because all audit findings have been
consolidated into the **canonical location**:

```
docs/audits/canonical/
├── MASTER_FINDINGS.jsonl        # All active findings (203 total)
├── MASTER_FINDINGS_INDEX.md     # Human-readable index
├── ROADMAP_INTEGRATION.md       # ROADMAP placement guide
└── LEGACY_ID_MAPPING.json       # Maps old IDs to canonical CANON-XXXX IDs
```

## What's in the Canonical Location

The canonical location now contains:

- **172 findings** from Session #116 comprehensive audit
- **31 legacy findings** migrated from DEDUP-_, EFF-_, PERF-_, M2.3-REF-_,
  M4.5-SEC-\*

## Archived Files

| File                        | Original Location                              | Reason for Archive                  |
| --------------------------- | ---------------------------------------------- | ----------------------------------- |
| `AUDIT_FINDINGS_BACKLOG.md` | `docs/`                                        | Replaced by `MASTER_FINDINGS.jsonl` |
| `REFACTOR_BACKLOG.md`       | `docs/reviews/2026-Q1/canonical/tier2-output/` | Merged into canonical findings      |

## Migration Details

Legacy IDs were mapped to canonical IDs:

- `DEDUP-0001` → `CANON-0173`
- `EFF-006` → `CANON-0180`
- `M2.3-REF-001` → `CANON-0194`
- See `LEGACY_ID_MAPPING.json` for full mapping

## Where to Go Now

- **View findings:** `docs/audits/canonical/MASTER_FINDINGS_INDEX.md`
- **Procedures:** `docs/AUDIT_FINDINGS_PROCEDURE.md`
- **ROADMAP integration:** `docs/audits/canonical/ROADMAP_INTEGRATION.md`
