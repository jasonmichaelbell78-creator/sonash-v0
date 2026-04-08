# Findings: Risk and Maturity — Libraries and Backends

**Searcher:** deep-research-searcher | **Date:** 2026-04-07 | **Sub-Question:**
D15-1

---

## Risk Matrix

| Candidate                 | Maintenance                         | API Stability        | Windows          | Scale | License    | Dep Chain       | **T28 v1 Verdict**     |
| ------------------------- | ----------------------------------- | -------------------- | ---------------- | ----- | ---------- | --------------- | ---------------------- |
| better-sqlite3            | LOW                                 | HIGH (stable)        | LOW (prebuilts)  | LOW   | MIT        | LOW             | **SAFE**               |
| sqlite-vec v0.1.9         | MEDIUM (solo, past hiatus)          | MEDIUM (pre-v1)      | LOW (confirmed)  | LOW   | MIT        | LOW (pure C)    | **USE WITH PINNING**   |
| graphology                | LOW-MEDIUM                          | HIGH (stable core)   | NONE (pure JS)   | LOW   | MIT        | NONE            | **SAFE**               |
| LadybugDB                 | MEDIUM-HIGH (6mo fork)              | MEDIUM (divergence)  | LOW (documented) | LOW   | MIT        | MEDIUM (native) | **NOT RECOMMENDED v1** |
| @huggingface/transformers | LOW (HF-backed)                     | MEDIUM (v3→v4 break) | LOW              | LOW   | Apache 2.0 | LOW             | **SAFE (with setup)**  |
| n-r-w/knowledgegraph-mcp  | **CRITICAL** (disillusioned author) | N/A                  | LOW              | N/A   | MIT        | LOW             | **DO NOT USE**         |

---

## Key Findings

**better-sqlite3 (LOW RISK):** v12.8.0, 7,100+ stars, Windows x64 prebuilts
since v7.1.4. Node v22 confirmed. MIT. Minimal deps.

**sqlite-vec (MEDIUM RISK):** Pre-v1, breaking changes declared. Solo maintainer
(Alex Garcia) had 6-month dormancy in 2024 (funding gap). Revived March 2025.
Windows .dll confirmed. Pin to v0.1.9, avoid bleeding-edge features.

**graphology (LOW-MEDIUM RISK):** v0.26.0, 1,600+ stars, 4,900+ dependents. Pure
JS, zero native deps. Last release Feb 2025. Stable core, lower release cadence
is maturity, not abandonment.

**LadybugDB (HIGH RISK):** 6-month fork of archived KuzuDB. 896 stars, 67
contributors (inherited). npm: `@ladybug/core` (NOT `@ladybugdb/core`). Fork
fragmentation: 3 competing forks (LadybugDB, Vela-Engineering, Bighorn). Not
recommended for first graph project.

**@huggingface/transformers (MEDIUM RISK):** v4.0.1 with v4 major rewrite.
MiniLM-L6-v2 at 23MB ONNX. First-run 23MB download. Known cache issues (#889,
#1279). Configure cache path explicitly.

**n-r-w/knowledgegraph-mcp (CRITICAL RISK):** Maintainer publicly stated: "I've
become disillusioned with automated context management tools like this." 20
stars. Last commit Dec 16, 2024. **DO NOT USE as dependency.** Reference code
only. shaneholloman fork exists as backup.

---

## Sources

Official GitHub repos, npm registries, maintainer discussions. 16 sources total.
