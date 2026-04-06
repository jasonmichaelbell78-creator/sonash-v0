# Extraction Candidates -- Cross-Repo Summary

Generated: 2026-04-03 | Updated: 2026-04-06 | Total: 76 candidates across 6
repos

## Extracted (0)

_None yet._

## Deferred (73)

### public-apis/public-apis (11 candidates) -- Verdict: Extract (42/48) [Standard, v4.2]

| Candidate                                    | Novelty | Effort | Notes                                                                                                                                     |
| -------------------------------------------- | ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Link Validation Workflow                     | Low     | E1     | validate_links.yml (29 lines) + links.py (273 lines). Daily cron link checker. Port to sonash for docs link integrity.                    |
| Structured Catalog Format (enum columns)     | Low     | E0     | API\|Desc\|Auth\|HTTPS\|CORS with constrained enum values. Reference for JASON-OS skill/tool catalog.                                     |
| Format Validation Script Pattern             | Low     | E0     | format.py (277 lines) + tests (466 lines). Regex-based format enforcement. Simpler version of patterns:check.                             |
| Google Calendar API (C)                      | Medium  | E1     | OAuth via Firebase Auth. Direct SoNash integration: sobriety milestones, meeting reminders, daily check-ins.                              |
| Open-Meteo Weather API (C)                   | Low     | E0     | No auth, CORS yes. Zero-friction weather data for mood-weather correlation journaling in SoNash.                                          |
| Google Cloud Natural Language API (C)        | Medium  | E1     | Same Firebase/Google Cloud ecosystem. Journal sentiment analysis for emotional pattern tracking over time.                                |
| validate_links.yml Workflow (C)              | Low     | E1     | 29-line daily cron. Directly transferable for checking SKILL_INDEX.md, EXTRACTIONS.md, MEMORY.md for rotting URLs.                        |
| Celebrity Stagnation with Infrastructure (K) | Medium  | E0     | Second data point with codecrafters. Proves automation alone doesn't prevent stagnation. MERGED cross-repo finding.                       |
| Validation Without Maintenance Trap (K+AP)   | Medium  | E0     | Format validation ensures structural integrity but not content freshness. Missing piece: lifecycle management. Applies to patterns:check. |
| Sponsor-First README Anti-Pattern (AP)       | Medium  | E0     | 10 promoted APIs before community content. Erodes trust. Keep sponsors separate from content if JASON-OS has partners.                    |

**Note:** Celebrity stagnation finding is now a MERGED cross-repo pattern with
`codecrafters-io/build-your-own-x`. Both repos prove the same thesis from
different angles: codecrafters has no infrastructure and stagnated; public-apis
has infrastructure and still stagnated. The differentiator is active
maintenance.

### teng-lin/notebooklm-py (13 candidates) -- Verdict: Trial (60/70) [Standard, v4.2]

| Candidate                              | Novelty | Effort | Notes                                                                                                                                            |
| -------------------------------------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skill Install + Version Stamping       | High    | E2     | skill.py reads SKILL.md from package data, stamps version, writes to ~/.claude/skills/. Solves cross_locale_config. Needs Node port.             |
| Autonomy Rules Section in SKILL.md     | Medium  | E1     | 22 auto-run + 7 ask-first with per-command reasons. Retrofit candidate for add-debt, pr-review, session-end, audit-\* skills. ~30 min per skill. |
| Nightly RPC Health Check               | Medium  | E2     | rpc-health.yml: daily cron, 3 exit codes, auto-creates labeled GitHub issues. Pattern for external contract monitoring.                          |
| Ambient CLAUDE.md PR Workflow          | Medium  | E1     | 4-step embedded PR workflow. Alternative to invoked /pr-review. Design question: ambient vs invoked.                                             |
| Embedded Task() Subagent Patterns      | Medium  | E1     | Literal Task() invocations in SKILL.md workflows. Reduces agent cognitive load. Retrofit for long-running skills.                                |
| Open Skills Ecosystem Investigation    | High?   | E1     | `npx skills add teng-lin/notebooklm-py`. Unverified. Critical for JASON-OS distribution if real.                                                 |
| SKILL.md Autonomy Rules Template (C)   | Medium  | E0     | Lines 94-128. Direct template for adding autonomy rules to sonash skills. Read and copy.                                                         |
| skill.py Install Mechanism (C)         | High    | E0     | Reference implementation. SkillTarget dataclass, version stamping, drift detection. Port pattern to Node.                                        |
| rpc-health.yml Workflow (C)            | Medium  | E0     | Complete 90-line workflow. Daily cron, 3 exit codes, auto-issue creation, artifact upload. Directly transferable.                                |
| CLAUDE.md Agent Guidance Pattern (C)   | Medium  | E0     | Well-structured CLAUDE.md + ambient PR workflow. Compare against sonash CLAUDE.md v5.9.                                                          |
| AGENTS.md Separation (K)               | Low     | E0     | Separate file for multi-agent guidance. Consider if CLAUDE.md Section 7 grows.                                                                   |
| Undocumented API Dependency (AP)       | Medium  | E0     | Entire project wraps obfuscated Google RPC endpoints. Prefer documented APIs. Use rpc-health as safety net.                                      |
| Over-Engineered Install Mechanism (AP) | Low     | E0     | 280 lines for "copy file + stamp version." Extract pattern, not complexity.                                                                      |

