# Extraction Candidates -- Cross-Repo Summary

Generated: 2026-04-03 | Updated: 2026-04-05 | Total: 29 candidates across 6
repos

## Extracted (0)

_None yet._

## Deferred (26)

### public-apis/public-apis (2 candidates) -- Verdict: Extract (44) [Quick Scan only]

| Candidate                              | Novelty | Effort | Notes                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scheduled Link Validation Workflow     | Low     | E0     | `.github/workflows/validate_links.yml` + Python `requests`-based link checker in `scripts/`. Transferable pattern for any link-rot-sensitive artifact (docs/\*, skill-indexes, README). ~100 LOC. Not clone-inspected — Quick Scan inference from workflow list + SBOM.                         |
| Curated-List Stagnation Case Study (K) | High    | E0     | 419K stars + 2 commits/90 days + 1191 open issues + PR approval gate stuck = full lifecycle lesson: community momentum → commercial capture (APILayer) → approval bottleneck → celebrity stagnation. Cautionary context for any future JASON-OS skill registry or community distribution model. |

**Note:** Cross-reference with `codecrafters-io/build-your-own-x` "35-Category
Tutorial Taxonomy" — public-apis uses a similar 35+ category structure. Not
duplicated here.

### teng-lin/notebooklm-py (6 candidates) -- Verdict: Trial (60)

| Candidate                                | Novelty | Effort | Notes                                                                                                                                                                                                                                            |
| ---------------------------------------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skill Install + Version Stamping (P1)    | High    | E2     | `skill.py` (~280 lines) reads SKILL.md from package data, stamps `<!-- vX.Y.Z -->` into frontmatter, writes to ~/.claude/skills/ and ~/.agents/skills/. Status cmd detects drift. Directly retires cross_locale_config problem. Needs Node port. |
| Autonomy Rules Section in SKILL.md (P2)  | Medium  | E1     | Structured section splitting every command into "Run automatically" vs "Ask before running" with per-command reasons. Retrofit candidate for add-debt, pr-review, session-end, audit-\* skills. ~30 min per skill.                               |
| Nightly RPC Health Check (P3)            | Medium  | E2     | `rpc-health.yml` round-trips 35+ method IDs against Google, auto-files GitHub issue with `rpc-breakage` label on mismatch. Latent value — activates when you identify an external contract to monitor (Claude tool API, MCP health, etc).        |
| Ambient CLAUDE.md PR Workflow (P5)       | Medium  | E1     | Mandatory 4-step PR workflow (monitor CI → check reviews → fix + reply with SHA → verify mergeStateStatus CLEAN) embedded in CLAUDE.md as ambient guidance vs your invoked /pr-review. Design philosophy decision.                               |
| Embedded Task() Subagent Patterns (P6)   | Medium  | E1     | SKILL.md workflows include literal `Task(prompt=..., subagent_type=...)` invocations copy-pasteable by agents. Reduces agent cognitive load from "design task prompt" to "fill parameters". Retrofit for long-running skill workflows.           |
| Open Skills Ecosystem Investigation (K9) | High?   | E1     | README references `npx skills add teng-lin/notebooklm-py` and "open skills ecosystem". Unverified — could be real skill registry relevant to JASON-OS distribution, or aspirational naming. 15-min web research needed before acting.            |

### HKUDS/CLI-Anything (7 candidates) -- Verdict: Trial (62)

| Candidate                   | Novelty | Effort | Notes                                                                           |
| --------------------------- | ------- | ------ | ------------------------------------------------------------------------------- |
| HARNESS.md Methodology      | High    | E0     | 7-phase SOP for agent-native CLI wrapping. Directly applicable to JASON-OS.     |
| SKILL.md Format             | High    | E0     | AI-discoverable skill definition. 28 examples. Compare against sonash SKILL.md. |
| ReplSkin Terminal UI        | Medium  | E1     | Python REPL skin. Would need Node/TS port. Pattern > code.                      |
| Registry + CLI-Hub Pattern  | Medium  | E1     | JSON registry powering static discovery site. Good hub model.                   |
| Codec Allowlist Pattern     | Low     | E0     | frozenset-based subprocess arg validation. Similar to existing patterns.        |
| Skill Generator Scaffolding | Medium  | E2     | Jinja2 template scaffolding. Pattern portable, code specific.                   |
| Claude Plugin Marketplace   | High    | E0     | .claude-plugin/ + 5 slash commands. First Claude Code plugin format reference.  |

### ViktorAxelsen/MemSkill (6 candidates) -- Verdict: Extract (38)

| Candidate                          | Novelty | Effort | Notes                                                                                                     |
| ---------------------------------- | ------- | ------ | --------------------------------------------------------------------------------------------------------- |
| Meta-Memory Skills Framework       | High    | E0     | Core concept: skills about HOW to remember. Relevant to JASON-OS memory (T4, T16). Read arXiv 2602.02474. |
| Skill Evolution Loop               | High    | E1     | 3-stage: failure mining -> analysis+reflection -> refinement. Applicable to self-improving systems.       |
| Skill Bank Markdown Format         | Medium  | E0     | 5-section format. 15 examples. Compare against sonash SKILL.md.                                           |
| Designer Prompt Templates          | High    | E0     | 18KB failure classification + mutation prompts. Portable text.                                            |
| Dual-Embedding Memory Bank         | Medium  | E2     | Content + context embeddings. Concept portable, code tied to FAISS+PyTorch.                               |
| Operation Templates with Meta-Info | Medium  | E1     | Usage + reward + EMA tracking for skill/tool selection.                                                   |

### karpathy/autoresearch (5 candidates) -- Verdict: Extract (62)

| Candidate                    | Novelty | Effort | Notes                                                                                              |
| ---------------------------- | ------- | ------ | -------------------------------------------------------------------------------------------------- |
| program.md Agent Instruction | High    | E0     | Autonomous agent skill file: setup, experiment loop, NEVER STOP, crash recovery. Compare SKILL.md. |
| Fixed-Budget Experimentation | High    | E0     | Fixed 5-min budget, single metric, git branch per run. Generalizable optimization loop.            |
| 3-File Architecture Pattern  | Medium  | E0     | Immutable + mutable + instructions. Agent-editable zone contracts.                                 |
| Autonomous Crash Recovery    | Medium  | E0     | Stack trace reading, fix attempts, revert on failure. Relevant to GSD executor.                    |
| Results TSV Logging          | Low     | E0     | commit/metric/memory/status/description. Already have JSONL equivalent.                            |

### codecrafters-io/build-your-own-x (3 candidates) -- Verdict: Extract (45)

| Candidate                     | Novelty | Effort | Notes                                                       |
| ----------------------------- | ------- | ------ | ----------------------------------------------------------- |
| Systems Knowledge Curriculum  | High    | E2     | 5 domains relevant to JASON-OS: Shell, Git, DB, Search, PL. |
| 35-Category Tutorial Taxonomy | Medium  | E0     | Learning path reference across 35 technology domains.       |
| Curated Link Format           | Low     | E0     | Standard awesome-list format. Low extraction value.         |

## Skipped (0)

_None._
