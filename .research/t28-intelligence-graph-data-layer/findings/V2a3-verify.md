# Verifier V2a3 -- Claims C-048 through C-053

**Phase:** 2.5 Post-Search Verification **Date:** 2026-04-07 **Verifier:**
claude-sonnet-4-6 **Scope:** Operations claims from claims.jsonl lines 48-53

---

## Per-Claim Verdict Table

| Claim ID | Verdict      | Confidence | Method     | Notes                                                                                                                                                                                                   |
| -------- | ------------ | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-048    | VERIFIED     | HIGH       | filesystem | .gitignore has zero .db/.db-wal/.db-shm entries (grep: no matches)                                                                                                                                      |
| C-049    | VERIFIED     | HIGH       | web        | WAL+NORMAL+foreign_keys ON confirmed by SQLite official docs + phiresky blog + oneuptime.com. temp_store MEMORY standard for small DBs (T28 scale).                                                     |
| C-050    | CONFLICTED   | MEDIUM     | web        | Weights 0.6/0.4 confirmed (AuvaLab README). Threshold 0.78 NOT found — iText2KG default is 0.7 (paper) or 0.8 (AuvaLab code), never 0.78. Three-stage funnel is T28-specific design, not from iText2KG. |
| C-051    | VERIFIED     | HIGH       | web        | iText2KG README explicitly documents 0.6/0.4 weighting prevents homonym false merges with Python:Language/Python:Snake example.                                                                         |
| C-052    | UNVERIFIABLE | LOW        | web        | Thresholds >=0.90 physical merge / 0.65-0.90 SAME_AS / <0.65 no action not found in any published source. T28-specific design decisions not independently validated.                                    |
| C-053    | UNVERIFIABLE | LOW        | web        | Every-15-absorbs checkpoint trigger sourced only from S-054 (internal). No external source validates this cadence. Pace estimate (~10/day) is also unverified.                                          |

---

## Conflict Detail — C-050

- **Source A (VERIFIED):**
  [AuvaLab iText2KG README](https://github.com/AuvaLab/itext2kg/blob/main/README_itext2kg.md)
  — weights 0.6 name / 0.4 label confirmed; default `ent_threshold` = **0.7**
- **Source B (VERIFIED):**
  [iText2KG arxiv paper 2409.03284](https://arxiv.org/html/2409.03284v1) —
  threshold 0.7 used in experiments; no mention of 0.78; no weighted components
  in paper
- **Conflict type:** Misinformation — claim states 0.78 threshold but published
  default is 0.7 (paper) or 0.8 (code). No source supports 0.78.
