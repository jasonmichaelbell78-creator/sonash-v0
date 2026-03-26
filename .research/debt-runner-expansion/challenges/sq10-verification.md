# SQ10 Verification: AI-Driven Debt Discovery Layer

**Verifier role:** verification agent
**Date:** 2026-03-26
**Source finding:** `.research/debt-runner-expansion/findings/SQ10-discovery-layer.md`
**Files read:**
- `scripts/debt/extract-scattered-debt.js`
- `scripts/debt/verify-resolutions.js`
- `scripts/debt/extract-context-debt.js`
- `scripts/debt/extract-audit-reports.js`
- `.claude/skills/audit-comprehensive/SKILL.md`
- `.claude/teams/audit-review-team.md`
- `.claude/teams/research-plan-team.md`
- `.claude/agents/` (full directory listing + security-auditor, dependency-manager, performance-engineer)

---

## Claim 1: Current discovery mechanisms — `extract-scattered-debt.js`

**Stated claim:** Uses 5 keyword regex patterns across 8 directories.

**PARTIALLY VERIFIED — directory count is wrong.**

**Evidence:**

The KEYWORD_RE in the script is:
```
/\b(TODO|FIXME|HACK|XXX|WORKAROUND)(?=[:(])/gi
```
That is exactly **5 keywords** — the "5 patterns" claim is correct.

The SCAN_DIRS array contains:
```
"src", "app", "components", "lib", "hooks", "types", "scripts", ".claude/hooks", "functions/src"
```
That is **9 directories**, not 8. The finding states "8 directories" — this is wrong by one.

**Impact:** Minor factual error. The overall characterization of the script as a pure regex scanner is accurate. The false-positive filter, severity map (FIXME→S2, TODO→S3, HACK→S2, XXX→S2, WORKAROUND→S2), and MASTER_DEBT hash dedup are all correctly described. No AI or agent invocation exists anywhere in the script.

---

## Claim 2: `verify-resolutions.js` checks file existence and keyword proximity only

**VERIFIED.**

**Evidence:**

The script runs three mechanical steps:

- **Step 3 (verifyNewItems):** Calls `fileExists(fileRef)` and `getLineCount(fileRef)`. Promotes NEW items to VERIFIED if the file exists and the line count is sufficient. Zero AI involvement.
- **Step 4 (auditResolvedItems):** Calls `fileExists()` + `extractKeywords()` (stop-word filtered title words, up to 3) + `patternFoundNearLine()` (checks if keywords appear within ±10 lines). This is a string-includes heuristic, not judgment.
- **Step 5 (auditFalsePositiveItems):** Same logic as Step 4, applied to FALSE_POSITIVE status items.

The finding's claim that it "checks file existence and keyword proximity only" is accurate. The finding also correctly identifies the `classifyAuditItem()` function as the keyword-proximity heuristic. No agents, LLMs, or AI-driven analysis are present.

**Impact:** None. Claim is accurate and the described limitation (keyword proximity is not judgment) is real.

---

## Claim 3: `extract-context-debt.js` parses pre-existing agent output files

**VERIFIED.**

**Evidence:**

The script hardcodes two source files:
```javascript
const SOURCE_FILES = ["agent-research-results.md", "system-test-gap-analysis-pass2.md"];
```

It reads these from `.claude/state/` and extracts structured items matching:
- `Gap:` prefixed lines (via `tryExtractGap()`)
- `FINDING-*` headed sections (via `tryExtractFinding()`)

This is pure string parsing / regex extraction on markdown files that were already written by prior agent runs. The script itself does no discovery — it is an intake pipeline for content another agent has already produced. The finding's description of it as "triggered manually and depends on agents having already surfaced issues — it is an extraction tool, not a discovery tool" is accurate.

**Impact:** None. Claim is accurate.

---

## Claim 4: None of the discovery scripts use AI to find new debt

**VERIFIED.**

**Evidence:**

All four scripts examined (`extract-scattered-debt.js`, `verify-resolutions.js`, `extract-context-debt.js`, `extract-audit-reports.js`) use only:
- `fs.readFileSync`
- Regex / string matching
- JSON parsing
- Hash comparisons against MASTER_DEBT

