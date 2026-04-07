# Findings: Phase/Workflow Design Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-002

---

## Key Findings

### 1. All Four Skills Use the Same Phase Marker Format [CONFIDENCE: HIGH]

All four skills specify `========== PHASE N: [NAME] ==========` as the standard
phase delimiter. This is declared explicitly in the process overview of every
skill.

Sources:

- website-analysis SKILL.md:99 — "Use phase transition markers:
  `========== PHASE N: [NAME] ==========`"
- repo-analysis SKILL.md:92 — "Phase markers:
  `========== PHASE N: [NAME] ==========`"
- website-synthesis SKILL.md:132 — "Phase markers:
  `========== PHASE N: [NAME] ==========`"
- repo-synthesis SKILL.md:93 — "Phase markers:
  `========== PHASE N: [NAME] ==========`"

All four skills are fully consistent on this convention. No variation exists.

---

### 2. Analysis Skills Have Far More Phases Than Synthesis Skills [CONFIDENCE: HIGH]

The analysis skills (website-analysis and repo-analysis) have 5–9 numbered
phases plus pre-phase and post-phase stages. The synthesis skills have 4–6 named
phases with a flatter structure. Analysis skills handle per-item complexity;
synthesis skills operate on already-collected artifacts.

repo-analysis has the most phases by count (7 numbered + 2 lettered sub-phases

- VALIDATE + ROUTING + Retro). website-analysis has fewer numbered phases but
  adds VALIDATE + PREFLIGHT as distinct pre-phases.

---

### 3. Decimal/Lettered Sub-Phases Are Used Only in repo-analysis and repo-synthesis [CONFIDENCE: HIGH]

repo-analysis uses lettered sub-phases (2b, 4b, 6b) for conditional or
supplemental steps that extend numbered phases. repo-synthesis uses a decimal
sub-phase (2.5) for a verification pass inserted between main phases.

website-analysis uses "Phase 1b" for multi-page mode (replaces Phase 1 rather
than extending it). website-synthesis has no sub-phases at all — its 4 phases
are all top-level.

Sub-phase conventions:

- repo-analysis: `2b` (Deep Read), `4b` (Content Eval), `6b` (Coverage Audit)
- repo-synthesis: `2.5` (Verification Pass)
- website-analysis: `1b` (Multi-page, replaces Phase 1 in Site/Expedition mode)
- website-synthesis: none

---

### 4. VALIDATE Is a Pre-Phase in All Four Skills — But Has Different Names/Scope [CONFIDENCE: HIGH]

All four skills begin with a validation step before any numbered phase. However,
the scope and naming differ:

- **website-analysis:** VALIDATE (URL check, prior analysis detection) +
  PREFLIGHT (compliance check — robots.txt, Cloudflare, HARD_BLOCK) — two
  distinct pre-phases before Phase 0
- **repo-analysis:** VALIDATE (home repo guard, archived check, rate limits,
  fork check) — one pre-phase before Phase 0
- **website-synthesis:** VALIDATE (3+ sites? Artifacts present? Rate missing
  data) — one pre-phase before Phase 1
- **repo-synthesis:** VALIDATE + WARM-UP — two distinct pre-phases before Phase
  1

website-analysis is the only skill with a compliance-specific pre-flight as a
hard block. website-synthesis has no equivalent.

---

### 5. Gate Checkpoints Are Unique to Analysis Skills [CONFIDENCE: HIGH]

Both analysis skills have an interactive GATE after Phase 0 (Quick Scan) where
the user confirms whether to proceed to Standard/Deep analysis. Synthesis skills
have no equivalent gate — they proceed automatically once validated.

- **website-analysis GATE:** After Phase 0 — "Run Standard analysis? [y/N]" —
  bypassed by `--standard`, `--deep`, `--site`, `--expedition` flags
- **repo-analysis GATE:** After Phase 0 — "Run Standard/Deep? [y/N]" — bypassed
  by `--depth=standard|deep`
- **website-synthesis:** No gate — proceeds to Phase 1 after VALIDATE
- **repo-synthesis:** No gate after validation — has WARM-UP (informational, not
  gating), but Phase 1 has a **checkpoint** ("Proceed to synthesis?") that
  requires user confirmation

repo-synthesis Phase 1 checkpoint is the only synthesis-side gate. It's
positioned after artifact loading, not before.

---

### 6. Self-Audit as a Penultimate Phase Is Present in Two Skills [CONFIDENCE: HIGH]

