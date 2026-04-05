# JASON-OS Research — Cross-Domain Dependencies

**Last Updated:** 2026-04-03 **Status:** Updated (added Domain 02a +
cross-cutting protocol)

## Dependency Graph

```
Tier 1 (Foundation):
  01 Internal Archaeology ──┐
                            ├──→ ALL subsequent domains
  02 External Landscape ────┤
                            ├──→ 04, 05, 07, 08, 12, 13, 14, 15, 16
  02a Adoption Scouting ────┤
                            ├──→ ALL (cross-cutting protocol, ongoing)
  03 Existing Work ─────────┤
                            ├──→ ALL (determines prior art to ingest)
  04 Design Philosophy ─────┘
                            ├──→ 05, 08, 09, 13, 15

Tier 2 (Core Technical):
  05 Architecture ──────────→ 06, 07, 08, 14
  06 Extraction ────────────→ 08, 11
  07 Sync (#1 priority) ───→ 08, 12, 14
  08 Template Design ───────→ 13
  09 Memory & State ────────→ 07, 14
  10 Security ──────────────→ 08, 13
  11 Testing ───────────────→ 12
  12 Evolution ─────────────→ 14

Tier 3 (Experience & Distribution):
  13 Onboarding ────────────→ 15
  14 CLI & Platform ────────→ 15
  15 UX for Orchestrators ──→ 16
  16 Community (terminal) ──→ implementation planning
```

## Parallelization Opportunities

| Parallel Group | Domains          | Condition                         |
| -------------- | ---------------- | --------------------------------- |
| Tier 1 Wave A  | 01 + 02 + 02a    | Independent — can run in parallel |
| Tier 1 Wave B  | 03 + 04          | After 01/02 initial findings      |
| Tier 2 Wave A  | 05 + 09          | After Tier 1                      |
| Tier 2 Wave B  | 06 + 10          | After 05                          |
| Tier 2 Wave C  | 07 (priority #1) | After 05                          |
| Tier 2 Wave D  | 08               | After 06 + 07                     |
| Tier 2 Wave E  | 11 + 12          | After 06/07/08                    |

## Cross-Domain Findings

(Updated after each domain gate. Format: finding, source domain, affected
domains)

_No findings yet — research not started._

## Contradictions Discovered

(Updated when findings conflict. Format: contradiction, domains involved,
resolution)

_No contradictions yet — research not started._
