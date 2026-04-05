# RESUME: research-discovery-standard-v2

**Date:** 2026-04-04 **Status:** COMPLETE (all phases 0-5 + v1 vs v2 comparison)
**Worktree:** worktree-rnd4426 **Commits so far:** 2 (`04ce6c77` brainstorm
migration, `fe866471` brainstorm artifact). Research artifacts not yet
committed.

## Quick Navigation

| File                                                                                   | Purpose                                                    |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [RESEARCH_OUTPUT.md](./RESEARCH_OUTPUT.md)                                             | Main research report (580 lines, post-dispute-corrections) |
| [claims.jsonl](./claims.jsonl)                                                         | 77 structured claims with confidence + sources             |
| [sources.jsonl](./sources.jsonl)                                                       | 63 unique sources with trust tiers                         |
| [metadata.json](./metadata.json)                                                       | Research metadata                                          |
| [AUDIT.md](./AUDIT.md)                                                                 | Phase 4 self-audit report                                  |
| [findings/D1-D8](./findings/)                                                          | 8 sub-question findings files                              |
| [findings/V1-V2](./findings/)                                                          | 2 verification reports                                     |
| [findings/dispute-resolutions.md](./findings/dispute-resolutions.md)                   | 5 dispute resolutions                                      |
| [findings/gap-scan.md](./findings/gap-scan.md)                                         | Phase 3.95 gap scan (0 actionable)                         |
| [findings/comparison-v1-v2-delta.md](./findings/comparison-v1-v2-delta.md)             | What changed between v1 and v2                             |
| [findings/comparison-v1-v2-consistency.md](./findings/comparison-v1-v2-consistency.md) | Consistency check                                          |
| [challenges/contrarian.md](./challenges/contrarian.md)                                 | 8 contrarian challenges                                    |
| [challenges/otb-alternatives.md](./challenges/otb-alternatives.md)                     | 7 OTB alternatives                                         |

## Topline Metrics

- **Sub-questions:** 8 (SQ1-SQ8)
- **Claims:** 77 (63 HIGH, 13 MEDIUM, 1 LOW, 0 UNVERIFIED)
- **Sources:** 63 (35 codebase T1, 28 external T2-T3)
- **Findings files:** 8 D-agents + 2 V-agents + 2 comparison = 12 in findings/
- **Challenges:** 8 contrarian (3 STRONG, 5 MODERATE) + 7 OTB (2 SUPPLEMENT, 5
  INFORM)
- **Disputes resolved:** 5 (all REVISED, corrections applied inline)
- **Gap pursuit:** scanned, 0 research-actionable gaps, skipped
- **Self-audit:** PASS with 5 documented limitations
- **v1 vs v2 delta:** 15 net-new, 5 superseded, 6 confirmed-again, 6 retained
  open Qs, 8 new open Qs
- **v1 vs v2 consistency:** 0 contradictions, 0 decision conflicts, 3 temporal
  tensions

## Chosen Direction (from brainstorm)

**Direction E — Phased Hybrid:**

1. Phase 0: Brainstorm (complete, commit `fe866471`)
2. Phase 1: Supplemental deep-research (**THIS — complete**)
3. Phase 2: Outside source scouting (not started)
4. Phase 3: Implement /rnd via /todo evolution (not started)
5. Phase 4: SWS CANON registration (not started)

## Key Verdicts from v2

- **SQ1 state machine:** Two orthogonal axes (status + stage), guarded whitelist
  transition table, append-only stage_history[]. **Write-guard must be at write
  layer, not view layer** (per dispute C1).
- **SQ2 auto-advance:** Hybrid — lazy scan (primary) + FileChanged hook
  (**provisional** — needs feasibility verification per dispute C2).
- **SQ3 findings_refs:** JSONL-native, manual registration, `<slug>:<claim-id>`
  addressing, relationships: informedBy/constrainedBy/contradicts.
