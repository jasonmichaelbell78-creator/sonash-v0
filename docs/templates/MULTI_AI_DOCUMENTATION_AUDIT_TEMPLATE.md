# [Project Name] Multi-AI Documentation Audit Plan

**Document Version:** 2.0 **Created:** 2026-01-05 **Last Updated:** 2026-02-02
**Status:** PENDING | IN_PROGRESS | COMPLETE **Overall Completion:** 0%

---

## Purpose

This document serves as the **execution plan** for running a multi-AI
documentation quality audit on [Project Name]. Use this template when:

- Documentation inconsistencies have accumulated
- Cross-references may be broken or stale
- Documentation coverage gaps suspected
- After major refactoring or restructuring
- Quarterly documentation health check
- Before major release or documentation publication

**Audit Stages (6 Stages with Parallel Agents):**

| Stage | Name                  | Agents | Focus                                 |
| ----- | --------------------- | ------ | ------------------------------------- |
| 1     | Inventory & Baseline  | 3      | Document catalog, metrics, link graph |
| 2     | Link Validation       | 4      | Internal, external, cross-ref, orphan |
| 3     | Content Quality       | 4      | Accuracy, completeness, coherence     |
| 4     | Format & Structure    | 3      | Lint, prettier, structure standards   |
| 5     | Placement & Lifecycle | 4      | Location, archive, cleanup candidates |
| 6     | Synthesis             | 1      | Merge, dedupe, prioritize, report     |

**Expected Output:** JSONL findings with TDMS integration, prioritized
remediation plan, and actionable fix commands.

---

## ⚠️ Execution Mode Selection

### Parallel Mode (Recommended)

For AI models that support **parallel agent execution** (e.g., Claude Code with
Task tool, multi-agent orchestrators):

- Launch agents within each stage in parallel
- Wait for stage completion before proceeding
- Maximum efficiency: 5 parallel stages + 1 sequential synthesis

### Sequential Mode (Fallback)

For AI models that **cannot run parallel agents** (e.g., web interfaces, single
API calls, most chat-based models):

- Run each agent sequentially within each stage
- Still follow the 6-stage structure
- Use the new npm scripts to automate checks where possible:

  ```bash
  # Stage 2 automation
  npm run docs:external-links  # External URL checker

  # Stage 3 automation
  npm run docs:accuracy        # Version, path, npm script validation

  # Stage 4 automation
  npm run docs:lint            # Markdownlint
  npm run format:check         # Prettier

  # Stage 5 automation
  npm run docs:placement       # Location and staleness checking
  ```

- Estimated time: 2-3x longer than parallel mode

### Multi-AI Mode (This Template)

For distributed execution across multiple AI models:

- Assign different **models** to different **stages** (not agents within stages)
- Each model handles all agents within their assigned stage(s)
- Best for maximum validation coverage with consensus

---

## Status Dashboard

| Step   | Description                           | Status  | Completion |
| ------ | ------------------------------------- | ------- | ---------- |
| Step 1 | Prepare audit context & assign models | PENDING | 0%         |
| Step 2 | Stage 1: Inventory & Baseline         | PENDING | 0%         |
| Step 3 | Stage 2: Link Validation              | PENDING | 0%         |
| Step 4 | Stage 3: Content Quality              | PENDING | 0%         |
| Step 5 | Stage 4: Format & Structure           | PENDING | 0%         |
| Step 6 | Stage 5: Placement & Lifecycle        | PENDING | 0%         |
| Step 7 | Stage 6: Synthesis & aggregation      | PENDING | 0%         |
| Step 8 | Create canonical findings doc         | PENDING | 0%         |
| Step 9 | Generate remediation plan             | PENDING | 0%         |

**Overall Progress:** 0/9 steps complete

---

## Audit Context

### Repository Information

```
Repository URL: [GITHUB_REPO_URL]
Branch: [BRANCH_NAME or "main"]
Commit: [COMMIT_SHA or "latest"]
Last Documentation Audit: [YYYY-MM-DD or "Never"]
```

### Documentation Structure

