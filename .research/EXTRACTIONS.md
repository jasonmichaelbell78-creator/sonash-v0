# Extraction Candidates — Cross-Entity Summary

Auto-generated from `extraction-journal.jsonl`. Do not edit directly.

**Schema version:** 2.0 | **Total:** 81 candidates **By decision:** defer: 74,
investigate: 2, extract: 5

---

## codecrafters-io/build-your-own-x (repo)

| Candidate                                        | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ------------------------------------------------ | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Build Your Own React (Pomber)                    | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | https://pomb.us/build-your-own-react/. Canonical React-from-scratch tutorial. Fiber, reconciliation, hooks. Directly app |
| Didact: DIY React                                | content      | defer    | 2026-04-06 | medium  | E0     | high      | -            | https://github.com/hexacta/didact. Virtual DOM diffing focus. Complementary to Pomber. Understanding re-render behavior. |
| Write Yourself a Git                             | content      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | https://wyag.thb.lt. Python git-from-scratch. Understanding object model helps design better hook/worktree infrastructur |
| Regex Matching Can Be Simple and Fast (Russ Cox) | content      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | https://swtch.com/~rsc/regexp/regexp1.html. NFA/DFA theory. Directly applicable to check-pattern-compliance.js regex per |
| 31-Category Tutorial Taxonomy                    | pattern      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 390 links across 31 domains. 16 individually evaluated in content-eval.jsonl. Cross-reference against 72-skill index.    |
| Curated Link Format Pattern                      | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | Standard awesome-list format. Low extraction value.                                                                      |
| Skill Retirement Process Design                  | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | Case study: 486K stars, 462 open issues, 1 commit/90d. What happens when a curated collection grows without retirement/a |
| Build from Scratch Framing for Domain 01         | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | Feynman principle applied to system understanding. Structure JASON-OS Internal Archaeology (Domain 01) as 'how each syst |
| Celebrity Stagnation Lifecycle                   | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | Community enthusiasm → commercial acquisition → maintenance bottleneck → dormancy. Cross-ref: overlaps with public-apis  |
| Shell/CLI Tutorial Collection                    | knowledge    | defer    | 2026-04-06 | low     | E0     | medium    | -            | 7 shell tutorials (C, Go, Rust). Canonical references if JASON-OS needs custom command dispatch. Defer until architectur |
| Single-File-Everything Anti-Pattern              | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 390 links in one README.md. Watch for same impulse in EXTRACTIONS.md, MEMORY.md, SKILL_INDEX.md — when a single file bec |
| Inline License Without LICENSE File              | anti-pattern | defer    | 2026-04-06 | low     | E0     | medium    | -            | CC0 in README but no LICENSE file. GitHub API can't detect it. Always include machine-readable LICENSE if publishing.    |

## HKUDS/CLI-Anything (repo)

