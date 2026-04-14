# Findings: Guard Rails & Resilience Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-008

---

## Key Findings

### 1. Critical Rules — Count and Coverage [CONFIDENCE: HIGH]

All 4 skills have a "Critical Rules (MUST follow)" section. The counts and
domains differ significantly:

| Skill             | Rule Count | Primary Coverage Areas                                                                                                                                                                                |
| ----------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| website-analysis  | 8          | Compliance-first, write-to-disk-first, state updates, Creator View mandatory, no silent skips, bands-over-numbers, home context load                                                                  |
| repo-analysis     | 10         | Quick Scan default, write-to-disk-first, bands-over-numbers, no silent skips, home repo guard, rate limit safety, state updates, no TDMS auto-pollution, Creator View mandatory, conversational style |
| website-synthesis | 8          | 3-site minimum, read-don't-re-analyze, parallel-before-synthesis, conversational style, source weighting mandatory, state file on every phase, write-to-disk-first, thematic saturation stopping rule |
| repo-synthesis    | 5          | 3-repo minimum, read-don't-re-analyze, conversational style, state file on every phase, write-to-disk-first                                                                                           |

Key observation: repo-analysis has the most rules (10) with the most
domain-specific guards (rate limiting, home repo redirect, TDMS opt-in).
repo-synthesis has the fewest (5). website-analysis and website-synthesis are
equal (8 each). Three rules appear in ALL 4 skills: write-to-disk-first, state
file on every phase, and conversational/non-clinical output.

Sources: website-analysis SKILL.md:25-41, repo-analysis SKILL.md:24-43,
website-synthesis SKILL.md:23-41, repo-synthesis SKILL.md:23-34.

---

### 2. Convergence Loop (CL) Usage [CONFIDENCE: HIGH]

Convergence loops are used explicitly in only 1 of the 4 skills:

- **repo-synthesis** (SKILL.md): Has a dedicated Phase 2.5 "Verification Pass"
  described as "Lightweight CL: evidence check + T20 tally." This verifies that
  emergent themes have 3+ repo evidence, gaps have no repo coverage, and reading
  chain transitions have value-map support. T20 tally format: N confirmed, M
  corrected, K extended, J new.

- **website-analysis** (SKILL.md): Has a SELF-AUDIT phase (9 dimensions) but it
  is NOT labeled as a convergence loop and does NOT use T20 tally format. It
  covers completeness, orphan detection, schema integrity, gap analysis,
  functional verification, multi-agent code-reviewer dispatch, regression
  comparison, contract verification, and partial recovery detection.

- **repo-analysis** (SKILL.md): No explicit convergence loop or self-audit
  phase. Creator View has a SHOULD self-verify step (re-read and check home repo
  claims), but no formal CL.

- **website-synthesis** (SKILL.md/REFERENCE.md): No convergence loop or
  self-audit step. Has Artifact Verification (before presenting) checking
  synthesis.md, synthesis.json, and signal detection section.

Summary: repo-synthesis is the only skill with an explicit CL (Phase 2.5) using
T20 tally. website-analysis has an audit-like phase. The two analysis skills
(website-analysis, repo-analysis) have asymmetric verification —
website-analysis has a named Self-Audit, repo-analysis does not.

Sources: repo-synthesis SKILL.md:88-89, 230-241; website-analysis SKILL.md:90,
293-309; repo-analysis SKILL.md (no CL found); website-synthesis
SKILL.md:227-236.

---

### 3. Compaction Resilience — State File + Disk Artifacts [CONFIDENCE: HIGH]

All 4 skills share the same compaction resilience strategy:
write-to-disk-first + state file tracking. The specific implementations differ:

**website-analysis:**

- State file: `.claude/state/website-analysis.<site-slug>.state.json`
- Tracks: schema_version, skill, slug, target_url, target_domain, status, phase,
  depth, mode, phases_completed, phases_failed, extraction_mode,
  compliance_status, compliance_acknowledged, pages_analyzed, output_dir,
  expedition_session_id, agents_spawned, agents_completed, startedAt,
  completedAt, resumable (21 fields)