None of the scripts invoke `Agent`, `Task`, `child_process.exec` to call an AI tool, or reference any MCP server. No API calls to any LLM service. The claim is factually correct.

**Impact:** None. This is the foundation of the entire SQ10 argument — it holds.

---

## Claim 5: `audit-comprehensive` Stage 3.5 exists and can be reused for delta synthesis

**VERIFIED — with a precision note.**

**Evidence:**

SKILL.md (v3.1, 9-Domain Coverage) confirms the stage exists. The execution flow in the skill reads:

```
Stage 3.5: MASTER_DEBT Deduplication (MANDATORY)
  - Cross-reference findings against MASTER_DEBT.jsonl
  - Skip already-tracked items, flag possibly-related
  - Output: DEDUP_VS_MASTER_DEBT.md
```

The dedup process classifies each finding as:
- **Already Tracked** — confident match → skip intake
- **New Finding** — no matching DEBT entry → proceed to review
- **Possibly Related** — partial overlap → flag for manual review

Output format is a markdown table in `${AUDIT_DIR}/DEDUP_VS_MASTER_DEBT.md`.

The finding's serendipity note that this is "exactly the delta synthesis step needed for the discovery layer" is accurate in function. One precision note: Stage 3.5 performs semantic/title matching done by an AI agent reading MASTER_DEBT — it is not a mechanical hash comparison. This actually strengthens the reusability claim (it already does AI-driven dedup), but the finding does not explicitly state this distinction.

**Impact:** The reusability claim is sound. The finding correctly identifies Stage 3.5 as the analog for Step 6 (delta synthesis) in the proposed workflow.

---

## Claim 6: Audit-comprehensive uses staged subagent waves — "4+3+2+1"

**PARTIALLY VERIFIED — agent count is right, stage count is mischaracterized.**

**Evidence:**

The SKILL.md execution flow has:
- Stage 1: 4 agents (audit-code, audit-security, audit-performance, audit-refactoring)
- Stage 2: 3 agents (audit-documentation, audit-process, audit-engineering-productivity)
- Stage 2.5: 2 agents (audit-enhancements, audit-ai-optimization)
- Stage 3: 1 agent (audit-aggregator)
- Stage 3.5: MASTER_DEBT dedup (described as a step, no explicit agent count)

The finding describes this as "4+3+2+1 stages" and "4 stages" — the SKILL.md header also says "4 stages with 4+3+2+1 agent configuration." However, the actual execution flow has 5 named stages (1, 2, 2.5, 3, 3.5). The "4 stages" count in the skill's own header appears to count 2.5 and 3.5 as substages, not full stages.

The discovery workflow design in Section 6 of the finding proposes waves of 4+4+2+3+1 (Steps 2-6), which is structurally similar but not identical to the 4+3+2+1 pattern. The claim that it "maps to discovery" is an inference, not a direct reuse.

**Impact:** Minor. The agent concurrency pattern (max 4 parallel, write to disk, return only completion signal) is correctly described and accurately sourced from the skill.

---

## Claim 7: Team patterns (audit-review-team, research-plan-team) are NOT suitable for discovery

**VERIFIED.**

**Evidence:**

`audit-review-team.md` describes a 2-member sequential reviewer→fixer pipeline. The team doc itself states: "The reviewer-fixer pipeline is sequential, not parallel -- adding a third member would idle-wait most of the time." Token cost is ~3x solo. Maximum 5-6 tasks per teammate. This maps poorly to a broad parallel discovery task with 9-12 agents.

`research-plan-team.md` describes a 3-member researcher→planner→verifier pipeline. The researcher role does map conceptually to scanner agents. However, the planner and verifier roles are not needed in a debt discovery context — the planner converts research into actionable decisions, which is done by the delta synthesis step, not by a team member. Token cost is ~4x solo.

Both team definitions include the constraint "No nested teams" (Claude Code limitation: one team per session). Running 9-12 discovery agents as a team is not architecturally possible.

The finding's claim that these patterns are "NOT suitable" for discovery is correct for the stated reasons (sequential bottlenecks, wrong cognitive model, one-team limit).

