# Documentation Audit — Agent Prompts & Templates

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Reference file containing detailed agent prompts for each stage of the
documentation audit. Read this file when launching agents.

---

## Stage 1: Inventory & Baseline (3 Parallel Agents)

### Agent 1A: Document Inventory

```
Count all .md files by directory and tier:
- Root level: ROADMAP.md, README.md, etc.
- docs/: by subdirectory
- .claude/: skills, plans

Extract metadata from each:
- Version number (if present)
- Last Updated date (if present)
- Status field (if present)
- Word count

Output: ${AUDIT_DIR}/stage-1-inventory.md
Format: Markdown summary with counts and file list

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 1A wrote inventory to [path]`
- Do NOT return findings content in your response
```

### Agent 1B: Baseline Metrics

```bash
# Run these commands and capture output:
npm run docs:check > ${AUDIT_DIR}/baseline-docs-check.txt 2>&1
npm run docs:sync-check > ${AUDIT_DIR}/baseline-sync-check.txt 2>&1
npm run format:check -- docs/ > ${AUDIT_DIR}/baseline-format-check.txt 2>&1

# Check DOCUMENTATION_INDEX.md for orphans
grep -c "orphan" docs/DOCUMENTATION_INDEX.md || echo "0"
```

Output: `${AUDIT_DIR}/stage-1-baselines.md`

**CRITICAL RETURN PROTOCOL:** Return ONLY:
`COMPLETE: 1B wrote baselines to [path]`

### Agent 1C: Link Extraction

```
Extract from all .md files:
1. Internal links: [text](path.md) -> list with source file:line
2. External URLs: https://... -> list with source file:line
3. Anchor links: #section -> list with source file:line

Output: ${AUDIT_DIR}/stage-1-links.json
Schema:
{
  "internal": [{"source": "file.md", "line": 1, "target": "other.md", "text": "..."}],
  "external": [{"source": "file.md", "line": 1, "url": "https://...", "text": "..."}],
  "anchors": [{"source": "file.md", "line": 1, "anchor": "#section", "text": "..."}]
}