repo-synthesis has an explicit Phase 3 (Self-Audit) as a penultimate step before
presentation. website-analysis has a SELF-AUDIT section labeled "(MUST —
penultimate phase)" but it is listed after the ROUTING section in the skill
document and before the Retro, not as a numbered phase in the process overview.

repo-analysis has an "Artifact Verification" step (before routing) and no
separate self-audit phase in its numbered sequence.

website-synthesis has an "Artifact Verification" step (before presenting) but no
full self-audit phase.

Summary:

- repo-synthesis: Phase 3 (Self-Audit) — full 6-dimension audit, MUST
- website-analysis: SELF-AUDIT block — 9-dimension audit, MUST, penultimate
- repo-analysis: Artifact Verification (checklist before routing), no phase
  number
- website-synthesis: Artifact Verification (checklist before presenting), no
  phase number

---

### 7. Verification Pass (Phase 2.5) Is Unique to repo-synthesis [CONFIDENCE: HIGH]

repo-synthesis inserts a lightweight verification pass (Phase 2.5) between
synthesizing (Phase 2) and self-auditing (Phase 3). This phase confirms that
interpretive claims (themes, gaps, reading chain transitions) are backed by
actual source evidence. It produces a "T20 tally" (N confirmed, M corrected, K
extended, J new).

No equivalent phase exists in the other three skills. This is the most
distinctive structural feature of repo-synthesis.

Source: repo-synthesis SKILL.md:234–239

---

### 8. Retro Is MUST in repo-synthesis, SHOULD in Others [CONFIDENCE: HIGH]

- **repo-synthesis:** Retro is MUST — "Any observations..." saved to
  `process_feedback` in state file; accepts empty/"none"
- **repo-analysis:** Retro is implied SHOULD — "Any observations about the
  analysis quality or process?" — no MUST label
- **website-analysis:** Retro is SHOULD — "After Done routing option"
- **website-synthesis:** Retro is SHOULD — "After follow-up"

Only repo-synthesis elevates retro to MUST with explicit state persistence.

---

### 9. Routing Menu Is Present in All Analysis Skills But Not Synthesis Skills [CONFIDENCE: HIGH]

Both analysis skills end with a named ROUTING phase with multiple numbered
options. Synthesis skills end with "Follow-up actions" that are presented inline
rather than as a formal routing menu.

- **website-analysis ROUTING:** 7 options (Extract knowledge, Start Expedition,
  Deep-plan this, Save to memory, Explore insights, Done, Cross-site synthesis)
- **repo-analysis ROUTING:** 8 options (Extract value, Send to TDMS, Deep-plan
  this, Save to memory, Adoption verdict, Explore insights, Done, Cross-repo
  synthesis)
- **website-synthesis Phase 4:** 6 follow-up actions (Explore theme, Fill gap,
  Extract top candidates, Compare paradigms, Save to memory, Done)
- **repo-synthesis Phase 4:** 6 follow-up actions (Explore theme, Fill gap,
  Extract top candidates, Save to memory, Inject into deep-plan, Done)

The synthesis skills have inline action tables, not a named ROUTING phase with a
numbered menu.

---

### 10. WARM-UP / Progress Orientation Exists Only in repo-synthesis [CONFIDENCE: HIGH]

repo-synthesis has an explicit WARM-UP pre-phase that presents a structured
summary before work begins: repo count, output list, candidate counts, estimated
time, previous feedback note. No other skill has this.

Source: repo-synthesis SKILL.md:121–135

This pattern would benefit website-synthesis for the same reason: synthesis runs
can be long and users benefit from scope confirmation before committing.

---

## Phase-by-Phase Comparison Table