- Independent disk artifacts: analysis.json, SITE-ANALYSIS.md, meta.json persist
  even if state file is lost
- Stated explicitly: "State file and disk artifacts survive /session-end and
  session restarts"
- Source: SKILL.md:265-276; REFERENCE.md Section 14 (lines 2049-2115)

**repo-analysis:**

- State file: `.claude/state/repo-analysis.<repo-slug>.state.json`
- Tracks: skill, version, slug, target_repo, target_commit, status, phase,
  depth, dimensions_completed, dimensions_failed, clone_dir, clone_strategy,
  output_dir, agent_budget (allocated/spawned/completed), startedAt, completedAt
  (16 fields)
- Independent disk artifacts: analysis.json, findings.jsonl, summary.md,
  value-map.json, dimension files all persist independently
- Notable: tracks agent_budget as sub-object in state
- Source: SKILL.md:488-498; REFERENCE.md Section 8 (lines 1119-1176)

**website-synthesis:**

- State file: `.claude/state/website-synthesis.state.json`
- Tracks: skill, version, status, phase, paradigm, sites_loaded, sites_excluded
  (with reasons), outputs_completed, focus, startedAt, completedAt (11 fields)
- Each output section writes to synthesis.md incrementally; state file tracks
  which sections are complete; resume skips completed sections
- Source: SKILL.md:239-249; REFERENCE.md Section 6 (lines 637-658)

**repo-synthesis:**

- State file: `.claude/state/repo-synthesis.state.json`
- Tracks: skill, version, status, phase, repos_loaded, repos_excluded (with
  reasons), outputs_completed, focus, follow_up_actions (with
  action/target/rationale/status/delegated), refreshed_at, process_feedback,
  startedAt, completedAt (13 fields)
- Most detailed exclusion tracking: repos_excluded includes per-exclusion reason
- Unique: tracks follow_up_actions and process_feedback in state (retro
  persisted)
- Source: SKILL.md:299-310; REFERENCE.md Section 10 (lines 439-476)

State file richness ranking (by field count and detail):

1. website-analysis (21 fields, most operational detail —
   agents_spawned/completed, expedition_session_id)
2. repo-synthesis (13 fields — follow_up_actions sub-objects, process_feedback)
3. repo-analysis (16 raw fields but fewer nested structures)
4. website-synthesis (11 fields — leanest)

---

### 4. Resume Capability [CONFIDENCE: HIGH]

All 4 skills support resume from interruption, with different depths:

| Skill             | Resume Trigger                   | Resume Granularity                       | User Choice Offered?                         |
| ----------------- | -------------------------------- | ---------------------------------------- | -------------------------------------------- |
| website-analysis  | Re-invoke with same URL          | Phase-level (skip completed phases)      | Yes — re-analyze/resume/view previous        |
| repo-analysis     | Re-invocation                    | Phase-level (via state file)             | Yes — Resume/Re-run/Compare                  |
| website-synthesis | Re-invocation                    | Output-section-level                     | Yes — Resume/Re-run                          |
| repo-synthesis    | Re-invocation or "pause" command | Output-section-level (outputs_completed) | Yes — Resume/Re-run; "pause" saves and exits |

repo-synthesis is unique in having an explicit "pause" command that saves state
and exits. website-analysis is the most detailed in its resume protocol,
especially for Expedition mode: a 6-step resume reconstructs the full tree from
meta.json + snap.json + JSONL event log. Source: website-analysis SKILL.md:70 +
REFERENCE.md Section 10.4 (lines 1817-1828); repo-analysis SKILL.md:488-498;
website-synthesis SKILL.md:239-249; repo-synthesis SKILL.md:299-312.

---

### 5. Agent Failure Handling [CONFIDENCE: HIGH]

Only the two analysis skills (website-analysis, repo-analysis) spawn sub-agents.
The synthesis skills do not spawn agents and have no agent failure handling.

**website-analysis (Deep mode, up to 3 agents):**

- After each agent completes: verify output file exists
- If file is empty (0 bytes — Windows agent output bug): capture
  task-notification result text, write to output file