- **SQ4 /todo UX:** Two-field addition (`type`, `stage`), capture-first GTD
  pattern, stage badge in Progress column.
- **SQ5 schema versioning:** Per-record `schema_version`, additive-only v1→v2,
  `migrate-todos-v2.js` prescriptive (not yet written).
- **SQ6 dashboard:** Add 7th R&D tab (not fold-in). Stage-column kanban.
  build-rnd.js performs 3-source join.
- **SQ7 scouting governance:** Theoretical saturation + Chesterton Gate + Rogers
  Five Factors + ADR exit artifacts. SCOUT-SUMMARY.md peer-review mitigation
  recommended.
- **SQ8 CL integration:** Cross-cutting model. Pre-verified stages **conditional
  on CL state artifact** (not V\*.md alone) per dispute C3. D3 independence
  (corrected from D5).

## Cross-Cutting Themes

1. **Declarative over imperative** (SQ1+SQ5+SQ8)
2. **Capture-first, enrich-later** (SQ1+SQ4+SQ7)
3. **Skill-completed stages are pre-verified** — conditional on CL state
   artifact (SQ2+SQ8)
4. **Minimal infrastructure, maximum compatibility** (SQ3+SQ5+SQ6)
5. **Acknowledgment-required surfacing** (SQ3+SQ8+CLAUDE.md guardrail #6)

## If Resuming Mid-Session

If this session was interrupted and you need to continue from here, the next
step is:

### Immediate next steps (chose one)

1. **Commit all research artifacts** (recommended — protects work before
   continuing)

   ```
   git add .research/research-discovery-standard-v2/
   git commit -m "docs: research-discovery-standard v2 supplemental research"
   ```

2. **Proceed to Phase 2 (Scouting)** per the brainstorm's Direction E
   - Run `/repo-analysis` on additional repos for R&D methodology patterns
   - Run `/deep-research` with web profile on solo-creator R&D workflows
   - No artificial constraints per brainstorm

3. **Proceed to Phase 3 (Implementation planning)** skipping Phase 2 scouting
   - Run `/deep-plan "Implement /rnd R&D pipeline via /todo evolution"`
   - Consume: this research + brainstorm + dispute resolutions + comparisons

## Post-Research Queue (from session context)

1. **Option A (path fix hook):** Implement PreToolUse hook to normalize
   `/c/Users/...` paths to `C:\Users\...` on Windows. Fixes class of bugs
   encountered in this session.

2. **Option B (upstream issue):** File with anthropics/claude-code about
   subagent Windows path confusion + verifier agents without Write tool needing
   heredoc workarounds.

## Known Limitations (from AUDIT.md)

1. Cross-model verification (Gemini CLI) not invoked
2. V1 verifier agent aborted at 38/40 claims (partial coverage)
3. FileChanged hook feasibility unverified (Open Q 6 — blocking)
4. Scouting governance qualitative gates are self-administered
5. 10 inline corrections in Phase 3.9 not re-audited (localized edits only)

## Process Failures Encountered (recovery pattern)

Two classes of Windows-specific subagent issues:

1. **Unix path write bug** — 2 Wave 1 agents (D2, D3) wrote to `/c/Users/...`
   paths that Node.js resolved as `C:\c\Users\...` phantom path. Recovered via
   subagent JSONL log extraction.

2. **Heredoc escaping failure** — V1 and V2 verifier agents lack Write tool,
   tried Bash heredoc, broke on apostrophes. V2 recovered from subagent log
   (longest Bash command extraction). V1 had written partial content before
   failure — kept as-is with 38/40 coverage.

3. **Agents without Write tool** — contrarian, OTB, dispute-resolver all
   returned content in task-notification message; orchestrator wrote them
   manually to expected paths.

All three recovery patterns are reusable for future sessions. Consider
addressing via Option A (PreToolUse hook) and verifier agent tool list
expansion.

## State File

`.claude/state/deep-research.research-discovery-standard-v2.state.json` — full
phase completion history with all agent IDs.