```
Documentation Tiers (if applicable):
- Tier 1: [Root-level canonical docs, e.g., README.md, ROADMAP.md]
- Tier 2: [Foundation docs, e.g., ARCHITECTURE.md, DEVELOPMENT.md]
- Tier 3: [Planning docs, e.g., docs/plans/]
- Tier 4: [Reference docs, e.g., docs/templates/, docs/guides/]
- Tier 5: [Archive, e.g., docs/archive/]

Documentation Directories:
- docs/: [Purpose]
  - docs/guides/: [Purpose]
  - docs/templates/: [Purpose]
  - docs/audits/: [Purpose]
  - docs/archive/: [Purpose]
```

### Staleness Thresholds (Tier-Specific)

| Tier    | Name       | Stale After | Rationale                |
| ------- | ---------- | ----------- | ------------------------ |
| Tier 1  | Canonical  | 60 days     | High-traffic, high-value |
| Tier 2  | Foundation | 90 days     | Core reference material  |
| Tier 3+ | Other      | 120 days    | Lower change frequency   |

### Scope

```
Include: [directories, e.g., docs/, README.md, ARCHITECTURE.md, *.md in root]
Secondary: [optional, e.g., .claude/skills/*.md]
Exclude: [directories, e.g., node_modules/, docs/archive/]
```

### Known Documentation Issues

[Document any known issues that prompted this audit:]

- [Issue 1]
- [Issue 2]
- [Issue 3]

---

## AI Models to Use

**Recommended configuration (3-4 models for consensus):**

| Model             | Parallel Agents | Assign to Stages | Strengths                           |
| ----------------- | --------------- | ---------------- | ----------------------------------- |
| Claude Code       | YES             | 1-5 (parallel)   | Full parallel execution, automation |
| Claude Opus 4.5   | NO (sequential) | 3, 6             | Deep analysis, coherence checking   |
| Claude Sonnet 4.5 | NO (sequential) | 2, 4             | Cost-effective, pattern detection   |
| GPT-5.2-Codex     | LIMITED         | 4, 5             | Structure validation                |
| Gemini 3 Pro      | LIMITED         | 2, 3             | Freshness, alternative perspective  |

**Selection criteria:**

- At least 1 model with parallel agent capability for maximum coverage
- At least 1 model with `run_commands=yes` for script-based validation
- Total 3-4 models recommended for good consensus

---

## Documentation Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are a technical documentation specialist performing a comprehensive 6-stage
documentation quality audit using parallel agents (or sequential fallback).

REPO

[GITHUB_REPO_URL]

DOCUMENTATION STRUCTURE

- Tier system: [e.g., 5-tier hierarchy (Tier 1-2: Root-level, Tier 3-5: docs/
  subdirectories)]
- Main directories:
  - [e.g., docs/]
  - [e.g., docs/templates/]
  - [e.g., docs/audits/]
  - [e.g., docs/archive/]
  - [e.g., docs/guides/]
- Documentation standards: [e.g., docs/DOCUMENTATION_STANDARDS.md (vX.Y)]

STALENESS THRESHOLDS

- Tier 1 (Canonical): >60 days = stale
- Tier 2 (Foundation): >90 days = stale
- Tier 3+ (Planning/Reference/Guides): >120 days = stale

PRE-REVIEW CONTEXT (REQUIRED READING)

Before beginning documentation analysis, review these project-specific
resources:

1. **AI Learnings** (claude.md Section 4): Documentation patterns and lessons
   from past reviews
2. **Pattern History** (docs/agent_docs/CODE_PATTERNS.md): Known documentation
   issues
3. **Documentation Standards** (if available): DOCUMENTATION_STANDARDS.md or
   similar
4. **Tier System** (if applicable): Understand the documentation hierarchy
5. **Recent Changes**: Git log for documentation file changes

AUTOMATION SCRIPTS (run if available)

These npm scripts provide automated checking:

- npm run docs:external-links # Check external URLs (HTTP HEAD, 10s timeout)
- npm run docs:accuracy # Version/path/npm script validation
- npm run docs:lint # Markdownlint checks
- npm run format:check # Prettier formatting
- npm run docs:placement # Location and staleness checks