- If agent failed entirely: log failure, re-dispatch with narrower scope
- If retry also fails: report to user, continue with available data
- Rule: NEVER silently accept missing analysis data
- Hard cap: 4 concurrent agents; wave staging for larger pools
- Source: REFERENCE.md Section 13 (lines 2038-2046)

**repo-analysis (Standard/Deep mode, up to 4 agents):**

- After each agent completes: verify dimension file exists
- If file is empty (0 bytes — Windows agent output bug): capture
  task-notification result text, write to dimension file
- If agent failed entirely: log failure reason, re-dispatch with narrower scope
  (same pattern as deep-research agent overflow)
- If retry also fails: report to user, continue with available dimensions
- Rule: NEVER silently accept missing dimension data
- Hard cap: 4 concurrent agents; wave staging for pools larger than 4
- Small repo guard: repos <20 files analyzed inline; subagents cannot access
  /tmp directories
- Source: SKILL.md:136-145; REFERENCE.md Section 15 clone detail (lines
  1580-1596)

The agent failure handling protocol is identical across both analysis skills.
The 5-step escalation pattern (verify → empty-file capture → re-dispatch →
retry-fail → user report) is word-for-word consistent. Both explicitly call out
"Windows agent output bug" for 0-byte files.

---

### 6. Input Validation [CONFIDENCE: HIGH]

Each skill has a VALIDATE phase with different guards:

**website-analysis:**

- URL must be well-formed HTTP/HTTPS, not localhost
- Prior analysis check: offer re-analyze/resume/view previous
- Tool availability check: detect superpowers-chrome vs Playwright vs
  WebFetch-only
- Sets extraction_mode in state file based on tool availability
- Source: SKILL.md:96-98

**repo-analysis:**

- Home repo guard: exact match on `jasonmichaelbell78-creator/sonash-v0` →
  redirect to /audit-comprehensive
- Archived repo check
- Rate limit check: `gh api rate_limit`, abort if remaining < 200
- Fork detection: flag prominently, analyze but inform
- Source: SKILL.md:77; REFERENCE.md Section 9 (lines 1178-1246)

**website-synthesis:**

- Minimum 3 sites (count analysis.json files with complete artifacts)
- Missing MUST artifact check: exclude site with warning, not silently
- Abort if <3 remain after exclusions
- Empty artifact check: note limited synthesis value
- --focus flag validation: must be one of valid set
- Source: SKILL.md:136-145; REFERENCE.md Section 7 (lines 663-675)

**repo-synthesis:**

- Minimum 3 repos (count repos with v4.2 artifacts — checks skillVersion field)
- Missing MUST artifact check per repo: exclude with warning
- Empty artifact warning: warn when MUST artifacts have no meaningful content
  (<10 lines)
- --focus flag validation: must be one of
  themes|gaps|chain|evolution|portfolio|map
- Mixed schema version warning: proceed but note limitations
- Source: SKILL.md:98-119

repo-synthesis has the most thorough input validation, including empty artifact
detection and schema version compatibility checking. repo-analysis has the most
domain-specific guards (home repo redirect, rate limit check).

---

### 7. Scope Explosion Guards [CONFIDENCE: HIGH]

Each skill has mechanisms to prevent unbounded scope growth:

**website-analysis:**

- Site mode page gate: pause for approval every 5 pages; no hard cap but
  advisory at page 20+
- Expedition depth limit: 3 hops default (configurable); thematic saturation is
  the preferred stopping rule
- Expedition pages_max: 15 pages
- Agent hard cap: 4 concurrent (up to 3 spawned + orchestrator)
- High-link-density trigger (>40 unique external links): suggest Expedition or
  cross-site synthesis
- Source: SKILL.md:139-157; REFERENCE.md Section 10.2 (lines 1732-1743)

**repo-analysis:**

- Interactive gate before Standard/Deep: must accept before cloning
- Agent hard cap: 4 concurrent
- Rate limit abort at remaining < 200
- Statistics endpoint skip for repos >= 10,000 commits
- Trees API truncation handling at 100,000 entries / 7 MB
- Source: REFERENCE.md Section 9 (lines 1191-1253), Section 10 (lines 1275-1311)

**website-synthesis:**