| Step / Phase    | website-analysis                                      | repo-analysis                                          | website-synthesis                                        | repo-synthesis                                                                                        |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Pre-phase 1** | VALIDATE (URL check, prior analysis)                  | VALIDATE (home guard, archived, rate limits)           | VALIDATE (3+ sites, artifacts)                           | VALIDATE (3+ repos, artifacts, focus flag)                                                            |
| **Pre-phase 2** | PREFLIGHT (compliance: robots.txt, HARD_BLOCK)        | —                                                      | —                                                        | WARM-UP (scope + time estimate)                                                                       |
| **Phase 0**     | Quick Scan (navigate + eval + screenshot)             | Quick Scan (18 dimensions, API-only)                   | —                                                        | —                                                                                                     |
| **GATE**        | Interactive gate after Phase 0 [y/N]                  | Interactive gate after Phase 0 [y/N]                   | —                                                        | Checkpoint at end of Phase 1 [confirm]                                                                |
| **Phase 1**     | Content extraction (WebFetch processed content)       | Clone + Repomix (blobless clone, repomix IMMEDIATELY)  | Load all artifacts, build internal graph                 | Load all artifacts, build internal graph                                                              |
| **Phase 1b**    | Multi-page (replaces Phase 1 in Site/Expedition mode) | —                                                      | —                                                        | —                                                                                                     |
| **Phase 2**     | Creator View (7 sections, conversational prose)       | Dimension Wave (inline or up to 4 agents)              | Synthesize (per paradigm)                                | Produce 6 outputs (or --focus subset)                                                                 |
| **Phase 2b**    | —                                                     | Deep Read (internal artifacts beyond code)             | —                                                        | —                                                                                                     |
| **Phase 2.5**   | —                                                     | —                                                      | —                                                        | Verification Pass (T20 tally)                                                                         |
| **Phase 3**     | Engineer View (6 dimensions, 4-band scoring)          | History Wave (Deep only — 12-month temporal)           | Signal Detection (convergence, divergence, gaps, trends) | Self-Audit (6 dimensions: completeness, orphans, build integrity, gap analysis, contract, regression) |
| **Phase 4**     | Value Map (knowledge candidates ranked)               | Creator View (home context + Deep Read + Content Eval) | Present + Follow-up actions                              | Present + Follow-up actions                                                                           |
| **Phase 4b**    | —                                                     | Content Evaluation (all repo types)                    | —                                                        | —                                                                                                     |
| **Phase 5**     | —                                                     | Engineer View (health tables, dual-lens scoring)       | —                                                        | —                                                                                                     |
| **Phase 6**     | —                                                     | Value Map (4 candidate types + cross-repo connections) | —                                                        | —                                                                                                     |
| **Phase 6b**    | —                                                     | Coverage Audit (unexplored content scan, interactive)  | —                                                        | —                                                                                                     |
| **SELF-AUDIT**  | MUST (9 dimensions, penultimate)                      | Artifact Verification (checklist before routing)       | Artifact Verification (checklist before presenting)      | Phase 3 Self-Audit (MUST, 6 dimensions)                                                               |
| **ROUTING**     | Named menu (7 options)                                | Named menu (8 options)                                 | Follow-up actions table (6 options)                      | Follow-up actions table (6 options)                                                                   |
| **Retro**       | SHOULD (after Done)                                   | Implied ("Any observations...")                        | SHOULD                                                   | MUST (state-persisted)                                                                                |

---

## Mandatory vs Optional Phases

| Phase / Step                          | website-analysis                         | repo-analysis                               | website-synthesis                              | repo-synthesis |
| ------------------------------------- | ---------------------------------------- | ------------------------------------------- | ---------------------------------------------- | -------------- |
| VALIDATE                              | MUST                                     | MUST                                        | MUST                                           | MUST           |
| PREFLIGHT                             | MUST (before extraction)                 | —                                           | —                                              | —              |
| Phase 0 (Quick Scan)                  | MUST (every invocation)                  | MUST (default)                              | —                                              | —              |
| Phase 1 (content/clone/load)          | MUST (Standard/Deep)                     | MUST (Standard/Deep)                        | MUST                                           | MUST           |
| Phase 1b (multi-page)                 | Replaces Phase 1 in Site/Expedition mode | —                                           | —                                              | —              |
| Phase 2 (synthesis/dimension/creator) | MUST (Standard/Deep)                     | MUST (Standard/Deep)                        | MUST                                           | MUST           |
| Phase 2b (Deep Read)                  | —                                        | MUST (Standard/Deep)                        | —                                              | —              |
| Phase 2.5 (Verification)              | —                                        | —                                           | —                                              | MUST           |
| Phase 3 (signal/history/self-audit)   | MUST (Standard/Deep)                     | Deep only                                   | MUST                                           | MUST           |
| Phase 4 (value map/creator/present)   | MUST (Standard/Deep)                     | MUST (Standard/Deep)                        | MUST                                           | MUST           |
| Phase 4b (content eval)               | —                                        | MUST (Standard/Deep)                        | —                                              | —              |
| Phase 5 (engineer view)               | SHOULD                                   | MUST                                        | —                                              | —              |
| Phase 6 (value map)                   | —                                        | MUST (Standard/Deep)                        | —                                              | —              |
| Phase 6b (coverage audit)             | —                                        | MUST (Standard/Deep)                        | —                                              | —              |
| SELF-AUDIT                            | MUST                                     | Artifact verification (MUST before routing) | Artifact verification (MUST before presenting) | Phase 3 (MUST) |
| ROUTING/Follow-up                     | After Standard/Deep                      | After Standard/Deep                         | After Phase 4                                  | After Phase 4  |
| Retro                                 | SHOULD                                   | SHOULD                                      | SHOULD                                         | MUST           |