SCOPE

Include: [directories] Secondary: [optional directories] Exclude: [excluded
directories]

EXECUTION MODE

State your execution mode first:

- PARALLEL MODE: I can run multiple agents concurrently
- SEQUENTIAL MODE: I will run agents one at a time within each stage

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

EXECUTION_MODE: <PARALLEL|SEQUENTIAL> CAPABILITIES: browse_files=<yes/no>,
run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:

- Run in "LIMITED MODE": Provide general recommendations only
- Note: Link validation requires repo access
```

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A documentation finding is CONFIRMED only if it includes:

- at least one concrete file path AND
- at least one specific issue (broken link, missing section, outdated info)

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

AUDIT STAGES (use ONLY these 6 stages)

1. Inventory & Baseline (catalog, metrics, link extraction)
2. Link Validation (internal, external, cross-ref, orphans)
3. Content Quality (accuracy, completeness, coherence, freshness)
4. Format & Structure (markdown lint, prettier, structure standards)
5. Placement & Lifecycle (location, archive candidates, cleanup)
6. Synthesis (merge, dedupe, prioritize, report)

JSONL OUTPUT REQUIREMENTS

All findings must include these fields for TDMS integration:

- id: Category-specific prefix (DOC-LINK-_, DOC-CONTENT-_, DOC-FORMAT-_,
  DOC-LIFECYCLE-_)
- category: "documentation"
- severity: S0|S1|S2|S3
- effort: E0|E1|E2|E3
- confidence: HIGH|MEDIUM|LOW
- file: relative path
- line: line number (use 1 if file-wide)
```

### Part 3: Stage-by-Stage Audit Instructions