- Minimum 3 sites enforced
- Thematic saturation stopping rule: 3 consecutive sites with no new themes
- Source: SKILL.md:39

**repo-synthesis:**

- Candidate pool cap: if total > 100, present top 50 inline, full list in
  synthesis.json
- Minimum 3 repos enforced
- --min-repos override documented with 2-repo warning (comparison not synthesis)
- Source: REFERENCE.md Section 9 (lines 419-436); SKILL.md:215-217

---

### 8. Budget and Cost Controls [CONFIDENCE: MEDIUM]

The skills use behavioral/interactive gates rather than hard spending limits:

**website-analysis:**

- Expedition budget parameters explicitly documented: pages_max=15, depth_max=3
  hops, tokens_per_page ~2,500, wall_clock_per_page 10-15 seconds,
  alive_check_timeout 5 seconds
- Budget warning event in JSONL event log when pages_remaining <= 5
- Site mode: no hard cap; user-controlled via 5-page approval gate
- Source: REFERENCE.md Section 10.2 (lines 1732-1742)

**repo-analysis:**

- Interactive gate before Standard/Deep is the cost gate (clone = cost)
- Rate limit check (`remaining < 200`) is the API budget guard
- No token cost tracking; no explicit spending limits
- Source: SKILL.md:78-79; REFERENCE.md Section 9 (lines 1180-1187)

**website-synthesis:**

- No explicit budget parameters
- No interactive gate before synthesis runs
- Source: SKILL.md (no budget section found)

**repo-synthesis:**

- No explicit budget parameters
- Warm-Up provides a time estimate ("~3-5 min (3 repos), ~8-15 min (6+ repos)")
  before execution
- Checkpoint at Phase 1 Load: "Proceed to synthesis?" requires user confirmation
- Source: SKILL.md:124-135, 157-159

The analysis skills have more explicit cost controls (interactive gates, rate
limit guards). The synthesis skills rely on scope minimums and user checkpoints.
No skill tracks token spend.

---

### 9. Windows-Specific Workarounds [CONFIDENCE: HIGH]

**website-analysis:**

- URL-to-slug algorithm is explicitly Windows MAX_PATH compliant (REFERENCE.md
  Section 9)
- Calculation documented: workspace prefix ~80 chars + .research/ prefix ~30
  chars + site slug max 80 chars + nested files ~50 chars = ~260 chars (fits
  MAX_PATH=260)
- Slug truncated to 80 characters at word boundary; SHA-256 suffix appended if
  truncated or collision risk
- Agent 0-byte output bug: step 2 of agent failure handling captures
  task-notification result text and writes to output file
- Source: REFERENCE.md Section 9 (lines 1657-1687), Section 13 (line 2042)

**repo-analysis:**

- Agent 0-byte output bug: step 2 of agent failure handling captures
  task-notification result text and writes to dimension file
- Clone to /tmp/ (not project directory) avoids MAX_PATH issues with clone paths
- Source: REFERENCE.md (lines 1591-1592)

**website-synthesis:**

- No Windows-specific workarounds documented
- Source: SKILL.md, REFERENCE.md (no Windows/MAX_PATH content found)

**repo-synthesis:**

- No Windows-specific workarounds documented
- Source: SKILL.md, REFERENCE.md (no Windows/MAX_PATH content found)

The 0-byte agent output workaround is present in both analysis skills but absent
from both synthesis skills (which do not spawn agents). The MAX_PATH workaround
is only explicitly documented in website-analysis; repo-analysis clones to /tmp/
which sidesteps the issue structurally rather than algorithmically.

---

### 10. Data Integrity Checks [CONFIDENCE: HIGH]

**website-analysis:**

- 9-dimension Self-Audit phase (penultimate, MUST): completeness (artifacts
  exist), orphan detection, schema integrity (schema_version field), gap
  analysis, functional verification (state file updated), multi-agent
  code-reviewer dispatch on SITE-ANALYSIS.md, regression (compare
  finding/candidate counts if prior run), contract (analysis.json matches
  REFERENCE.md schema), partial recovery (detect stale artifacts from
  interrupted runs)