---

## Phases Unique to One Skill That Could Benefit Others

### 1. PREFLIGHT (website-analysis only)

The compliance pre-flight (robots.txt, HARD_BLOCK, Cloudflare detection) is
website-specific but the **pattern** of pre-phase compliance/guard checks before
extraction is worth noting. repo-analysis handles this inline in VALIDATE
(archived check, rate limit check) rather than as a separate named phase.
Separating guard rails into a named PREFLIGHT phase in repo-analysis could
improve clarity.

### 2. WARM-UP (repo-synthesis only)

The pre-work orientation (scope estimate, candidate counts, time estimate) is
only in repo-synthesis. website-synthesis would benefit from the same pattern —
synthesis runs span multiple sites and users benefit from knowing the scope
before committing. The warm-up also injects prior session feedback, which is
useful for iterative improvement.

### 3. Phase 2.5 Verification Pass (repo-synthesis only)

A lightweight mid-synthesis verification that checks interpretive claims against
source evidence (T20 tally: confirmed, corrected, extended, new) does not exist
in website-synthesis. website-synthesis produces thematic claims that could also
benefit from a verification pass before presentation. Without it, fabricated or
poorly-supported themes may reach the output unchanged.

### 4. Coverage Audit Phase 6b (repo-analysis only)

The interactive coverage audit — scanning for referenced-but-unfollowed links,
unread internal artifacts, unqueried structured data — is unique to
repo-analysis. website-analysis does not have an equivalent, even though
websites can have dozens of linked pages that weren't visited. A coverage audit
would fit naturally after Value Map in website-analysis.

### 5. Phase 4b Content Evaluation (repo-analysis only)

Content Evaluation as a distinct phase that feeds Creator View is
repo-analysis-only. website-analysis has a value-map phase but doesn't separate
content evaluation into its own phase. The website version's knowledge
candidates emerge from the Creator View itself rather than from a distinct
upstream phase.

### 6. Phase 3 History Wave (repo-analysis only — Deep tier only)

Temporal analysis of commit velocity, contributor health, and churn hotspots is
unique to repo-analysis and makes sense there (git history). There is no
equivalent in website-analysis (sites can have publication date signals but
rarely have equivalent commit-level history).

---

## Source References

| File                                        | Key Lines | Content                         |
| ------------------------------------------- | --------- | ------------------------------- |
| `.claude/skills/website-analysis/SKILL.md`  | 80–92     | Process overview, phase list    |
| `.claude/skills/website-analysis/SKILL.md`  | 99        | Phase marker format             |
| `.claude/skills/website-analysis/SKILL.md`  | 168–201   | Phase 0/Standard/Deep breakdown |
| `.claude/skills/website-analysis/SKILL.md`  | 292–307   | Self-Audit (9 dimensions)       |
| `.claude/skills/repo-analysis/SKILL.md`     | 74–92     | Process overview, phase list    |
| `.claude/skills/repo-analysis/SKILL.md`     | 92        | Phase marker format             |
| `.claude/skills/repo-analysis/SKILL.md`     | 96–116    | Phase 0 (Quick Scan)            |
| `.claude/skills/repo-analysis/SKILL.md`     | 150–178   | Phase 2b (Deep Read)            |
| `.claude/skills/repo-analysis/SKILL.md`     | 188–239   | Phase 4 (Creator View)          |
| `.claude/skills/repo-analysis/SKILL.md`     | 241–305   | Phase 4b (Content Evaluation)   |
| `.claude/skills/repo-analysis/SKILL.md`     | 371–419   | Phase 6b (Coverage Audit)       |
| `.claude/skills/website-synthesis/SKILL.md` | 121–132   | Process overview                |
| `.claude/skills/website-synthesis/SKILL.md` | 132       | Phase marker format             |
| `.claude/skills/website-synthesis/SKILL.md` | 149–167   | Phase 1 (Load)                  |
| `.claude/skills/website-synthesis/SKILL.md` | 194–207   | Phase 3 (Signal Detection)      |
| `.claude/skills/website-synthesis/SKILL.md` | 209–224   | Phase 4 (Present + Follow-up)   |
| `.claude/skills/repo-synthesis/SKILL.md`    | 81–93     | Process overview                |
| `.claude/skills/repo-synthesis/SKILL.md`    | 93        | Phase marker format             |
| `.claude/skills/repo-synthesis/SKILL.md`    | 121–135   | WARM-UP phase                   |
| `.claude/skills/repo-synthesis/SKILL.md`    | 138–160   | Phase 1 (Load) with checkpoint  |
| `.claude/skills/repo-synthesis/SKILL.md`    | 232–239   | Phase 2.5 (Verification Pass)   |
| `.claude/skills/repo-synthesis/SKILL.md`    | 245–258   | Phase 3 (Self-Audit)            |
| `.claude/skills/repo-analysis/REFERENCE.md` | 1303–1311 | Agent allocation by phase       |

