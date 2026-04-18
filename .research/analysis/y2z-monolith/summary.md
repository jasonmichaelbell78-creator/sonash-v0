# Engineer View — Y2Z/monolith

**Target:** https://github.com/Y2Z/monolith
**Analyzed:** 2026-04-18 · **Depth:** standard · **Classification:** tool-demo (Rust CLI)

## Metadata

| Field | Value |
|---|---|
| Version | 2.11.0 |
| Language | Rust (edition 2021) |
| License | CC0-1.0 (public domain) |
| Stars | 15,009 |
| Forks | 451 |
| Size | 4.3 MB |
| Last push | 2026-02-05 (~2.5mo) |
| Default branch | master |
| Authors | 6 (distributed maintainers) |

## Scoring

| Dimension | Band | Score | Notes |
|---|---|---|---|
| Security | Healthy (75) | 75 | 1 isolated unsafe block, 81 unwraps acceptable for CLI; Dockerfile supply-chain weakness |
| Reliability | Excellent (88) | 88 | 50 test files, per-module mirror, 4-OS CI matrix + NetBSD |
| Maintainability | Healthy (80) | 80 | Clean 11-module domain split; mono-README limits contributor onboarding |
| Documentation | Healthy (72) | 72 | README excellent; missing SECURITY.md / CONTRIBUTING.md / CODE_OF_CONDUCT.md |
| Process | Excellent (90) | 90 | CI matrix + CD pipeline + strict dep pinning + CC0 license |
| Velocity | Excellent (92) | 92 | 15k stars, 6 authors, active (<3mo push), 18 install channels |

**Composite quality:** **Healthy (82.8)**
**Personal fit:** **Needs Work (35)** — language mismatch (Rust), out of M1.5/M1.6 scope, no direct integration path
**Classification:** `park-for-later`

## Absence Patterns

- **No SECURITY.md** — confidence: high; evidence: governance files scan returned empty
- **No CONTRIBUTING.md** — confidence: high
- **No CODE_OF_CONDUCT.md** — confidence: high
- **No docs/ tree** — confidence: high; all docs consolidated to README.md
- **Dockerfile without pinned release** — confidence: high; evidence: Dockerfile:3-5 uses `releases/latest`

## Adoption Verdict

**Trial (as reference / out-of-process CLI), not Adopt.**

- Blocker: Rust binary vs SoNash Node/Firebase stack — no clean integration path.
- Use case: one-off archival script when building journal external-reference feature.
- Reference value: high — the archival-file-format pattern is worth benchmarking against.

## Top findings (from findings.jsonl)

1. **S2** Dockerfile downloads unpinned `releases/latest` via curl (contradicts strict Cargo pinning)
2. **S2** Mono-README documentation, no SECURITY.md / CONTRIBUTING.md
3. **S3** 81 `unwrap()` calls in src (CLI-acceptable, library-risky)
4. **S3** Clean 11-module decomposition (pattern)
5. **S3** 18-channel distribution catalog (pattern)
6. **S3** Strict `=X.Y.Z` dep pinning (process pattern)

## Routing recommendation

Creator View §5 Knowledge Candidates → `/synthesize --resume` to see if archival-format and distribution-catalog themes converge with other analyzed repos.

_Engineer View v5.0. Full Creator View at creator-view.md._