- VALIDATE phase checks prior analysis and offers comparison
- Source: SKILL.md:293-305

**repo-analysis:**

- Artifact Verification checklist before routing menu: analysis.json,
  findings.jsonl, value-map.json, creator-view.md, summary.md, deep-read.md,
  content-eval.jsonl (or mined-links.jsonl), coverage-audit.jsonl,
  EXTRACTIONS.md updated, extraction-journal.jsonl updated
- Creator View SHOULD self-verify: re-read generated content, verify home repo
  claims reference actual files
- Phase 6b Coverage Audit: interactive prompt surfacing N unexplored items, user
  decides analyze/select/skip; skipped items recorded in coverage-audit.jsonl
- Source: SKILL.md:459-468, 232-236, 376-419

**website-synthesis:**

- Artifact Verification before presenting: synthesis.md, synthesis.json,
  paradigm-specific sections, signal detection section
- Missing artifacts flagged before follow-up actions
- Source: SKILL.md:228-236

**repo-synthesis:**

- Phase 3 Self-Audit (MUST, 6 dimensions): completeness (all sections), orphan
  detection (no unreferenced files), build integrity (grep for
  TODO/FIXME/placeholder/TBD), gap analysis (compare outputs_completed vs
  expected), contract verification (synthesis.json vs REFERENCE.md schema),
  regression detection (compare against prior SYNTHESIS.md)
- Phase 2.5 Verification Pass: claim-level evidence verification + T20 tally
- Source: SKILL.md:245-258

Data integrity comparison:

- website-analysis and repo-synthesis are most thorough (named self-audit phases
  with multiple dimensions)
- repo-analysis has an artifact checklist and coverage audit but no named
  self-audit phase
- website-synthesis has only an artifact existence check — the weakest of the
  four

---

### 11. Guard Rail Patterns Unique to One Skill [CONFIDENCE: HIGH]

**website-analysis only:**

- HARD_BLOCK compliance system (robots.txt, X-Robots-Tag, llms.txt — stops skill
  entirely)
- WARN compliance system with required user acknowledgment
- Compliance acknowledgment persisted in state file
- Cloudflare detection and handling (WARN not HARD_BLOCK for cf-mitigated:
  challenge)
- RSS/Atom feed detection and opt-in surface
- Tool availability fallback matrix (superpowers-chrome → Playwright →
  WebFetch-only)
- Expedition depth limit + thematic saturation stopping rule
- URL-to-slug MAX_PATH algorithm
- Source: SKILL.md:248-258; REFERENCE.md Sections 7, 9, 10, 15

**repo-analysis only:**

- Home repo guard (redirect to /audit-comprehensive for sonash-v0)
- GitHub rate limit check with `remaining < 200` abort threshold
- Fork detection and flagging
- LFS detection: GIT_LFS_SKIP_SMUDGE=1 if .gitattributes present
- Clone safety: /tmp/ only, auto-cleanup after analysis
- Large repo skip: statistics endpoints skipped for repos >= 10,000 commits
- Trees API truncation handling at 100,000 entries
- Framework detection heuristics (config file presence + dependency name
  required)
- TDMS anti-pollution: intake is opt-in via routing menu only
- Source: REFERENCE.md Section 9 (lines 1178-1273); SKILL.md:37

**website-synthesis only:**

- Source tier weighting system (T1=3x, T2=2x, T3=1x, T4=0.5x) with 6:1 T1:T4
  ratio
- Anchoring prevention: all sites analyzed independently BEFORE synthesis begins
- Thematic saturation stopping rule (3 consecutive sites)
- Source: SKILL.md:5, 37-40; REFERENCE.md (paradigm specs)

**repo-synthesis only:**

- Explicit "pause" command that saves state and exits
- Process feedback (retro) persisted in state file
- Warm-Up phase with candidate counts and time estimate
- Phase 1 Load checkpoint requiring user confirmation before synthesis
- Delegation pattern: "you decide" → select highest-impact action, record as
  delegated-action
- Candidate pool cap (>100 → present top 50 inline)
- Previous synthesis comparison with regression detection
- Source: SKILL.md:125-135, 157-159, 213-217, 256, 278-281, 285, 310

