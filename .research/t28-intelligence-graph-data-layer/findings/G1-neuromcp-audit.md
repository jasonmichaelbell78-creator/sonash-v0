# Gap Audit: Neuromcp Capability Assessment

**Agent:** G1 (gap pursuer) **Date:** 2026-04-07 **Gap type:** Challenge miss —
unaudited counter-candidate

---

## Verdict: Does NOT satisfy all 3 T28 requirements

| Capability              | T28 Needs         | Neuromcp Has                                   | Verdict  |
| ----------------------- | ----------------- | ---------------------------------------------- | -------- |
| Flat #tag API           | `string[]` arrays | `tags?: string[]` (JSON-serialized)            | PARTIAL  |
| Per-node confidence     | Numeric 0-1       | `importance: number` (proxy, not confidence)   | **MISS** |
| Contradiction detection | Semantic conflict | Pattern-matching (numeric + boolean opposites) | PARTIAL  |

**Windows native: NOT SUPPORTED** (documented). WSL2 only. SoNash is Windows 11
native.

**Stars:** neuromcp: 1, neurohive: 0. Adoption risk HIGH.

## Impact on Recommendation

**"Build custom MCP" recommendation CONFIRMED at HIGH confidence.** Neuromcp is
the closest existing server but:

1. No numeric confidence (importance != epistemic certainty)
2. Windows blocked without WSL2
3. Contradiction detection is shallow (keyword heuristics, not semantic)
4. 1-star project — high dependency risk

Useful as reference implementation or fork target, not drop-in adoption.

## Sources

GitHub AdelElo13/neuromcp (source code: types.ts, store.ts verified), Glama.ai
listings.