---

## Contradictions

None found. All four skills are internally consistent and cross-consistent where
they share conventions (phase marker format, MUST/SHOULD language, state file on
every phase). The differences observed are intentional design choices, not
conflicting conventions.

One tension worth noting: repo-synthesis has a formal Phase 3 Self-Audit (MUST,
6 dimensions) while website-synthesis only has an "Artifact Verification"
checklist (not a full self-audit). Both skills are v1.0 and were created on the
same date. This asymmetry may be intentional (website artifacts are simpler) or
may be a gap in website-synthesis.

---

## Gaps

1. **website-synthesis lacks a WARM-UP phase.** The pattern from repo-synthesis
   (scope estimate before work begins) was not ported. Not clear if intentional.

2. **website-synthesis lacks a Phase 2.5 Verification Pass.** Given that both
   synthesis skills produce thematic claims, the verification step in
   repo-synthesis would also strengthen website-synthesis outputs. Absence is
   unexplained.

3. **website-analysis lacks a Coverage Audit.** repo-analysis Phase 6b scans for
   unexplored content after analysis completes. There is no website-analysis
   equivalent despite websites having similar link-density characteristics.

4. **repo-analysis REFERENCE.md shows a different phase numbering than
   SKILL.md.** REFERENCE.md Section 15 and agent allocation (line 1303–1311)
   uses "Phase 4 (Aggregation)" and "Phase 5 (Value Map)" — which does not match
   SKILL.md's current numbering (Phase 4 = Creator View, Phase 5 = Engineer
   View, Phase 6 = Value Map). REFERENCE.md appears to be based on an older
   schema (pre-v4.0). The SKILL.md is authoritative; REFERENCE.md agent
   allocation section may be stale.

5. **repo-analysis has a GATE that can be bypassed by flags; website-analysis
   GATE can also be bypassed.** Both are consistent. But neither synthesis skill
   has an equivalent flag-bypassable gate — they always proceed if validation
   passes. This is likely intentional (synthesis has no Quick/Standard/Deep
   tiers) but worth noting.

---

## Serendipity

1. **repo-synthesis Phase 1 checkpoint is the only user-confirmation gate in a
   synthesis skill.** The checkpoint ("Loaded N repos... Proceed to synthesis?")
   creates a meaningful pause after artifact loading. This is architecturally
   interesting because it occurs mid-flow (end of Phase 1, not pre-phase). It
   allows the user to see the candidate count before committing to the full
   synthesis run.

2. **website-synthesis has source weighting (T1–T4, 3x to 0.5x) that
   repo-synthesis lacks.** website-synthesis assigns numeric tier weights (T1 =
   3.0x, T4 = 0.5x) and uses them to score convergence. repo-synthesis uses the
   same T1–T4 tier language in the Emergent Themes section but does not specify
   numeric weights or a convergence scoring formula. The two synthesis skills
   diverge on this mechanism despite being described as siblings.

3. **Phase 5 (Engineer View) in website-analysis is SHOULD, not MUST.** In
   repo-analysis, Phase 5 (Engineer View) is a full mandatory phase. In
   website-analysis, "Engineer View (SHOULD for Standard/Deep)" — it's
   recommended but not required. This is a meaningful difference in the strength
   of the two dual-lens architectures.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings are drawn directly from the four SKILL.md source files and relevant
REFERENCE.md sections. Every claim has a specific file:line citation.