---

## Guard Rails Comparison Table

| Guard Rail Category          | website-analysis                 | repo-analysis                       | website-synthesis               | repo-synthesis                    |
| ---------------------------- | -------------------------------- | ----------------------------------- | ------------------------------- | --------------------------------- |
| Critical rules count         | 8                                | 10                                  | 8                               | 5                                 |
| Write-to-disk-first rule     | YES (rule 3)                     | YES (rule 2)                        | YES (rule 7)                    | YES (rule 5)                      |
| State file on every phase    | YES (rule 4)                     | YES (rule 7)                        | YES (rule 6)                    | YES (rule 4)                      |
| No silent skips rule         | YES (rule 6)                     | YES (rule 4)                        | No (not in rules)               | No (not in rules)                 |
| Explicit CL / verification   | Self-Audit (9d)                  | None formal                         | Artifact check only             | Phase 2.5 CL + Phase 3 Self-Audit |
| T20 tally used               | No                               | No                                  | No                              | YES (Phase 2.5)                   |
| State file field count       | 21 fields                        | 16 fields                           | 11 fields                       | 13 fields                         |
| Resume capability            | YES (6-step expedition protocol) | YES                                 | YES                             | YES + "pause" command             |
| Agent failure handling       | YES (5-step, 0-byte fix)         | YES (5-step, 0-byte fix)            | N/A (no agents)                 | N/A (no agents)                   |
| Windows 0-byte workaround    | YES                              | YES                                 | No                              | No                                |
| Windows MAX_PATH algorithm   | YES (explicit)                   | No (uses /tmp)                      | No                              | No                                |
| Compliance pre-flight        | YES (HARD_BLOCK/WARN/PROCEED)    | No                                  | No                              | No                                |
| Rate limit guard             | No                               | YES (< 200 remaining)               | No                              | No                                |
| Home repo redirect           | No                               | YES                                 | No                              | No                                |
| Input minimum enforcement    | URL format check                 | Home repo + rate limit + fork       | 3-site minimum                  | 3-repo minimum + schema version   |
| Scope explosion guard        | 5-page gate; 3-hop; saturation   | Interactive gate + rate limit       | Saturation                      | Candidate cap (>100)              |
| Budget parameters documented | YES (expedition explicit)        | No                                  | No                              | Warm-Up estimate only             |
| Budget event logging         | YES (JSONL events)               | No                                  | No                              | No                                |
| Data integrity audit         | 9-dimension Self-Audit           | Artifact checklist + Coverage Audit | Artifact existence only         | 6-dimension Self-Audit + CL       |
| Source weighting             | No                               | No                                  | YES (T1-T4 tiers, 6:1 ratio)    | No (fit scores from value-map)    |
| Clone safety / temp handling | N/A                              | YES (/tmp, LFS guard, cleanup)      | N/A                             | N/A                               |
| TDMS anti-pollution          | No                               | YES (opt-in only)                   | No                              | No                                |
| Anchoring prevention         | N/A                              | N/A                                 | YES (parallel before synthesis) | No (not specified)                |
| Retro persisted in state     | No (retro is conversational)     | No                                  | No                              | YES (process_feedback field)      |
| Delegation pattern           | No                               | No                                  | No                              | YES                               |

---

## Sources

| #   | File Path                                       | Type             | Trust | Notes                         |
| --- | ----------------------------------------------- | ---------------- | ----- | ----------------------------- |
| 1   | `.claude/skills/website-analysis/SKILL.md`      | Skill definition | HIGH  | Lines 25-309, primary source  |
| 2   | `.claude/skills/website-analysis/REFERENCE.md`  | Reference spec   | HIGH  | Sections 7, 9, 10, 13, 14, 15 |
| 3   | `.claude/skills/repo-analysis/SKILL.md`         | Skill definition | HIGH  | Lines 24-498, primary source  |
| 4   | `.claude/skills/repo-analysis/REFERENCE.md`     | Reference spec   | HIGH  | Sections 8, 9, 10, 15         |
| 5   | `.claude/skills/website-synthesis/SKILL.md`     | Skill definition | HIGH  | Lines 23-291, primary source  |
| 6   | `.claude/skills/website-synthesis/REFERENCE.md` | Reference spec   | HIGH  | Sections 6, 7                 |
| 7   | `.claude/skills/repo-synthesis/SKILL.md`        | Skill definition | HIGH  | Lines 23-327, primary source  |
| 8   | `.claude/skills/repo-synthesis/REFERENCE.md`    | Reference spec   | HIGH  | Sections 9, 10, 11            |