### HKUDS/CLI-Anything (17 candidates) -- Verdict: Trial (62/68) [Standard, v4.2]

| Candidate                                    | Novelty | Effort | Notes                                                                                                                                       |
| -------------------------------------------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| HARNESS.md 7-Phase SOP                       | High    | E0     | Systematic methodology for wrapping GUI apps as agent-native CLIs. Directly applicable to JASON-OS Domain 02a.                              |
| SKILL.md Command Catalog Format              | High    | E0     | 37 SKILL.md files. Flat command references vs sonash workflow definitions. Design space comparison for skill format evolution.              |
| .claude-plugin/marketplace.json              | High    | E0     | First public Claude Code plugin format reference + 5 slash commands. Compare against sonash .claude-plugin/ structure.                      |
| Registry + CLI-Hub Distribution              | Medium  | E1     | registry.json (35 CLIs) → static hub → pip install. Agent-discoverable via meta-skill. Model for JASON-OS skill distribution.               |
| ReplSkin Terminal UI                         | Medium  | E1     | Python prompt_toolkit branded REPL. Pattern portable, code Python-specific. Reference for JASON-OS interactive modes.                       |
| Codec Allowlist Pattern                      | Low     | E0     | frozenset-based subprocess arg validation. Similar to existing sonash security patterns.                                                    |
| Skill Generator (Jinja2)                     | Medium  | E2     | Auto-generates SKILL.md from CLI introspection. Pattern portable to Node/TS.                                                                |
| MCP Backend Pattern (C)                      | High    | E0     | guides/mcp-backend.md. Wrap MCP servers as CLI backends via ClientSession + stdio_client. You have 3 MCP servers. Directly applicable.      |
| Skill Auto-Generation Guide (C)              | High    | E0     | guides/skill-generation.md. Introspect Click decorators → Jinja2 → SKILL.md. Could inform /skill-creator automation.                        |
| Mermaid Harness (C)                          | Medium  | E0     | Lightest-weight harness. No local binary (mermaid.ink cloud). Ready to use for agent-driven diagrams.                                       |
| Exa Harness (C)                              | Medium  | E0     | AI search + structured extraction via Exa API. Alternative/complement for /deep-research searchers.                                         |
| Agent-Native Software Methodology (K)        | High    | E0     | Core insight: wrap GUI software systematically for agents. HARNESS.md is the how-to. Foundational for JASON-OS Domain 02a.                  |
| Build-vs-Integrate Decision for JASON-OS (K) | High    | E0     | Should JASON-OS invoke CLI-Anything harnesses (Python) or generate Node/TS wrappers using same methodology? Critical architecture decision. |
| Quality Treadmill Case Study (K)             | Medium  | E0     | 28K stars in 29d, 35 harnesses, 0 CI enforcement. Growth outpacing gates. Opposite of build-your-own-x stagnation.                          |
| No-CI-for-Tests Anti-Pattern (AP)            | Medium  | E0     | 74 test files, zero CI enforcement. Tests as documentation, not quality gates. Don't regress on your pre-commit enforcement.                |
| Monorepo Without Shared Testing (AP)         | Medium  | E0     | 35 packages, 0 conftest.py, no shared runner. Plan shared testing if JASON-OS distributes skills as packages.                               |
| Growing Faster Than Quality Gates (AP)       | Medium  | E0     | 28K stars/29d with no automated enforcement. Same trajectory as celebrity stagnation, faster.                                               |

