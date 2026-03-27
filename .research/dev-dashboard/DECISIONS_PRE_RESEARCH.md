# Pre-Research Decisions: Dev Dashboard Command Center

**Date:** 2026-03-27 (Session #243) **Context:** Decisions made during Session
#243 conversation before research begins. These MUST be consumed by the research
as settled decisions.

## Architectural Decisions

| #   | Decision                                            | User Direction                               |
| --- | --------------------------------------------------- | -------------------------------------------- |
| D1  | Lighthouse tab belongs on admin, not dev            | Move post-M1.6                               |
| D2  | Tab selection is NOT pre-decided                    | Research discovers groupings, user chooses   |
| D3  | Track B (B6-B11) is NOT assumed valid               | Research evaluates against current landscape |
| D4  | Admin = app + users. Dev = build pipeline + process | Clear boundary                               |
| D5  | All potential tabs researched                       | No artificial scope ceiling                  |
| D6  | One unified research report                         | Integrates debt-runner research              |
| D7  | Every tab gets CLI handoff                          | Clipboard command generation pattern         |
| D8  | Hybrid fetch (API in dev, static in prod)           | From debt-runner research                    |
| D9  | Desktop only                                        | Same as admin panel                          |
| D10 | Agents sized to avoid context exhaustion            | Max ~13 files per agent                      |

## From Debt-Runner Research (carry forward)

| #    | Decision                                               | Source             |
| ---- | ------------------------------------------------------ | ------------------ |
| DD1  | JSONL stays canonical write format                     | Dispute resolution |
| DD2  | SQLite deferred — 179ms JSONL parse adequate           | Dispute resolution |
| DD3  | Static JSON field-stripped to ~2 MB                    | Contrarian-2       |
| DD4  | 3 discovery agents initially, resolution-rate gate     | Contrarian-1       |
| DD5  | Guided mode is default for all sessions                | Dispute resolution |
| DD6  | localStorage for annotations, Firestore optional later | Dispute resolution |
| DD7  | MiniSearch for client-side search                      | Contrarian-2       |
| DD8  | Pre-generated AI summaries at build time (Phase 3)     | OTB-1              |
| DD9  | 4-phase implementation with independent value          | OTB-2              |
| DD10 | BUG-01 + BUG-06 must fix BEFORE web development        | SQ7 verification   |

## User Profile Context

- Non-developer director who uses AI to build software
- 243 sessions, solo operator
- Wants UBER capabilities on web side
- Wants smooth web→CLI handoff
- Wants back-of-house operations hub, not app-facing dashboard
- Many existing CLI skills can integrate with web tabs