**Impact:** None. Claim is accurate and well-reasoned.

---

## Claim 8: 9 agent types identified — feasibility and overlap check

**Assessment per proposed agent type:**

| Proposed Agent | Existing Analog | Overlap Risk | Scope Feasible? |
|---|---|---|---|
| `code-scanner` | None as a standalone agent | Low — `audit-code` is a skill, not agent | Yes, single-scope scan |
| `pattern-checker` | None | Low | Yes |
| `dependency-auditor` | `dependency-manager.md` (agent exists) | HIGH — direct overlap | Redundant; use existing agent |
| `security-scanner` | `security-auditor.md` (agent exists) | HIGH — direct overlap | Redundant; use existing agent |
| `complexity-scanner` | `performance-engineer.md` (partial) | Medium | Yes, focused enough |
| `test-coverage-auditor` | `test-engineer.md` (agent exists, not checked in detail) | Medium | Yes |
| `schema-drift-checker` | None | Low | Yes, if scope is narrow |
| `integration-verifier` | None | Low | Yes — novel and well-scoped |
| `doc-coverage-scanner` | `documentation-expert.md` (agent exists) | Medium | Overlap risk; scope it tightly |

**Key issue:** The finding presents all 9 as new agent types to be created. At minimum 2 of the 9 (`dependency-auditor`, `security-scanner`) directly duplicate existing named agents (`dependency-manager`, `security-auditor`). The existing agents have SoNash-specific context baked in — creating parallel "discovery" versions would produce two sources of truth.

A more accurate framing: 4-5 of the 9 are genuinely new (code-scanner, complexity-scanner, schema-drift-checker, integration-verifier, pattern-checker). The other 4-5 should be the existing agents invoked in discovery mode, not new agents.

**Overlap between proposed types:** The finding acknowledges that `code-scanner` and `security-scanner` may both read `auth.ts`, with dedup handled at synthesis. This is structurally acceptable. However `complexity-scanner` and `code-scanner` have significant scope overlap — cyclomatic complexity is often identified alongside code quality issues.

**Impact:** MEDIUM. The finding's 9-agent framing is directionally correct but should not be treated as 9 new agent files to create. The existing `dependency-manager` and `security-auditor` agents should be reused/adapted. This affects the implementation plan but not the architectural validity.

---

## Claim 9: Full debt refresh workflow — 8-step design with one user gate

**PARTIALLY VERIFIED — design is architecturally sound but the single gate assumption is optimistic.**

### Step-by-step script feasibility check

**Step 1 (context-loader agent):** No current script provides this. The finding correctly identifies it as new. `docs/audits/` exists as the input source. Feasible as a read-only agent.

**Step 2 (Wave 1 — 4 parallel agents):** No current scripts back these agents. All four are new agent invocations. Feasible within the 4-concurrent limit. However, `security-scanner` here duplicates `audit-security` skill — the finding doesn't address this redundancy.

**Step 3 (Wave 2 — 4 parallel agents):** `check-cyclomatic-cc.js` exists for complexity, but it produces metrics, not TDMS JSONL. A `complexity-scanner` agent would need to read that output and produce debt items. Partially supported.

**Step 4 (External verification — 2 agents):** `sync-sonarcloud.js` exists and is callable. A `pr-debt-extractor` agent has no existing script analog — this is fully new.

**Step 5 (Existing debt verification — 3 parallel agents):** `verify-resolutions.js` exists but is described as being replaced, not called. The `integration-verifier` agent replaces its heuristic with judgment. No script exists; this is entirely new.

**Step 6 (Delta synthesis):** No existing script does this. The `audit-aggregator` agent in audit-comprehensive is the closest analog. `audit-comprehensive` Stage 3.5 produces DEDUP_VS_MASTER_DEBT.md but does not produce a delta of NEW vs RESOLVED vs FALSE_POSITIVE vs UPGRADED in one pass.

**Step 7 (User review gate):** The finding presents batches of 5 across 4 sections (S0/S1, resolved candidates, S2/S3, severity upgrades). This is UI/interaction design, not backed by an existing script. For a full refresh adding 50-100 items, "batches of 5" across 4 sections is 20-40 user interactions. This is a significant UX burden.

