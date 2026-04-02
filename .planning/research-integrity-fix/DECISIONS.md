# DECISIONS: Research Integrity Fix

**Deep-plan topic:** Fix deep-research pipeline integrity + commit all research
artifacts + remediate existing outputs
**Date:** 2026-04-02
**Decisions:** 21

---

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Gitignore strategy for findings/challenges | Remove gitignore rules — commit all | 3.8MB is negligible. Data loss risk from worktrees/clones/pulls outweighs any "session-specific" benefit. |
| 2 | Source ID scheme standardization | Accept inconsistency for existing, standardize S-codes for new | Retroactive remapping of 4 research outputs is high effort, low value. Plans already built. |
| 3 | Scope of metadata remediation | Full remediation — metadata, claims.jsonl, sources.jsonl for all 8 outputs | User wants complete integrity, not partial fixes. research-discovery-std excluded (pre-standard, Decision #7). |
| 4 | Self-audit implementation | Script + final-synthesizer integration | `scripts/research/validate-research.js` for manual/CI use. Same checks embedded in final-synthesizer agent for creation-time validation. |
| 5 | Claims.jsonl post-pipeline update | Final synthesizer is sole writer | Single writer reduces race conditions. Final synthesizer already reads everything — it produces authoritative claims.jsonl at pipeline end. |
| 6 | Commit strategy for 172 existing files | Single commit — gitignore change + all files | Atomic, easy to revert. Metadata remediation is separate commit(s). |
| 7 | research-discovery-standard remediation | Leave as-is with AUDIT.md | Pre-standard pipeline, no JSONL files. Extracting structured JSONL from narrative is error-prone. Plan references sections directly. |
| 8 | Plan verification depth | Audit first, then present corrections for approval | Read-only audit of each plan, present findings, get approval before modifying plan files. |
| 9 | Plan discrepancy threshold | Fix everything — counts, confidence, any mismatch | User wants complete accuracy. No cosmetic vs material distinction. |
| 10 | Validation script output format | JSONL + console summary | Matches existing patterns (alerts, ecosystem-health). Machine-parseable for TDMS/dashboard. |
| 11 | Pipeline integration point | Final-synthesizer + manual mode | Automatic at pipeline end catches issues at creation time. Manual `npm run research:validate` for auditing. No pre-commit hook (too aggressive). |
| 12 | Plan inventory | 6 plans to audit | custom-agents, dev-dashboard, repo-analysis-skill, plan-orchestration, research-discovery-standard, github-health-skill. |
| 13 | Implementation verification approach | Functional first, then code audit | If it works, stale research is documentation. But still audit for wrong assumptions. |
| 14 | Stale claim in implementation | Case-by-case, no deferral | Fix if small, escalate if large. Deferral is not an option — fix now or file as bug. |
| 15 | Repo-analysis skill (just committed) | Verify against corrected research, fix as follow-up commit | Skill is on planning-33026, not merged. Normal review window. Corrections go as follow-up commit before PR. |
| 16 | Plan-orchestration partial impl | Light-touch verify Waves 0-1b | Research was mostly clean. Quick check that minor count issues didn't propagate. |
| 17 | Execution branch | planning-33026 in main repo | User wraps up existing instance first, then implements from feature branch. |
| 18 | Worktree artifacts | Commit everything created today | Plan artifacts, updated todos, audit state — all committed from worktree. |
| 19 | Validation script name | `validate-research.js` in `scripts/research/` | Short, clear, matches project conventions. |
| 20 | Validation checks (8) | All 8 approved | Source traceability, claim coverage, findings inventory, confidence reconciliation, post-pipeline delta, bidirectional claim-report, source freshness, verdict persistence. |
| 21 | Execution order | 15-step sequence with two additions | Pre-commit formatting pass on findings/challenges before step 3. Home locale sync step at the end for artifacts only on home machine. |