```markdown
STAGE 1: INVENTORY & BASELINE (3 agents)

Run these in parallel (or sequentially if limited):

Agent 1A - Document Inventory:

- Count all .md files by directory/tier
- Extract metadata (version, last updated, status)
- Build document catalog with word counts
- Output: stage-1-inventory.md

Agent 1B - Baseline Metrics:

- Run npm run docs:check (or equivalent)
- Run npm run docs:sync-check (or equivalent)
- Run npm run format:check on docs/
- Count orphaned docs
- Output: stage-1-baselines.md

Agent 1C - Link Extraction:

- Extract all internal links [text](path.md)
- Extract all external URLs https://...
- Extract all anchor links #section
- Build link graph for later stages
- Output: stage-1-links.json

Stage 1 Checkpoint: "Stage 1 complete - X docs, Y internal links, Z external
URLs"

---

STAGE 2: LINK VALIDATION (4 agents)

Agent 2A - Internal Link Checker:

- Verify all .md links resolve
- Check anchor links match headings
- Detect circular references
- Output: stage-2-internal-links.jsonl

Agent 2B - External URL Checker:

- HTTP HEAD requests (10s timeout)
- Rate limit: 100ms between same domain
- Flag: 404, 403, 5xx, timeouts, redirects
- Use: npm run docs:external-links (if available)
- Output: stage-2-external-links.jsonl

Agent 2C - Cross-Reference Validator:

- ROADMAP item references exist?
- PR/Issue references valid format?
- SESSION_CONTEXT references valid?
- Skill/hook path references exist?
- Output: stage-2-cross-refs.jsonl

Agent 2D - Orphan & Connectivity:

- Docs with zero inbound links
- Docs with only broken outbound links
- Isolated document clusters
- Output: stage-2-orphans.jsonl

Stage 2 Checkpoint: "Stage 2 complete - X link issues found"

---

STAGE 3: CONTENT QUALITY (4 agents)

Agent 3A - Accuracy Checker:

- Version numbers match package.json
- File paths mentioned exist
- npm scripts referenced exist
- Code snippet syntax valid (basic)
- Use: npm run docs:accuracy (if available)
- Output: stage-3-accuracy.jsonl

Agent 3B - Completeness Checker:

- Required sections per tier present
- No TODO/TBD/FIXME placeholders
- No empty sections
- No stub documents (<100 words)
- Output: stage-3-completeness.jsonl

Agent 3C - Coherence Checker:

- Terminology consistency ("skill" vs "command")
- Duplicate content detection:
  - Exact match: identical blocks >50 words
  - Fuzzy match: 80%+ similarity
- Contradictory information
- Output: stage-3-coherence.jsonl

Agent 3D - Freshness Checker:

- Last updated vs tier threshold
- Outdated version references
- Deprecated terminology
- Use: npm run docs:placement (for staleness)
- Output: stage-3-freshness.jsonl

Stage 3 Checkpoint: "Stage 3 complete - X content quality issues"

---

STAGE 4: FORMAT & STRUCTURE (3 agents)

Agent 4A - Markdown Lint:

- Run markdownlint on all docs
- Use: npm run docs:lint
- Output: stage-4-markdownlint.jsonl

Agent 4B - Prettier Compliance:

- Check formatting violations
- Use: npm run format:check
- Output: stage-4-prettier.jsonl

Agent 4C - Structure Standards:

- Frontmatter present and valid
- Required headers per tier
- Version history format (table)
- Code block language tags
- Heading uniqueness (no duplicates)
- Output: stage-4-structure.jsonl

Stage 4 Checkpoint: "Stage 4 complete - X format issues"

---

STAGE 5: PLACEMENT & LIFECYCLE (4 agents)

Agent 5A - Location Validator:

- Docs in correct tier directory
- Plans in docs/plans/
- Archives in docs/archive/
- Templates in docs/templates/
- Use: npm run docs:placement (for location)
- Output: stage-5-location.jsonl

Agent 5B - Archive Candidate Finder (surface-level):

- Completed plans not archived
- Session handoffs >30 days old
- Old audit results >60 days
- Plans not in current ROADMAP
- Output: stage-5-archive-candidates-raw.jsonl

Agent 5C - Cleanup Candidate Finder:

- Exact duplicate files
- Near-empty files (<50 words)
- Draft files >60 days old
- Temp/test files
- Output: stage-5-cleanup-candidates.jsonl

Agent 5D - Deep Lifecycle Analysis (SEQUENTIAL - after 5B):

- Read each archive candidate
- Determine original purpose
- Assess: met, overtaken, deprecated?
- Check if content consumed elsewhere
- Provide recommendation with justification
- Output: stage-5-lifecycle-analysis.jsonl

Stage 5 Checkpoint: "Stage 5 complete - X lifecycle issues, Y archive
candidates"

---

STAGE 6: SYNTHESIS & PRIORITIZATION (Sequential)

1. Merge all JSONL findings
2. Deduplicate (same file:line from multiple agents)
3. Cross-reference FALSE_POSITIVES.jsonl
4. Priority scoring: priority = (severityWeight × categoryMultiplier ×
   confidenceWeight) / effortWeight
   - severityWeight: S0=100, S1=50, S2=20, S3=5
   - categoryMultiplier: links=1.5, accuracy=1.3, freshness=1.0, format=0.8
   - confidenceWeight: HIGH=1.0, MEDIUM=0.7, LOW=0.4
   - effortWeight: E0=1, E1=2, E2=4, E3=8
5. Generate action plan:
   - Immediate fixes (S0/S1, E0/E1)
   - Archive queue (with commands)
   - Delete/merge queue (with justification)
6. Output: FINAL_REPORT.md

Stage 6 Checkpoint: "Stage 6 complete - Ready to output"
```

### Part 4: Output Format