**CRITICAL RETURN PROTOCOL:** Return ONLY: `COMPLETE: 1C wrote N links to [path]`
```

---

## Stage 2: Link Validation (4 Parallel Agents)

### Agent 2A: Internal Link Checker

Verify internal .md links resolve. Check target file exists, anchor headings,
circular references. Output JSONL to
`${AUDIT_DIR}/stage-2-internal-links.jsonl`. Return ONLY:
`COMPLETE: 2A wrote N findings to [path]`

### Agent 2B: External URL Checker

```bash
npm run docs:external-links -- --output ${AUDIT_DIR}/stage-2-external-links.jsonl
```

Or manually check with 10s timeout, rate limiting, cache. Flag 404, 403, 5xx.
Return ONLY: `COMPLETE: 2B wrote N findings to [path]`

### Agent 2C: Cross-Reference Validator

Verify: ROADMAP item refs, PR/Issue refs, SESSION_CONTEXT refs, skill/hook path
refs. Output `${AUDIT_DIR}/stage-2-cross-refs.jsonl`. Return ONLY:
`COMPLETE: 2C wrote N findings to [path]`

### Agent 2D: Orphan & Connectivity

From links JSON: find docs with zero inbound links, only broken outbound links,
isolated clusters. Exclude README.md, root canonical, archives. Output
`${AUDIT_DIR}/stage-2-orphans.jsonl`. Return ONLY:
`COMPLETE: 2D wrote N findings to [path]`

---

## Stage 3: Content Quality (4 Parallel Agents)

### Agent 3A: Accuracy Checker

```bash
node scripts/check-content-accuracy.js --output ${AUDIT_DIR}/stage-3-accuracy.jsonl
```

Checks: version numbers vs package.json, file paths exist, npm scripts valid,
code snippet syntax. Return ONLY: `COMPLETE: 3A wrote N findings to [path]`

### Agent 3B: Completeness Checker

Check required sections per tier (Tier 1: Purpose/Version History; Tier 2: + AI
Instructions; Tier 3+: + Status). Flag TODO/TBD/FIXME, empty sections, stubs
(<100 words). Output `${AUDIT_DIR}/stage-3-completeness.jsonl`. Return ONLY:
`COMPLETE: 3B wrote N findings to [path]`

### Agent 3C: Coherence Checker

Check terminology consistency ("skill" vs "command", "agent" vs "subagent"),
duplicate content (exact >50 words and fuzzy 80%+), contradictions. Output
`${AUDIT_DIR}/stage-3-coherence.jsonl`. Return ONLY:
`COMPLETE: 3C wrote N findings to [path]`

### Agent 3D: Freshness Checker

```bash
npm run docs:placement -- --output ${AUDIT_DIR}/stage-3-freshness.jsonl
```

Staleness thresholds: Tier 1 >60d, Tier 2 >90d, Tier 3+ >120d. Also check
outdated versions, deprecated terminology. Return ONLY:
`COMPLETE: 3D wrote N findings to [path]`

---

## Stage 4: Format & Structure (3 Parallel Agents)

### Agent 4A: Markdown Lint

```bash
npm run docs:lint > ${AUDIT_DIR}/markdownlint-raw.txt 2>&1
```

Convert to JSONL in `${AUDIT_DIR}/stage-4-markdownlint.jsonl`. Return ONLY:
`COMPLETE: 4A wrote N findings to [path]`

### Agent 4B: Prettier Compliance

```bash
npm run format:check -- docs/ > ${AUDIT_DIR}/prettier-raw.txt 2>&1
```

Convert to JSONL in `${AUDIT_DIR}/stage-4-prettier.jsonl`. Return ONLY:
`COMPLETE: 4B wrote N findings to [path]`

### Agent 4C: Structure Standards

Check: frontmatter, required headers per tier, version history format, table
formatting, code block language tags, heading uniqueness. Output
`${AUDIT_DIR}/stage-4-structure.jsonl`. Return ONLY:
`COMPLETE: 4C wrote N findings to [path]`

---

## Stage 5: Placement & Lifecycle (4 Agents — 3 parallel + 1 sequential)

### Agent 5A: Location Validator

Verify placement rules: Plans->docs/plans/, Archives->docs/archive/,
Templates->docs/templates/, Audits->docs/audits/, Tier 1->root, Tier 2->docs/.
Output `${AUDIT_DIR}/stage-5-location.jsonl`. Return ONLY:
`COMPLETE: 5A wrote N findings to [path]`

### Agent 5B: Archive Candidate Finder (Surface-Level)

Quick scan: completed plans not archived, session handoffs >30d, old audit
results >60d, plans not in current ROADMAP.md. Output
`${AUDIT_DIR}/stage-5-archive-candidates-raw.jsonl`. Return ONLY:
`COMPLETE: 5B wrote N findings to [path]`

### Agent 5C: Cleanup Candidate Finder

Find: exact duplicates, near-empty files (<50 words), old drafts >60d,
temp/test/scratch files, merge candidates. Output
`${AUDIT_DIR}/stage-5-cleanup-candidates.jsonl`. Return ONLY:
`COMPLETE: 5C wrote N findings to [path]`

### Agent 5D: Deep Lifecycle Analysis (Runs After 5B)

For each 5B candidate: read content, assess purpose/status (met, overtaken,
deprecated), check if consumed (findings in MASTER_DEBT? outcomes documented?).
Recommend: ARCHIVE|DELETE|KEEP|MERGE_INTO. Output
`${AUDIT_DIR}/stage-5-lifecycle-analysis.jsonl`. Return ONLY:
`COMPLETE: 5D wrote N findings to [path]`

---

## JSONL Schema (All Stages)

All findings use this base schema:

```json
{
  "category": "documentation",
  "title": "...",
  "fingerprint": "documentation::file.md::issue-type",
  "severity": "S1|S2|S3",
  "effort": "E0|E1|E2",
  "confidence": 0-100,
  "files": ["file.md:123"],
  "why_it_matters": "...",
  "suggested_fix": "...",
  "acceptance_tests": ["..."]
}
```

Stage 5D extends with: `purpose`, `status_reason`, `consumed_by`,
`recommendation`.

---

## Interactive Review Presentation Format

```
### DEBT-XXXX: [Title]
**Severity:** S_ | **Effort:** E_ | **Confidence:** _%
**Current:** [What exists now]
**Suggested Fix:** [Concrete remediation]
**Acceptance Tests:** [How to verify]
**Counter-argument:** [Why NOT to do this]
**Recommendation:** ACCEPT/DECLINE/DEFER — [Reasoning]
```

Present in batches of 3-5, grouped by severity. Track decisions in
`${AUDIT_DIR}/REVIEW_DECISIONS.md`.

---

## Final Report Template

```markdown
# Documentation Audit Report - [DATE]

## Executive Summary

- **Total findings:** X
- **By severity:** S0: X, S1: X, S2: X, S3: X
- **By category:** Links: X, Content: X, Format: X, Lifecycle: X
- **False positives filtered:** X

## Baseline Comparison

| Metric               | Before | After Fixes |
| -------------------- | ------ | ----------- |
| docs:check errors    | X      | -           |
| docs:sync issues     | X      | -           |
| Orphaned docs        | X      | -           |
| Stale docs (>90 day) | X      | -           |

## Top 20 Priority Items

| #   | Severity | File | Issue | Effort |
| --- | -------- | ---- | ----- | ------ |

## Stage-by-Stage Breakdown

### Stage 2-5 summaries...

## Action Plan

### Immediate Fixes / Archive Queue / Cleanup Queue

## Recommendations
```
