# SQ2: Research/Discovery Patterns in Non-Core Skills

**Sub-question:** What research/discovery patterns exist in skills OUTSIDE
deep-plan/deep-research?

**Researcher:** Claude Opus 4.6 (1M context) **Date:** 2026-03-24 **Skills
analyzed:** 14 (skill-audit, skill-creator, code-reviewer, pr-review,
systematic-debugging, session-begin, alerts, ecosystem-health,
hook-ecosystem-audit, session-ecosystem-audit, doc-ecosystem-audit,
health-ecosystem-audit, comprehensive-ecosystem-audit, convergence-loop)
**Confidence methodology:** HIGH = directly observed in SKILL.md text; MEDIUM =
strongly implied by process structure; LOW = inferred from partial evidence.

---

## Summary Table

| Skill                         | Does Research/Discovery?                       | Method                                                                                                    | Agents/Tools                                                                             | Verifies Findings?                                                                           | Uses CLs?                                                    | Uses Teams?                                       | Standardizable Patterns                                                 |
| ----------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------- |
| skill-audit                   | YES — deep category-by-category investigation  | 11-category checklist audit, interactive Q&A, evidence gathering                                          | code-reviewer agent (Phase 5), Explore agents (implicit), audit-review-team (3+ targets) | YES — 3-layer self-audit: grep proof, agent verification, diff mapping                       | YES — quick CL in Phase 2 discovery                          | YES — audit-review-team for batch                 | Evidence-based verification, convergence in discovery                   |
| skill-creator                 | YES — exhaustive discovery phase               | 6-category question bank, ~12+ questions, multi-batch                                                     | Explore agents (SHOULD for Complex tier)                                                 | YES — convergence-loop verify in Phase 5, grep-based self-check                              | YES — Phase 5 CL verify for Complex                          | NO                                                | Front-loaded discovery, domain research check                           |
| code-reviewer                 | YES — code analysis + pattern matching         | Anti-pattern scan, checklist verification, episodic memory search                                         | Episodic memory MCP, dispatched as subagent itself                                       | YES — re-read modified files, run lint/test/patterns:check                                   | NO                                                           | NO                                                | Episodic memory pre-search, anti-pattern catalog                        |
| pr-review                     | YES — multi-pass extraction + investigation    | 3-pass parsing, DAS scoring, retro pattern check, SonarCloud enrichment, threat model                     | security-auditor, test-engineer, performance-engineer, code-reviewer agents (Step 3)     | YES — Step 7 count check + TDMS sync + DAS compliance                                        | NO                                                           | NO (uses agent dispatch for 20+ items)            | Multi-pass extraction, cross-round dedup, DAS framework                 |
| systematic-debugging          | YES — root cause investigation                 | 5-phase scientific method: memory check, root cause, pattern analysis, hypothesis testing, implementation | Episodic memory MCP                                                                      | YES — Phase 3 hypothesis testing, Phase 4 failing test creation                              | NO                                                           | NO                                                | Scientific method, backward data flow tracing                           |
| session-begin                 | PARTIAL — context loading + health checking    | Read docs, run 9 health scripts, check anomaly files, cross-doc dependency check                          | None (script-based)                                                                      | PARTIAL — script pass/fail only                                                              | NO                                                           | NO                                                | Multi-source health aggregation, warning gates                          |
| alerts                        | YES — health signal analysis + trend detection | Run checker script (18 or 42 categories), scoring, benchmarks, trend detection, cross-session comparison  | None (script-based)                                                                      | YES — Phase 5 fix verification CL, Phase 6 self-audit (coverage, suppression health)         | YES — Phase 5 fix verification, Phase 2 trend data integrity | NO                                                | Checker-based scoring, alert-by-alert triage loop                       |
| ecosystem-health              | YES — health investigation + triage            | Run 10 health checkers, 8 weighted categories, 13 dimensions, composite scoring                           | None (script-based)                                                                      | YES — duplicate-run guard, ROADMAP cross-check                                               | NO                                                           | NO                                                | Weighted composite scoring, interactive triage loop                     |
| hook-ecosystem-audit          | YES — deep ecosystem investigation             | Run audit script (20 categories, 6 domains), interactive walkthrough                                      | None standalone; runs as parallel agent in comprehensive-audit                           | YES — Phase 5 self-audit, Phase 6 verification re-run, gate effectiveness review             | NO                                                           | NO (but supports orchestrated parallel execution) | Script-driven discovery, re-run verification, gate effectiveness review |
| session-ecosystem-audit       | YES — ecosystem investigation                  | Run audit script (17 categories, 5 domains), interactive walkthrough                                      | None                                                                                     | YES — Phase 4 process verification, Phase 6 re-run verification                              | NO                                                           | NO                                                | 4-layer compaction resilience analysis                                  |
| doc-ecosystem-audit           | YES — ecosystem investigation                  | Run audit script (16 categories, 5 domains), interactive walkthrough                                      | None                                                                                     | YES — Phase 6 re-run verification                                                            | NO                                                           | NO                                                | Link integrity checking, coverage analysis                              |
| health-ecosystem-audit        | YES — meta-health investigation                | Run audit script (26 categories, 6 domains), live test execution, interactive walkthrough                 | None standalone; orchestrated in comprehensive-audit                                     | YES — Phase 5 process audit + test suite, Phase 6 re-run verification                        | NO                                                           | NO                                                | Live test integration, meta-audit pattern                               |
| comprehensive-ecosystem-audit | YES — aggregated multi-domain investigation    | Orchestrate 8 audits in 2 staged waves, aggregate into cross-audit analysis                               | YES — 5 parallel agents (Stage 1) + 3 parallel agents (Stage 2)                          | YES — cross-audit analysis: domain heat map, shared file hotspots, common pattern violations | NO                                                           | NO (uses raw agent parallelism)                   | Multi-wave orchestration, cross-audit insight synthesis                 |
| convergence-loop              | META — IS the verification framework           | Multi-pass agent loops with composable behaviors, T20 tallies                                             | YES — dispatches agents per behavior (source-check, discovery, verification, fresh-eyes) | YES — this IS the verification mechanism                                                     | YES — IS a CL                                                | NO                                                | Composable behaviors, graduated convergence, presets                    |

