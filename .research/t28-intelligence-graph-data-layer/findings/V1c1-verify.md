# Verification: C-025 to C-030

**Phase:** 2.5 Post-Search Verification **Date:** 2026-04-07 **Method:** Web
verification (all 6 claims are external/design)

## Verdict Table

| ID    | Claim (short)                                                                                           | Verdict      | Confidence | Key Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-025 | Adopt Graphiti event-time half only (valid_at/invalid_at); skip T' for v1                               | VERIFIED     | MEDIUM     | Graphiti paper (arxiv 2501.13956) confirms full 4-timestamp model: valid_at/invalid_at (T) + created_at/expired_at (T'). Claim correctly identifies both axes and recommends a deliberate simplification. No source contradicts pruning T' for v1. Design opinion on complexity tradeoff — no ground truth to refute.                                                                                                                                                   |
| C-026 | Stable UUID per node (survives resets, decoupled from title/path); t28:// URL scheme                    | UNVERIFIABLE | LOW        | UUID stability is a universally accepted DB design principle (no source needed). The t28:// URL scheme is an internal project convention — no external source can verify or refute it. Claim is architecturally sound but the t28:// portion is unverifiable against external ground truth.                                                                                                                                                                             |
| C-027 | FTS5 porter unicode61, prefix='2 3', detail='full', BM25 10x/5x/1x column weights                       | VERIFIED     | HIGH       | SQLite official docs (sqlite.org/fts5.html) confirm: porter unicode61 combination valid; prefix='2 3' creates 2- and 3-char prefix indexes (valid syntax); detail='full' is the default storing rowid+column+offset (correct); BM25 column weights via bm25(table, w0, w1...) confirmed. Specific weight ratios (10x/5x/1x) are a design choice not contradicted by any source.                                                                                         |
| C-028 | FTS5 + MiniLM 384d + RRF k=60 runs sub-3ms on Raspberry Pi Zero                                         | CONFLICTED   | MEDIUM     | Sub-3ms retrieval confirmed by ZeroClaw blog on Raspberry Pi Zero 2 W (0.3ms FTS5 + 2ms vector + 0.1ms merge). Two issues: (1) The hardware tested was Raspberry Pi Zero **2 W** (quad-core 1GHz) not Raspberry Pi Zero (single-core 700MHz) — claim overstates hardware constraint. (2) Sub-3ms covers retrieval of pre-computed vectors only; MiniLM embedding generation adds ~10-20ms per query on CPU, making full pipeline latency significantly higher than 3ms. |
| C-029 | Ship v1 with FTS5-only; hybrid search gated on v2                                                       | UNVERIFIABLE | LOW        | Single source (S-054). Design opinion on complexity budgeting. No external authoritative source confirms or refutes the "4-5 new concepts" framing or the specific v1/v2 gating decision. Consistent with incremental-complexity best practice but not independently verifiable.                                                                                                                                                                                        |
| C-030 | @xenova/transformers MiniLM-L6-v2: 22MB ONNX, 384d, ~14.7ms/1K tokens CPU, no Python, Windows-confirmed | CONFLICTED   | MEDIUM     | 384 dimensions: VERIFIED (HuggingFace official). Quantized ONNX ~22MB: PARTIALLY CORRECT — model_uint8.onnx is 22.8MB, model_int8.onnx is 23MB; no exact 22MB file exists. Package name @xenova/transformers: STALE — renamed to @huggingface/transformers in Transformers.js v3 (Aug 2024); @xenova/transformers is legacy. ~14.7ms/1K tokens: NO SOURCE FOUND — benchmarks show ~40-100 sentences/sec; specific figure unverifiable. No Python + Windows: VERIFIED.   |

## Conflict Details

**C-028:**

- Source A: ZeroClaw blog — sub-3ms on "Raspberry Pi Zero 2 W" (quad-core, named
  as such in article)
- Source B: Claim text says "Raspberry Pi Zero" (original single-core 700MHz
  ARM11)
- Conflict type: **Misinformation** — claim understates the hardware capability
  tested; Pi Zero 2 W is ~10x more capable than original Pi Zero
- Secondary conflict: Sub-3ms is retrieval only; embedding generation latency
  not included

**C-030:**

- Source A: HuggingFace Xenova/all-MiniLM-L6-v2 repo — model_uint8.onnx is
  22.8MB (not exactly 22MB)
- Source B: Transformers.js v3 release (Aug 2024) — package renamed to
  @huggingface/transformers; @xenova/transformers is legacy/deprecated
- Conflict type: **Freshness** — claim uses old package name; 14.7ms figure has
  no corroborating source