All sources are primary (filesystem ground truth). No external sources
consulted.

---

## Contradictions

**No hard contradictions found.** The skills share consistent guard rail
patterns where they overlap. Two observations of design asymmetry worth
flagging:

1. **Self-Audit asymmetry:** website-analysis has a 9-dimension formal
   Self-Audit phase; repo-analysis does not despite being a more complex skill
   (more phases, more artifacts, more agent coordination). repo-analysis uses an
   artifact checklist + Coverage Audit instead, which is less systematic. Both
   approaches work but they're architecturally inconsistent for sibling skills.

2. **CL asymmetry:** repo-synthesis has an explicit Verification Pass (Phase
   2.5) with T20 tally; website-synthesis does not have an equivalent despite
   being structurally similar. This may be intentional (repo-synthesis went
   through a v1.2 audit; website-synthesis is v1.0) but it means the website
   synthesis outputs have weaker evidence verification.

3. **Windows workaround coverage gap:** The 0-byte agent output bug workaround
   is in both analysis skills but not documented in synthesis skills. Since
   synthesis skills don't spawn agents this is correct — but worth noting that
   if synthesis skills ever gain agent spawning, the workaround would need to be
   added.

---

## Gaps

1. **No convergence loop skill referenced:** None of the 4 skills reference the
   convergence-loop skill explicitly. The T20 tally in repo-synthesis is
   described as a "Lightweight CL" inline rather than invoking the dedicated
   `/convergence-loop` skill. It is unclear whether the convergence-loop skill
   is intended to be invoked by these skills or if they implement lightweight
   equivalents inline.

2. **No explicit timeout handling for agents:** Both analysis skills have a
   5-step agent failure protocol but none of the steps specify a timeout
   threshold — how long to wait before declaring an agent "failed." The protocol
   says "after each agent completes" but doesn't specify a maximum wait time.

3. **website-synthesis guard rails section:** The Guard Rails section in
   website-synthesis SKILL.md (lines 269-276) is a brief 5-bullet summary. The
   REFERENCE.md for website-synthesis has no Guard Rails section at all (unlike
   repo-synthesis REFERENCE.md which has Section 9). This is the least guarded
   skill.

4. **No cost tracking across any skill:** No skill tracks token cost, API call
   counts, or financial spend. Budget controls are behavioral (gates, caps) not
   quantitative.

5. **website-analysis has no TDMS guard:** Unlike repo-analysis which has Rule 8
   explicitly prohibiting TDMS auto-pollution, website-analysis has no
   equivalent guard despite having a similar routing menu structure.

---

## Serendipity

- **Expedition mode has the most sophisticated resilience pattern** of any
  feature across all 4 skills: a 3-file state pattern (meta.json = session
  metadata, snap.json = tree snapshot, .jsonl = append-only event log) inspired
  by Chromium's flat-list history design. This is a notably robust design — the
  event log can reconstruct state even if snap.json is corrupted.

- **repo-synthesis tracks delegation in state:** The follow_up_actions field in
  the state schema includes a `delegated: boolean` flag, enabling audit of which
  decisions the user delegated vs. decided themselves. This is a behavioral
  accountability mechanism not present in any other skill.

- **Rate limit check granularity in repo-analysis:** REFERENCE.md Section 9
  documents that GitHub's Core, search, code_search, and GraphQL are independent
  rate limit buckets. The check against `remaining < 200` must be applied
  per-bucket, not globally. This is a subtlety that could cause bugs if the
  implementation naively checks only one bucket.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 1 (budget section — synthesis skills have no budget docs,
  absence itself is a finding)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings are grounded in direct filesystem reads of the 8 source files. No
external sources, training data, or inference was required.