---

## Detailed Analysis by Skill

### 1. skill-audit — Category-Based Interactive Investigation

**Confidence: HIGH**

**Research/discovery method:**

- Phase 2 is a full 11-category interactive audit with per-category scoring
- Each category requires: assessment, pros, cons, gaps, suggestions with
  rationale
- Phase 2.5 (Operational Dependency Check) is a dedicated investigation phase
  that traces root causes ("don't just note 'file missing' — trace the writer,
  identify WHY")
- Phase 3 crosschecks findings against adjacent skills and ecosystem impact

**Agents/tools:**

- Phase 5 dispatches `code-reviewer` agent for independent verification (>15
  decisions)
- Phase 2 mentions T25 convergence loop self-application
- Team config: `audit-review-team` for batch audits of 3+ skills

**Verification:**

- 3-layer evidence-based verification (Phase 5): grep proof, agent verification,
  diff mapping
- Every decision must have objective evidence — "logging a decision as PASS does
  NOT mean it was implemented"

**CL usage:** Quick convergence loop in Phase 2 discovery (Pass 1 audits, Pass 2
verifies)

**Standardizable patterns:**

1. **Root-cause investigation mandate** — Phase 2.5 SA-3 requires tracing WHY,
   not just WHAT
2. **Evidence-based verification** — grep proof + agent cross-check + diff
   mapping
3. **Interactive Q&A discovery** — one category at a time, decisions saved
   incrementally
4. **Mid-audit checkpoint** — scope explosion guard at halfway point

---

### 2. skill-creator — Front-Loaded Exhaustive Discovery

**Confidence: HIGH**

**Research/discovery method:**

- Phase 1 (Context Gathering): ROADMAP check, neighbor scan, existing pattern
  scan, domain research suggestion
- Phase 2 (Discovery): 6 question categories with floor of ~12 questions, no
  ceiling; batched 4-6 at a time with inter-batch synthesis
- Domain research check (Phase 1.5): "suggest `/deep-research` first to
  understand the landscape?" — explicitly connects to deep-research pipeline

**Agents/tools:**

- Explore agents (SHOULD for Complex tier) — dispatched to scan codebase for
  relevant patterns before presenting questions
- Findings inform defaults and recommendations

**Verification:**

- Phase 5: convergence-loop verify (MUST for Complex) — verifies created skill's
  codebase claims
- Evidence-based self-check: re-read all files, grep each planning decision for
  proof of implementation

**CL usage:** Phase 5 uses CL for verifying codebase claims in created skills

**Standardizable patterns:**

1. **Domain research gate** — explicit check before starting: does this need
   deep-research first?
2. **Discovery-before-writing mandate** — no writing until discovery complete
   and approved
3. **Inter-batch synthesis** — summarize learnings between question batches
4. **Contradiction detection** — flag conflicts between answers immediately
5. **Mid-discovery progress check** — after batch 2, report progress and offer
   scope reduction

---

### 3. code-reviewer — Pattern-Matching + Memory-Augmented Analysis

**Confidence: HIGH**

**Research/discovery method:**

- Pre-review episodic memory search: queries past reviews, established patterns,
  and conventions
- Anti-pattern verification against CODE_PATTERNS.md catalog (7 specific
  anti-patterns)
- Positive pattern verification (safe alternatives)
- Full checklist across 7 domains (TypeScript, React, Firebase, Tailwind,
  Scripts, Security, Testing)

**Agents/tools:**

- Episodic memory MCP (search for past review context)
- Dispatched as a subagent by other skills (pr-review Step 3, skill-audit
  Phase 5)

**Verification:**

- Binary block/pass on anti-pattern check
- Re-read modified files after applying review feedback
- Run lint + test + patterns:check

**Standardizable patterns:**

1. **Episodic memory pre-search** — before starting work, search for relevant
   past context
2. **Catalog-driven pattern matching** — check against a known list rather than
   ad-hoc
3. **Block-on-violation** — no warning mode, violations are immediate blockers

---

### 4. pr-review — Multi-Pass Extraction + Cross-Round Investigation

**Confidence: HIGH**

**Research/discovery method:**

- Step 0: Pre-checks including high-churn watchlist, PR size advisory,
  first-scan detection, security threat model
- Step 1: Multi-pass extraction (3 passes for >200 lines): scan headers, extract
  details, cross-reference for missed items
- Step 1: Retro pattern check reads last 3 retros' action items and
  auto-elevates matches
- Step 2: DAS scoring framework (Signal/Dependency/Risk) for pre-existing items
- SonarCloud enrichment: auto-fetch code snippets for rule IDs

**Agents/tools:**

- Step 3: Dispatch security-auditor, test-engineer, performance-engineer,
  code-reviewer agents for 20+ items across 3+ concerns
- Parallel agent strategy documented in reference file

**Verification:**

- Step 7: Count check (fixed + deferred + rejected = total), no orphans, TDMS
  sync, DAS compliance
- Step 4: Propagation sweep (grep entire codebase for same pattern after each
  fix)
- Cross-round dedup for R2+

**Standardizable patterns:**

1. **Multi-pass extraction** — don't single-pass large inputs; scan, extract,
   cross-reference
2. **DAS framework** — structured scoring for defer/act decisions
   (Signal/Dependency/Risk)
3. **Cross-round dedup** — auto-reject items already decided in prior rounds
4. **Multi-source convergence** — auto-elevate items flagged by 2+ sources
5. **Propagation sweep** — after fixing a pattern, grep entire codebase for same
   pattern
6. **Merge trigger** — after R4+, check fix rate to avoid diminishing returns

---

### 5. systematic-debugging — Scientific Method Investigation

**Confidence: HIGH**

**Research/discovery method:**

- Phase 0: Episodic memory check for prior occurrences
- Phase 1: Root cause investigation (read errors, reproduce, check changes,
  gather evidence, trace data flow)
- Phase 2: Pattern analysis (find working examples, compare, identify
  differences, understand dependencies)
- Phase 3: Hypothesis testing (single hypothesis, minimal test, verify)
- Phase 4: Implementation (failing test, single fix, verify)

**Agents/tools:**

- Episodic memory MCP (Phase 0)
- No other agents — deliberately single-investigator to maintain hypothesis
  discipline

**Verification:**

- Phase 3: hypothesis testing with minimal changes
- Phase 4: failing test case before fix, verification after
- 3-fix architectural escalation rule — if 3+ fixes fail, question architecture

**Standardizable patterns:**

1. **Memory check before investigation** — search for prior occurrences first
2. **Root cause mandate** — no fixes without investigation
3. **Scientific method structure** — hypothesis, test, verify cycle
4. **Backward data flow tracing** — trace from symptom to source
5. **Architectural escalation** — 3+ failed fixes = wrong architecture, not
   wrong fix
6. **Red flag checklist** — known rationalizations that signal process violation

---

### 6. session-begin — Multi-Source Context Aggregation

**Confidence: MEDIUM** (context loading rather than pure research, but has
investigation elements)

**Research/discovery method:**

- Phase 2: Context loading from SESSION_CONTEXT.md, ROADMAP.md, git log
  comparison
- Phase 3: Run 9 health scripts covering patterns, reviews, lessons, gaps,
  roadmap hygiene, etc.
- Phase 4: Warning gates — hook anomaly detection (override trends, warning
  counts, health grade drops), infrastructure failure checks, tech debt snapshot
- Cross-document dependency checking

**Agents/tools:** None — script-based

**Verification:**

- Script pass/fail reporting
- Branch validation (SESSION_CONTEXT vs git branch)
- Stale documentation check (commits vs ROADMAP checkboxes)

**Standardizable patterns:**

1. **Multi-source aggregation** — gather from docs, git, scripts, state files in
   a single pass
2. **Warning acknowledgment gate** — surface warnings and require explicit
   acknowledgment
3. **Scope explosion guard** — if 3+ issues found, present triage list before
   acting
4. **Duplicate detection** — prevent re-running the same workflow

---

### 7. alerts — Checker-Based Health Scoring + Interactive Triage

**Confidence: HIGH**

**Research/discovery method:**

- Phase 1: Run checker script (18 limited or 42 full categories)
- Phase 2: Dashboard with scoring (100 - deductions), letter grades, trend
  detection
- Cross-session trends from alerts-history.jsonl
- Volume spike detection (>2x alert count vs previous run)
- Ecosystem stress detection (3+ categories declining simultaneously)

**Agents/tools:** None — script-based, but routes to specialized skills for
fixes

**Verification:**

- Phase 5: Convergence loop for fix verification (re-run affected checkers)
- Phase 2: Trend data integrity CL (verify history file exists, recent,
  reasonable count)
- Phase 6: Self-audit (checker coverage, suppression health, score integrity,
  decision balance)

**CL usage:**

- Phase 5: fix verification (re-run checkers after fixes)
- Phase 2: trend data integrity check

**Standardizable patterns:**

1. **Checker-based scoring pipeline** — automated scripts produce structured
   data, skill interprets
2. **Volume spike detection** — flag anomalous increases in alert count
3. **Suppression management** — track suppressed findings with reason validation
   (15+ chars)
4. **Escape hatch** — offer to stop every N items in long walkthrough
5. **Ecosystem stress signal** — detect when multiple subsystems degrade
   simultaneously

---

### 8. ecosystem-health — Weighted Composite Investigation + Interactive Triage

**Confidence: HIGH**

**Research/discovery method:**

- Phase 1: Run 10 health checkers across 8 weighted categories (64 metrics)
- Phase 0: Load previous run context (score, flagged dimensions)
- Phase 3: Interactive triage loop for dimensions scoring below C (<70)
- ROADMAP cross-reference before presenting fix options

**Agents/tools:** None — script-based

**Verification:**

- Duplicate-run guard (<30 min)
- ROADMAP alignment check
- Retro prompt for feedback on dimension accuracy

**Standardizable patterns:**

1. **Weighted composite scoring** — different domains weighted by importance
2. **Dimension-based drill-down** — overview score drives into specific flagged
   areas
3. **Triage mode selection** — review each / fix all / AI decides
4. **Scope boundary** — triage for quick fixes only, defer deep work to
   dedicated sessions
5. **Trend pollution prevention** — warn against re-running to "see score
   improve"

---

### 9-12. Ecosystem Audit Skills (hook, session, doc, health)

**Confidence: HIGH** (all follow a shared template with variations)

**Shared research/discovery pattern:** All four ecosystem audit skills follow a
nearly identical 6-8 phase structure:

| Phase   | Pattern                        | Description                                           |
| ------- | ------------------------------ | ----------------------------------------------------- |
| Warm-up | Orientation                    | Effort estimate, process overview, previous learnings |
| Phase 1 | Script-driven data collection  | Run dedicated audit script, parse v2 JSON output      |
| Phase 2 | Dashboard overview             | Composite grade, domain breakdown, trend indicators   |
| Phase 3 | Finding-by-finding walkthrough | Impact-sorted, interactive decisions per finding      |
| Phase 4 | Summary + TDMS                 | Decision aggregate, DEBT entries for deferrals        |
| Phase 5 | Process self-audit             | Verify own process was followed (checklist)           |
| Phase 6 | Verification re-run            | Re-run audit to confirm fixes improved score          |
| Phase 7 | Trend report                   | Cross-run comparison from JSONL history               |
| Phase 8 | Closure                        | Learnings, invocation tracking, artifacts             |

**Key variations:**

| Skill                   | Categories | Domains | Unique Feature                                   |
| ----------------------- | ---------- | ------- | ------------------------------------------------ |
| hook-ecosystem-audit    | 20         | 6       | Gate effectiveness review, CI/CD pipeline health |
| session-ecosystem-audit | 17         | 5       | 4-layer compaction resilience analysis           |
| doc-ecosystem-audit     | 16         | 5       | Link integrity, coverage completeness            |
| health-ecosystem-audit  | 26         | 6       | Live test execution (Phase 1b), meta-audit       |

**Agents/tools:**

- No internal agents when run standalone
- All support orchestrated parallel execution by comprehensive-ecosystem-audit
- Return protocol: save JSON to temp file, return single-line summary

**Verification:**

- Self-audit checklist (Phase 5)
- Re-run verification (Phase 6) — compare pre/post scores
- Test suite execution (`__tests__/` directory)

**Standardizable patterns:**

1. **Script-then-interpret** — automated script collects data, AI interprets and
   triages
2. **Impact-weighted walkthrough** — sort findings by impact score, present
   highest first
3. **Batch shortcuts** — offer batch acknowledgment for 3+ similar findings
4. **Scope explosion guard** — >30 findings triggers filtered review offer
5. **State persistence** — save progress after every decision for compaction
   resilience
6. **Re-run verification** — re-run same audit to confirm fixes worked
7. **Trend tracking** — append results to JSONL for historical comparison

---

### 13. comprehensive-ecosystem-audit — Multi-Wave Orchestrated Investigation

**Confidence: HIGH**

**Research/discovery method:**

- Stage 1: Run 5 independent audits in parallel (hook, session, TDMS, PR,
  health)
- Stage 2: Run 3 more audits in parallel (skill, doc, script)
- Stage 3: Aggregate results into cross-audit analysis

**Agents/tools:**

- 5 parallel agents (Stage 1) + 3 parallel agents (Stage 2)
- Each agent runs a script, saves JSON, returns one-line summary
- Caller checks completion via file size (wc -c), never reads full output

**Verification:**

- Cross-audit analysis: domain heat map, shared file hotspots, common pattern
  violations
- Weighted health grade formula across all 8 audits
- Partial failure handling: continue with remaining audits if one fails

**Standardizable patterns:**

1. **Multi-wave parallel orchestration** — independent agents in staged waves
2. **Minimal return protocol** — agents return one-line summary, save detailed
   data to files
3. **Cross-domain synthesis** — find patterns that span multiple audit domains
4. **Partial failure resilience** — compute weighted average from completed
   audits only

---

### 14. convergence-loop — The Meta-Verification Framework

**Confidence: HIGH**

**Research/discovery method:** This skill IS the verification framework used by
other skills. Key elements:

- Composable behaviors: source-check, discovery, verification, fresh-eyes,
  write-then-verify, fix-and-re-verify
- Presets: standard (3-pass), quick (2-pass), thorough (5-pass), research-claims
  (6-pass)
- T20 tallies: Confirmed / Corrected / Extended / New per pass
- Graduated convergence: per-claim, not all-or-nothing

**Agents/tools:**

- Dispatches agents per behavior (each pass is an agent)
- Custom agent prompts per behavior type

**Verification:**

- This IS the verification tool — multi-pass by definition
- Contradictions treated as findings, not errors
- User gate before declaring convergence

**Standardizable patterns:**

1. **Composable verification behaviors** — mix and match pass types
2. **T20 tally protocol** — structured tracking of what each pass found
3. **Graduated convergence** — individual claims can converge independently
4. **Contradiction surfacing** — disagreement is data, not error

---

## Cross-Skill Pattern Synthesis

### Pattern Family 1: Discovery Approaches

| Pattern                    | Skills Using It                                                       | Description                                                               |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Script-then-interpret      | alerts, ecosystem-health, all 4 ecosystem audits, comprehensive-audit | Automated script collects structured data; AI interprets, scores, triages |
| Question-bank discovery    | skill-creator, skill-audit                                            | Structured question categories with exhaustive coverage                   |
| Episodic memory pre-search | code-reviewer, systematic-debugging                                   | Search past context before starting new investigation                     |
| Multi-pass extraction      | pr-review                                                             | Multiple passes over input: scan, extract, cross-reference                |
| Scientific method          | systematic-debugging                                                  | Hypothesis, test, verify cycle                                            |
| Domain research gate       | skill-creator                                                         | Explicit check: does this task need deep-research first?                  |

### Pattern Family 2: Verification Approaches

| Pattern                  | Skills Using It                                  | Description                                                          |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------- |
| Re-run verification      | alerts (Phase 5), all ecosystem audits (Phase 6) | Re-run the same checker/script after fixes to confirm improvement    |
| Grep-based proof         | skill-audit (Phase 5), skill-creator (Phase 5)   | Grep output files for keywords proving each decision was implemented |
| Agent cross-verification | skill-audit (Phase 5, code-reviewer dispatch)    | Independent agent verifies findings                                  |
| Diff-based mapping       | skill-audit (Phase 5)                            | Map each decision to its implementing diff hunk                      |
| Count reconciliation     | pr-review (Step 7)                               | fixed + deferred + rejected = total                                  |
| Propagation sweep        | pr-review (Step 4)                               | After fixing pattern, grep codebase for all instances                |
| Self-audit checklist     | all ecosystem audits (Phase 5), alerts (Phase 6) | Verify own process was followed correctly                            |

### Pattern Family 3: Decision Frameworks

| Pattern                     | Skills Using It                                             | Description                                              |
| --------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Impact-weighted walkthrough | all ecosystem audits, alerts                                | Sort findings by impact, present highest first           |
| DAS scoring                 | pr-review                                                   | Signal/Dependency/Risk scoring for defer/act decisions   |
| Batch shortcuts             | all ecosystem audits, alerts                                | Offer batch acknowledgment for 3+ similar items          |
| Delegation protocol         | skill-audit, ecosystem-health, all ecosystem audits, alerts | Handle "you decide" with auto-accept rules               |
| Scope explosion guard       | skill-audit, session-begin, all ecosystem audits            | Threshold-based warning when finding count exceeds limit |
| Escape hatch                | alerts                                                      | Offer to stop every N items                              |

### Pattern Family 4: State/History Patterns

| Pattern                    | Skills Using It                                | Description                                          |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Compaction-resilient state | all ecosystem audits, alerts, pr-review        | Save progress after every decision to temp JSON file |
| JSONL trend tracking       | alerts, ecosystem-health, all ecosystem audits | Append results to JSONL for historical comparison    |
| Cross-round dedup          | pr-review                                      | Auto-reject items already decided in prior rounds    |
| Resume protocol            | all ecosystem audits, alerts, pr-review        | Check for recent state file, offer resume            |

---

## Recommendations for Standardization

### 1. Universal Discovery Protocol (HIGH confidence)

Every skill that does research/discovery should declare its discovery approach
from a standard menu:

- **Script-driven** (automated data collection)
- **Question-bank** (structured human Q&A)
- **Memory-augmented** (episodic/historical context search)
- **Multi-pass extraction** (iterative parsing)
- **Scientific method** (hypothesis-test-verify)

### 2. Universal Verification Protocol (HIGH confidence)

The following verification steps appear in 5+ skills and should be standardized:

- **Re-run verification** — re-run checker after fixes (ecosystem audits,
  alerts)
- **Evidence-based proof** — grep/diff proof per decision (skill-audit,
  skill-creator)
- **Self-audit checklist** — verify own process was followed (all ecosystem
  audits)
- **Count reconciliation** — ensure all items have dispositions (pr-review)

### 3. Convergence Loop Integration Contract (HIGH confidence)

The convergence-loop skill already defines composable behaviors and presets.
Skills that DO discovery should wire in CLs:

- skill-audit already uses quick CL in Phase 2
- alerts uses CL in Phase 5 fix verification
- skill-creator uses CL in Phase 5 for Complex tier
- Ecosystem audits do NOT use CLs — candidate for Phase 6 re-run replacement

### 4. Interactive Triage Standard (HIGH confidence)

The finding-by-finding walkthrough pattern appears in 7+ skills with nearly
identical structure. Standardize:

- Impact-weighted sorting
- Context card format (severity, domain, impact score, message, evidence)
- Decision options per severity (ERROR: fix/defer/skip; WARNING: fix/defer/skip;
  INFO: acknowledge/defer)
- Batch shortcuts (3+ similar findings)
- Delegation protocol ("you decide" handling)
- Progress tracking ("Finding N of M")
- Scope explosion guard (>30 findings)

### 5. State Persistence Standard (MEDIUM confidence)

The compaction guard pattern is copy-pasted across 6+ skills. Standardize:

- Temp file path convention: `.claude/tmp/{skill-name}-progress.json`
- Resume check: exists + <2h old
- Save-after-every-decision protocol
- Cleanup on completion
- History append to JSONL

### 6. Domain Research Gate (MEDIUM confidence)

skill-creator's Phase 1 domain research check should be generalized: any skill
entering unfamiliar territory should check `.research/` for prior research and
offer `/deep-research` if none exists.

---

## Gaps Identified

1. **No CL in ecosystem audits** — The 4 ecosystem audits all do re-run
   verification (Phase 6) but none use the convergence-loop skill. This is a
   natural integration point.
2. **Episodic memory used inconsistently** — Only code-reviewer and
   systematic-debugging use episodic memory pre-search. Skills like pr-review
   and skill-audit could benefit from checking past audit results.
3. **No standard discovery taxonomy** — Each skill describes its discovery
   differently. A shared vocabulary would help cross-skill consistency.
4. **Older ecosystem audits (session, doc) still use AskUserQuestion** —
   hook-ecosystem-audit and health-ecosystem-audit have been updated to
   conversational Q&A, but session and doc still reference AskUserQuestion.
5. **Comprehensive-ecosystem-audit has no CL or verification** — It orchestrates
   8 audits but doesn't verify the cross-audit analysis against reality.