### ViktorAxelsen/MemSkill (12 candidates) -- Verdict: Extract (38/75) [Standard, v4.2]

| Candidate                            | Novelty | Effort | Notes                                                                                                  |
| ------------------------------------ | ------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Meta-Memory Skills Framework         | High    | E0     | Skills about HOW to remember. Paradigm shift for auto-memory. Read arXiv 2602.02474.                   |
| Skill Evolution Loop                 | High    | E1     | Mine failures → refine skills → propose new. General-purpose self-improvement.                         |
| Skill Bank 5-Section Format          | Medium  | E0     | Description/Purpose/When to Use/How to Apply/Constraints. Compare against SKILL.md.                    |
| Designer Prompt Templates            | High    | E0     | 18KB failure classification + mutation prompts. Skill refinement methodology.                          |
| Dual-Embedding Memory Bank           | Medium  | E2     | Content + context embeddings. Concept portable, code FAISS+PyTorch.                                    |
| Operation Templates with Meta-Info   | Medium  | E1     | Usage + reward + EMA tracking for skill/tool selection.                                                |
| 15 Memory Skill Templates (C)        | High    | E0     | 8 conversational + 7 embodied. Direct templates for JASON-OS memory operations. Read all 15 before T4. |
| capture_activity_details.md (C)      | High    | E0     | Activity capture with temporal context. Template for auto-memory enhancement.                          |
| insert.md (C)                        | High    | E0     | Memory insert with duplicate avoidance + quality criteria. Apply to auto-memory save logic.            |
| arXiv 2602.02474 (C, NOT FETCHED)    | High    | E1     | Core theory paper. MUST read before T4 execution. High-priority deferred.                              |
| Academic Code Quality (AP)           | Medium  | E0     | 42KB monolith, zero tests, no version pins. Extract concepts, not code.                                |
| Research Artifact as Dependency (AP) | Low     | E0     | Paper companion code. Won't be maintained. Extract knowledge, don't depend.                            |

### karpathy/autoresearch (12 candidates) -- Verdict: Extract (55/72) [Standard, v4.2]