```markdown
OUTPUT FORMAT (STRICT)

Return 4 sections in this exact order:

1. QUALITY_METRICS_JSON { "audit_date": "YYYY-MM-DD", "execution_mode":
   "PARALLEL|SEQUENTIAL", "stages_completed": 6, "total_docs": X,
   "total_findings": X, "findings_by_severity": {"S0": X, "S1": X, "S2": X,
   "S3": X}, "findings_by_stage": {"stage2": X, "stage3": X, "stage4": X,
   "stage5": X}, "broken_links_count": X, "orphaned_docs_count": X,
   "stale_docs_count": X, "archive_candidates": X, "false_positives_filtered": X
   }

2. FINDINGS_JSONL (one JSON object per line, each must be valid JSON)

Schema: { "id": "DOC-<STAGE>-<TYPE>-<TIMESTAMP>-<RANDOM>", "category":
"documentation", "severity": "S0|S1|S2|S3", "effort": "E0|E1|E2|E3",
"confidence": "HIGH|MEDIUM|LOW", "verified":
"TOOL_VALIDATED|MANUAL_CHECK|SUSPECTED", "file": "relative/path.md", "line":
123, "title": "Short, specific issue title", "description": "What's wrong and
impact", "recommendation": "How to fix", "evidence": ["specific instances",
"grep output"], "cross_ref": "link_check|accuracy_check|etc", "stage": 2,
"agent": "2A" }

⚠️ REQUIRED FIELDS: `file` (at least one path) and `line` (use 1 if file-wide)

3. SUSPECTED_FINDINGS_JSONL (same schema, but confidence=LOW; needs
   verification)

4. HUMAN_SUMMARY (markdown)

- Documentation quality overview
- Critical issues requiring immediate attention
- Top 5 priority items per stage
- Archive/cleanup recommendations
- Baseline comparison (if previous audit exists)
```

### Part 5: Verification Commands

```markdown
VERIFICATION COMMANDS (run if run_commands=yes)

Stage 1 - Inventory:

- find docs/ -name "\*.md" | wc -l
- find . -maxdepth 1 -name "\*.md" | wc -l

Stage 2 - Links:

- npm run docs:external-links (automated external link checker)
- grep -rE "\[._\]\(._\.md\)" --include="\*.md" | head -50

Stage 3 - Accuracy:

- npm run docs:accuracy (automated accuracy checker)
- grep -rn "TODO:\|FIXME:\|TBD:" --include="\*.md"

Stage 4 - Format:

- npm run docs:lint (markdownlint)
- npm run format:check -- docs/

Stage 5 - Placement:

- npm run docs:placement (automated location/staleness checker)
- git log --since="90 days ago" --name-only -- "\*.md" | sort -u

Paste only minimal excerpts as evidence.
```

---

## Aggregation Process (Multi-AI)

### Step 1: Collect Outputs

For each AI model, save:

- `[model-name]_metrics.json`
- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_summary.md`

### Step 2: Run Documentation Aggregator

```markdown
ROLE

You are the Documentation Audit Aggregator. Merge multiple AI documentation
audit outputs into one prioritized remediation plan.

NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR, not a fresh auditor
- You MUST NOT invent documentation issues not in auditor outputs
- Prioritize by TDMS priority score formula

DEDUPLICATION RULES

1. Primary merge: same file + same line + same issue type
2. Secondary merge: same broken link from multiple models
3. Take union of all findings
4. Prefer TOOL_VALIDATED over MANUAL_CHECK over SUSPECTED

SEVERITY HANDLING

If models disagree on severity:

- Take HIGHER severity if 2+ models agree
- For broken links: Always S1 minimum if confirmed
- For stale content: Use tier-specific thresholds

OUTPUT

1. CONSOLIDATED_METRICS_JSON (aggregate totals)
2. DEDUPED_FINDINGS_JSONL (with canonical_id, merge_count)
3. PRIORITIZED_FINDINGS (sorted by priority score)
4. REMEDIATION_PLAN_JSON (action queues)
5. HUMAN_SUMMARY
```

### Step 3: Create Documentation Findings Document

Create
`docs/audits/single-session/documentation/audit-[YYYY-MM-DD]/FINAL_REPORT.md`
with:

- Quality metrics dashboard
- All findings with remediation steps
- Prioritized fix order
- Archive/cleanup commands
- Estimated effort for full remediation

---

## Implementation Workflow

After aggregation, remediate findings using this workflow:

### Step 1: Immediate Fixes (E0/E1 items)

```markdown
ROLE

You are a Technical Writer implementing fixes from a documentation audit.

HARD RULES