| Candidate                                | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ---------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| HARNESS.md 7-Phase SOP                   | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | Systematic methodology for wrapping GUI apps as agent-native CLIs. Directly applicable to JASON-OS Domain 02a.           |
| SKILL.md Command Catalog Format          | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | 37 SKILL.md files. Flat command references vs sonash workflow definitions. Design space comparison for skill format evol |
| .claude-plugin/marketplace.json          | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | First public Claude Code plugin format reference. Compare against sonash .claude-plugin/ structure.                      |
| Registry + CLI-Hub Distribution          | pattern      | defer    | 2026-04-06 | medium  | E1     | medium    | -            | registry.json (35 CLIs) → static hub → pip install. Agent-discoverable via meta-skill. Model for JASON-OS skill distribu |
| ReplSkin Terminal UI                     | pattern      | defer    | 2026-04-06 | medium  | E1     | medium    | -            | Python prompt_toolkit branded REPL. Pattern portable, code Python-specific. Reference for JASON-OS interactive modes.    |
| Codec Allowlist Pattern                  | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | frozenset-based subprocess arg validation. Similar to existing sonash security patterns.                                 |
| Skill Generator (Jinja2)                 | pattern      | defer    | 2026-04-06 | medium  | E2     | medium    | -            | Auto-generates SKILL.md from CLI introspection. Pattern portable to Node/TS.                                             |
| Agent-Native Software Methodology        | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | Core insight: wrap GUI software systematically for agents. HARNESS.md is the how-to. Foundational for JASON-OS Domain 02 |
| Build-vs-Integrate Decision for JASON-OS | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | Should JASON-OS invoke CLI-Anything harnesses (Python) or generate Node/TS wrappers using same methodology? Critical arc |
| Quality Treadmill Case Study             | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 28K stars in 29d, 35 harnesses, 0 CI enforcement. Growth outpacing gates. Opposite of build-your-own-x stagnation.       |
| MCP Backend Pattern                      | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | guides/mcp-backend.md. Wrap MCP servers as CLI backends via ClientSession + stdio_client. You have 3 MCP servers. Direct |
| Skill Auto-Generation Guide              | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | guides/skill-generation.md. Introspect Click decorators → Jinja2 → SKILL.md. Could inform /skill-creator automation.     |
| Mermaid Harness                          | content      | defer    | 2026-04-06 | medium  | E0     | high      | -            | Lightest-weight harness. No local binary (mermaid.ink cloud). Ready to use for agent-driven diagrams.                    |
| Exa Harness                              | content      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | AI search + structured extraction via Exa API. Alternative/complement for /deep-research searchers.                      |
| No-CI-for-Tests Anti-Pattern             | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 74 test files, zero CI enforcement. Tests as documentation, not quality gates. Don't regress on pre-commit enforcement.  |
| Monorepo Without Shared Testing          | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 35 packages, 0 conftest.py, no shared runner. Plan shared testing if JASON-OS distributes skills as packages.            |
| Growing Faster Than Quality Gates        | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 28K stars/29d with no automated enforcement. Same trajectory as celebrity stagnation, faster.                            |

## ViktorAxelsen/MemSkill (repo)

| Candidate                          | Type         | Decision    | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                               |
| ---------------------------------- | ------------ | ----------- | ---------- | ------- | ------ | --------- | ------------ | --------------------------------------------------------------------------------------------------- |
| Meta-Memory Skills Framework       | pattern      | defer       | 2026-04-06 | high    | E0     | high      | -            | Skills about HOW to remember. Paradigm shift for auto-memory. Read arXiv 2602.02474.                |
| Skill Evolution Loop               | pattern      | defer       | 2026-04-06 | high    | E1     | high      | -            | Mine failures → refine skills → propose new. General-purpose self-improvement.                      |
| Skill Bank 5-Section Format        | pattern      | defer       | 2026-04-06 | medium  | E0     | medium    | -            | Description/Purpose/When to Use/How to Apply/Constraints. Compare against SKILL.md.                 |
| Designer Prompt Templates          | pattern      | defer       | 2026-04-06 | high    | E0     | medium    | -            | 18KB failure classification + mutation prompts. Skill refinement methodology.                       |
| Dual-Embedding Memory Bank         | pattern      | defer       | 2026-04-06 | medium  | E2     | medium    | -            | Content + context embeddings. Concept portable, code FAISS+PyTorch.                                 |
| Operation Templates with Meta-Info | pattern      | defer       | 2026-04-06 | medium  | E1     | medium    | -            | Usage + reward + EMA tracking for skill/tool selection.                                             |
| 15 Memory Skill Templates          | content      | defer       | 2026-04-06 | high    | E0     | high      | -            | 8 conversational + 7 embodied. Direct templates for JASON-OS memory operations. Read all before T4. |
| capture_activity_details.md        | content      | defer       | 2026-04-06 | high    | E0     | high      | -            | Activity capture with temporal context. Template for auto-memory enhancement.                       |
| insert.md                          | content      | defer       | 2026-04-06 | high    | E0     | high      | -            | Memory insert with duplicate avoidance + quality criteria.                                          |
| arXiv 2602.02474                   | content      | investigate | 2026-04-06 | high    | E1     | high      | -            | Core theory paper. NOT FETCHED. MUST read before T4 execution.                                      |
| Academic Code Quality              | anti-pattern | defer       | 2026-04-06 | medium  | E0     | medium    | -            | 42KB monolith, zero tests, no version pins. Extract concepts, not code.                             |
| Research Artifact as Dependency    | anti-pattern | defer       | 2026-04-06 | low     | E0     | medium    | -            | Paper companion code. Won't be maintained. Extract knowledge, don't depend.                         |

## karpathy/autoresearch (repo)