| Candidate                                      | Novelty | Effort | Notes                                                                                                                                                           |
| ---------------------------------------------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| program.md Agent Instruction Pattern           | High    | E0     | 114-line autonomous research protocol: setup, experiment loop, keep/discard, crash recovery, NEVER STOP, simplicity criterion. Compare against SKILL.md format. |
| Fixed-Budget Experimentation                   | High    | E0     | Fixed 5-min time budget makes all experiments comparable. ~12/hour, ~100 overnight. Apply to any time-bounded agent work.                                       |
| 3-File Architecture (Immutable/Editable/Instr) | Medium  | E0     | prepare.py (don't touch) + train.py (agent edits) + program.md (human edits). Mac fork validates: only train.py needed modification.                            |
| Autonomous Crash Recovery Protocol             | Medium  | E0     | Read stack trace, attempt fix, revert if unfixable. Simpler than checkpoint+resume for low-cost tasks.                                                          |
| Results TSV Logging Convention                 | Low     | E0     | commit/metric/memory/status/description. Already have JSONL equivalent.                                                                                         |
| analysis.ipynb Results Methodology (C)         | High    | E0     | Framework: load TSV, keep/discard rates, progress plot with running minimum, rank improvements by delta. Apply to review-metrics.jsonl, learning-routes.jsonl.  |
| Hidden Multi-Agent Architecture (C)            | High    | E0     | .gitignore: worktrees/ + queue/ + generated CLAUDE.md/AGENTS.md. Multi-agent infrastructure exists but isn't shared. Mirrors your worktree usage.               |
| Simplicity Criterion for JASON-OS (K)          | High    | E0     | "Removing something and getting equal or better results is a great outcome." Growth discipline for 72-skill ecosystem.                                          |
| Protocol vs Workflow Design Space (K)          | High    | E0     | program.md (protocol: one agent, one metric, infinite loop) vs SKILL.md (workflow: multi-agent, multi-phase, convergence). When to use which?                   |
| Autonomy Spectrum Design (K)                   | Medium  | E0     | NEVER STOP (autoresearch) vs explicit approval gates (CLAUDE.md #2). JASON-OS needs: autonomous within phases, gated between phases.                            |
| No-License-on-Purpose Trap (AP)                | Low     | E0     | Karpathy can get away with no license. You can't. Always include LICENSE if publishing JASON-OS.                                                                |
| Single-Metric Optimization Trap (AP)           | Medium  | E0     | val_bpb works because the problem has one metric. Don't flatten multi-objective problems (skill quality, agent performance) into one number.                    |

### codecrafters-io/build-your-own-x (12 candidates) -- Verdict: Extract (44) [Standard, v4.2]

| Candidate                                 | Novelty | Effort | Notes                                                                                                                                                                                    |
| ----------------------------------------- | ------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build Your Own React (Pomber) (C)         | High    | E0     | [pomb.us/build-your-own-react](https://pomb.us/build-your-own-react/). Canonical React-from-scratch tutorial. Fiber, reconciliation, hooks. Directly applicable — you use React 19.      |
| Didact: DIY React (C)                     | Medium  | E0     | [github.com/hexacta/didact](https://github.com/hexacta/didact). Virtual DOM diffing focus. Complementary to Pomber. Understanding re-render behavior.                                    |
| Write Yourself a Git (C)                  | Medium  | E0     | [wyag.thber.com](https://wyag.thber.com/). Python git-from-scratch. Understanding object model helps design better hook/worktree infrastructure.                                         |
| Regex Matching Can Be Simple and Fast (C) | Medium  | E0     | [swtch.com/~rsc/regexp/regexp1.html](https://swtch.com/~rsc/regexp/regexp1.html). Russ Cox NFA/DFA theory. Directly applicable to check-pattern-compliance.js regex performance.         |
| 31-Category Tutorial Taxonomy             | Medium  | E0     | 390 links across 31 domains. 16 individually evaluated in content-eval.jsonl. Cross-reference against 72-skill index.                                                                    |
| Curated Link Format Pattern               | Low     | E0     | Standard awesome-list format. Low extraction value.                                                                                                                                      |
| Skill Retirement Process Design (K)       | High    | E0     | Case study: 486K stars, 462 open issues, 1 commit/90d. What happens when a curated collection grows without retirement/archival. Directly applicable to managing 72+ skills in JASON-OS. |
| "Build from Scratch" Framing for D01 (K)  | Medium  | E0     | Feynman principle applied to system understanding. Structure JASON-OS Internal Archaeology (Domain 01) as "how each system was built" narratives rather than "what exists" inventories.  |
| Celebrity Stagnation Lifecycle (K)        | Medium  | E0     | Community enthusiasm → commercial acquisition → maintenance bottleneck → dormancy. Cross-ref: overlaps with public-apis stagnation entry.                                                |
| Shell/CLI Tutorial Collection (K)         | Low     | E0     | Brennan's C shell + Rust shell. Canonical references if JASON-OS needs custom command dispatch.                                                                                          |
| Single-File-Everything Anti-Pattern (AP)  | Medium  | E0     | 390 links in one README.md. Watch for same impulse in EXTRACTIONS.md, MEMORY.md, SKILL_INDEX.md — when a single file becomes the dumping ground.                                         |
| Inline License Without LICENSE File (AP)  | Low     | E0     | CC0 in README but no LICENSE file. GitHub API can't detect it. Always include machine-readable LICENSE if publishing.                                                                    |

**Note:** Cross-reference with `public-apis/public-apis` "Curated-List
Stagnation Case Study" — both repos exhibit the same celebrity stagnation
pattern. Merge into single cross-repo finding when public-apis is re-analyzed.

## Skipped (0)

_None._