- Fix documentation issues ONLY - no code changes unless updating examples
- Verify all link fixes work
- Maintain consistent voice and style
- Follow project documentation standards

PROCESS

1. Start with S0/S1 + E0/E1 items (highest priority, lowest effort)
2. Run verification after each fix
3. Batch similar fixes (e.g., all broken links together)
4. Update last-modified dates if required
```

### Step 2: Archive Queue

```bash
# For each archive candidate from stage-5-lifecycle-analysis.jsonl:
node scripts/archive-doc.js "path/to/completed-plan.md"
```

### Step 3: Cleanup Queue

- Delete: temp files, near-empty stubs
- Merge: fragmented docs into consolidated targets
- Document justification for each deletion

### Step 4: TDMS Integration

```bash
# Intake all findings to MASTER_DEBT.jsonl
node scripts/debt/intake-audit.js ${AUDIT_DIR}/all-findings.jsonl \
  --source "audit-documentation-$(date +%Y-%m-%d)"
```

---

## Audit History

| Date   | Type          | Mode      | Models | Findings | Quality Score    |
| ------ | ------------- | --------- | ------ | -------- | ---------------- |
| [Date] | 6-Stage Audit | [PAR/SEQ] | [N]    | [X]      | [Before → After] |

---

## AI Instructions

When using this template:

1. **Copy this template** to
   `docs/audits/single-session/documentation/audit-[YYYY-MM-DD]/AUDIT_PLAN.md`
2. **Fill in Audit Context** with project-specific details
3. **Select execution mode** (parallel vs sequential)
4. **Run the audit prompt** on each assigned model
5. **Collect outputs** in JSONL format
6. **Run aggregation** for consolidated findings
7. **Create FINAL_REPORT.md**
8. **Run TDMS intake** for debt tracking
9. **Update AUDIT_TRACKER.md** with results

**Quality checks before finalizing:**

- [ ] All 6 stages completed
- [ ] JSONL schema validation passes
- [ ] FALSE_POSITIVES.jsonl cross-referenced
- [ ] Broken links verified manually (sample)
- [ ] Archive candidates reviewed
- [ ] Remediation plan actionable

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](./JSONL_SCHEMA_STANDARD.md)** - Canonical JSONL
  schema for all review templates
- **[MULTI_AI_REVIEW_COORDINATOR.md](../MULTI_AI_REVIEW_COORDINATOR.md)** -
  Master index and trigger tracking
- **[MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md](./MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md)** -
  General code review template
- **[.claude/skills/audit-documentation/SKILL.md](../../.claude/skills/audit-documentation/SKILL.md)** -
  Single-session skill (Claude Code)
- **[docs/DOCUMENTATION_STANDARDS.md](../DOCUMENTATION_STANDARDS.md)** -
  Documentation standards (if exists)

---

## ⚠️ Update Dependencies

When updating this document, also update:

| Document                                      | What to Update                  | Why                    |
| --------------------------------------------- | ------------------------------- | ---------------------- |
| `.claude/skills/audit-documentation/SKILL.md` | Sync stage definitions          | Single-session version |
| `docs/SLASH_COMMANDS_REFERENCE.md`            | `/audit-documentation` section  | Command documentation  |
| `.claude/COMMAND_REFERENCE.md`                | audit-documentation description | Skill index            |

**Why this matters:** Stage structure changes must propagate to all related
documents to maintain consistency.

---

## Version History

| Version | Date       | Changes                                                                                                                           | Author |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2.0     | 2026-02-02 | Complete rewrite: Aligned with 6-stage parallel audit architecture, added execution mode selection, TDMS integration, npm scripts | Claude |
| 1.2     | 2026-01-09 | Added Category 6: Content Quality covering circular docs, bloat detection, contradiction checking                                 | Claude |
| 1.1     | 2026-01-06 | Review #68: Fixed link extraction regex to use grep -E for extended regex                                                         | Claude |
| 1.0     | 2026-01-05 | Initial template creation - Documentation audit category added to multi-AI review framework                                       | Claude |

---

**END OF MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md**