| Candidate                                             | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| program.md Agent Instruction Pattern                  | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | 114-line autonomous research protocol: setup, experiment loop, keep/discard, crash recovery, NEVER STOP, simplicity crit |
| Fixed-Budget Experimentation                          | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | Fixed 5-min time budget makes all experiments comparable. ~12/hour, ~100 overnight. Apply to any time-bounded agent work |
| 3-File Architecture (Immutable/Editable/Instructions) | pattern      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | prepare.py (don't touch) + train.py (agent edits) + program.md (human edits). Clean editable-zone contract.              |
| Autonomous Crash Recovery Protocol                    | pattern      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | Read stack trace, attempt fix, revert if unfixable. Simpler than checkpoint+resume for low-cost tasks.                   |
| Results TSV Logging Convention                        | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | commit/metric/memory/status/description. Already have JSONL equivalent. Low extraction value.                            |
| Simplicity Criterion for JASON-OS                     | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | 'Removing something and getting equal or better results is a great outcome.' Growth discipline for 72-skill ecosystem.   |
| Protocol vs Workflow Design Space                     | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | program.md (protocol: one agent, one metric, infinite loop) vs SKILL.md (workflow: multi-agent, multi-phase, convergence |
| Autonomy Spectrum Design                              | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | NEVER STOP (autoresearch) vs explicit approval gates (CLAUDE.md #2). JASON-OS needs: autonomous within phases, gated bet |
| analysis.ipynb Results Methodology                    | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | Framework: load TSV, keep/discard rates, progress plot with running minimum, rank improvements by delta. Apply to review |
| Hidden Multi-Agent Architecture                       | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | .gitignore: worktrees/ + queue/ + generated CLAUDE.md/AGENTS.md. Multi-agent infrastructure exists but isn't shared. Mir |
| No-License-on-Purpose Trap                            | anti-pattern | defer    | 2026-04-06 | low     | E0     | medium    | -            | Karpathy can get away with no license. You can't. Always include LICENSE if publishing JASON-OS.                         |
| Single-Metric Optimization Trap                       | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | val_bpb works because the problem has one metric. Don't flatten multi-objective problems into one number.                |

## teng-lin/notebooklm-py (repo)

| Candidate                           | Type         | Decision    | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                     |
| ----------------------------------- | ------------ | ----------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Skill Install + Version Stamping    | pattern      | defer       | 2026-04-06 | high    | E2     | high      | -            | skill.py reads SKILL.md from package data, stamps version, writes to ~/.claude/skills/. Solves cross_locale_config. Need  |
| Autonomy Rules Section in SKILL.md  | pattern      | defer       | 2026-04-06 | medium  | E1     | high      | -            | 22 auto-run + 7 ask-first with per-command reasons. Retrofit candidate for add-debt, pr-review, session-end, audit-\* ski |
| Nightly RPC Health Check            | pattern      | defer       | 2026-04-06 | medium  | E2     | medium    | -            | rpc-health.yml: daily cron, 3 exit codes, auto-creates labeled GitHub issues. External contract monitoring pattern.       |
| Ambient CLAUDE.md PR Workflow       | pattern      | defer       | 2026-04-06 | medium  | E1     | medium    | -            | 4-step embedded PR workflow. Alternative to /pr-review. Ambient vs invoked design question.                               |
| Embedded Task() Subagent Patterns   | pattern      | defer       | 2026-04-06 | medium  | E1     | medium    | -            | Literal Task() invocations in SKILL.md workflows. Reduces agent cognitive load.                                           |
| Open Skills Ecosystem Investigation | pattern      | investigate | 2026-04-06 | high    | E1     | high      | -            | npx skills add teng-lin/notebooklm-py. Unverified. Critical for JASON-OS distribution if real.                            |
| SKILL.md Autonomy Rules Template    | content      | defer       | 2026-04-06 | medium  | E0     | high      | -            | Lines 94-128. Direct template for adding autonomy rules to sonash skills.                                                 |
| skill.py Install Mechanism          | content      | defer       | 2026-04-06 | high    | E0     | high      | -            | Reference implementation. SkillTarget dataclass, version stamping, drift detection.                                       |
| rpc-health.yml Workflow             | content      | defer       | 2026-04-06 | medium  | E0     | high      | -            | Complete 90-line workflow. Daily cron, 3 exit codes, auto-issue creation, artifact upload.                                |
| CLAUDE.md Agent Guidance Pattern    | content      | defer       | 2026-04-06 | medium  | E0     | high      | -            | Well-structured CLAUDE.md + ambient PR workflow. Compare against sonash CLAUDE.md v5.9.                                   |
| AGENTS.md Separation                | knowledge    | defer       | 2026-04-06 | low     | E0     | medium    | -            | Separate file for multi-agent guidance. Consider if CLAUDE.md Section 7 grows.                                            |
| Undocumented API Dependency         | anti-pattern | defer       | 2026-04-06 | medium  | E0     | medium    | -            | Entire project wraps obfuscated Google RPC endpoints. Prefer documented APIs.                                             |
| Over-Engineered Install Mechanism   | anti-pattern | defer       | 2026-04-06 | low     | E0     | medium    | -            | 280 lines for copy file + stamp version. Extract pattern, not complexity.                                                 |

## public-apis/public-apis (repo)

| Candidate                                | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                  |
| ---------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Link Validation Workflow                 | pattern      | defer    | 2026-04-06 | low     | E1     | medium    | -            | validate_links.yml (29 lines) + links.py (273 lines). Daily cron link checker. Port to sonash for docs link integrity. |
| Structured Catalog Format (enum columns) | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | API/Desc/Auth/HTTPS/CORS with constrained enum values. Reference for JASON-OS skill/tool catalog.                      |
| Format Validation Script Pattern         | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | format.py (277 lines) + tests (466 lines). Regex-based format enforcement. Simpler version of patterns:check.          |
| Google Calendar API                      | content      | defer    | 2026-04-06 | medium  | E1     | high      | -            | OAuth via Firebase Auth. Direct SoNash integration: sobriety milestones, meeting reminders, daily check-ins.           |
| Open-Meteo Weather API                   | content      | defer    | 2026-04-06 | low     | E0     | medium    | -            | No auth, CORS yes. Zero-friction weather data for mood-weather correlation journaling.                                 |
| Google Cloud Natural Language API        | content      | defer    | 2026-04-06 | medium  | E1     | medium    | -            | Same Firebase/Google Cloud ecosystem. Journal sentiment analysis for emotional pattern tracking.                       |
| validate_links.yml Workflow              | content      | defer    | 2026-04-06 | low     | E1     | high      | -            | 29-line daily cron. Directly transferable for SKILL_INDEX.md, EXTRACTIONS.md, MEMORY.md link checking.                 |
| Celebrity Stagnation with Infrastructure | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | Second data point with codecrafters. Proves automation alone doesn't prevent stagnation. MERGED cross-repo finding.    |
| Validation Without Maintenance Trap      | anti-pattern | defer    | 2026-04-06 | medium  | E0     | high      | -            | Format validation ensures structural integrity but not content freshness. Applies to patterns:check.                   |
| Sponsor-First README Anti-Pattern        | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 10 promoted APIs before community content. Erodes trust. Keep sponsors separate from content if JASON-OS has partners. |

## https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f (website)

| Candidate                                                | Type                   | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| -------------------------------------------------------- | ---------------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Three-layer architecture pattern for LLM knowledge bases | architecture-pattern   | extract  | 2026-04-07 | medium  | E0     | high      | -            | Maps to JASON-OS extraction framing. Raw sources / wiki / schema = .research/ / docs+MEMORY / CLAUDE.md+skills.          |
| Ingest-Query-Lint operational triad                      | workflow-pattern       | extract  | 2026-04-07 | medium  | E1     | high      | -            | Ingest=/repo-analysis+/website-analysis, Query=/deep-research+/repo-synthesis, Lint=orphan detection+/alerts+health scri |
| Answers-compound-into-wiki principle                     | design-principle       | extract  | 2026-04-07 | high    | E0     | high      | -            | Key gap: /deep-research and /brainstorm outputs archive to .research/ but don't feed back into active knowledge layer. T |
| Index + Log dual navigation system                       | implementation-pattern | extract  | 2026-04-07 | low     | E0     | high      | -            | Already have: DOCUMENTATION_INDEX.md=index, SESSION_HISTORY.md+commit-log.jsonl=log, research-index.jsonl=research index |
| qmd local markdown search (MCP + CLI)                    | tool                   | extract  | 2026-04-07 | high    | E1     | medium    | -            | Evaluate for JASON-OS search layer. Currently Grep+index-based. At 1000+ docs may need hybrid BM25/vector search.        |