**Step 8 (Apply approved changes):** `intake-audit.js` and `resolve-bulk.js` exist and are callable. This is the strongest step — existing write paths work.

### Single user gate adequacy

The finding states "Step 7 is the only human gate — everything before is automated discovery." This is architecturally clean but functionally risky:

- A full refresh could identify 50+ new items and 20+ resolution candidates simultaneously.
- The user has no visibility into what the agents are doing across the 45+ minute automated phase.
- If an agent misclassifies items (e.g., marks genuinely active debt as RESOLVED), the user's only recourse is the review gate — they must catch errors in review rather than having been able to correct agent behavior mid-run.
- The finding's own Section 9 (agent spawn prompt) gives agents significant latitude ("Are these items still real?") without checkpoints.

A pre-dispatch confirmation gate (before Step 2) is mentioned only as a "Discovery mode triggers a confirmation gate" in Section 8 — this is a separate gate the finding acknowledges. So there are actually two gates: one before dispatch and one at review. The claim "Step 7 is the only human checkpoint" in Section 6's key design decisions is imprecise — it should say "only human checkpoint during execution."

**Impact:** MEDIUM. The single-gate design is viable for small refreshes but becomes a user burden at scale. The finding does not quantify expected item volume or interaction count. This is a design gap, not an error.

---

## Summary Table

| Claim | Verdict | Severity |
|---|---|---|
| 5 keyword patterns in extract-scattered-debt.js | VERIFIED | — |
| 8 directories scanned | WRONG (actual: 9) | Low |
| verify-resolutions.js uses file-exists + keyword proximity | VERIFIED | — |
| No AI invocation in any discovery script | VERIFIED | — |
| extract-context-debt.js parses pre-existing agent output files | VERIFIED | — |
| audit-comprehensive Stage 3.5 exists | VERIFIED | — |
| Stage 3.5 format matches delta synthesis needs | VERIFIED | — |
| Wave structure "4+3+2+1" | PARTIALLY VERIFIED (agent counts correct, stage count varies) | Low |
| Teams not suitable for discovery | VERIFIED | — |
| 9 agent types identified | PARTIALLY VERIFIED (2-4 overlap existing agents) | Medium |
| dependency-auditor is a new type | WRONG (dependency-manager agent already exists) | Medium |
| security-scanner is a new type | WRONG (security-auditor agent already exists) | Medium |
| 8-step workflow scripts are all capable | PARTIALLY VERIFIED (Steps 1,5,6 are fully new; Step 8 is solid) | Medium |
| One user gate is sufficient | PARTIALLY VERIFIED (two gates exist, single-gate claim is imprecise; scale risk is real) | Medium |

---

## Impact on the Research

**What holds:** The core architectural argument is sound. Existing discovery is mechanical, audit skills use AI but are not wired to debt-runner, the staged parallel wave pattern is the right coordination model, and Stage 3.5 provides a reusable dedup format. These are the load-bearing claims of SQ10 and they are all verified.

**What needs correction before implementation planning:**

1. **Directory count:** 9 scan directories, not 8. Minor but should be accurate in any implementation ticket.
2. **Overlap with existing agents:** `dependency-manager` and `security-auditor` agents already exist with SoNash-specific context. The implementation plan should specify whether these are reused (preferred) or new discovery variants created (duplication risk). The finding treats all 9 agent types as net-new, which is incorrect.
3. **Single user gate framing:** The design has two gates (pre-dispatch confirmation + review). The "only one human checkpoint" claim in Section 6 is imprecise and should be corrected before presenting this design to the user.
4. **Scale of review burden:** The finding does not quantify how many user interactions Step 7 would require for a realistic full refresh. This should be estimated (based on MASTER_DEBT item count and expected discovery yield) before the workflow is presented as production-ready.
5. **"pr-debt-extractor" agent (Step 4, Agent J):** Labeled as part of the 9 agent types table but is actually a 10th agent type — it does not appear in the Finding 4 table. The workflow section silently adds it.
