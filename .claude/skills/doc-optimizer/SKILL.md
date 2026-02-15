---
name: doc-optimizer
description:
  Scan all docs, auto-fix formatting/headers/links, report issues as JSONL, and
  generate enhancement recommendations
supports_parallel: true
fallback_available: false
estimated_time_parallel: 40 min
estimated_time_sequential: 120 min
---

# Documentation Optimizer

**Version:** 1.3 **Last Updated:** 2026-02-14 **Status:** ACTIVE **Waves:** 5
waves with 13 agents **Output:** `.claude/state/doc-optimizer/`

**What This Does:** Wave-based orchestrator that deploys 13 parallel agents
across 5 waves to analyze, auto-fix, report, and recommend improvements for
every non-archived document in the repository.

**Differentiator from `/audit-documentation`:** That skill is a read-only
diagnostic (18 agents, report-only). This skill is a **repair + enhancement
tool** -- it auto-fixes formatting/headers/links, reports issues as JSONL, AND
generates actionable improvement recommendations.

---

## Overview

```
Wave 0: Discovery (Orchestrator, sequential)
  Build file inventory, link graph, metadata index
  ~2 min

Wave 1: Independent Analysis (3 parallel + 1 sequential)
  1A: Format & Lint Fixer (AUTO-FIX)
  1C: External Link Validator (REPORT)
  1D: Content Accuracy Checker (MIXED)
  1B: Header & Metadata Fixer (AUTO-FIX) <- sequential after 1A
  ~8-12 min

Wave 2: Graph-Dependent Analysis (4 parallel)
  2A: Internal Link Fixer (MIXED)
  2B: Orphan & Connectivity (REPORT)
  2C: Freshness & Lifecycle (REPORT)
  2D: Cross-Ref & Deps (REPORT)
  ~8-12 min

Wave 3: Issue Synthesis (2 parallel)
  3A: Coherence & Duplication (REPORT)
  3B: Structure & Classification (REPORT)
  ~5 min

Wave 4: Enhancement & Optimization (3 parallel)
  4A: Quality & Readability Scorer (REPORT)
  4B: Content Gap & Consolidation (REPORT)
  4C: Visual & Navigation Enhancer (REPORT)
  ~8-12 min

Orchestrator: Unify -> Dedupe -> Report -> TDMS intake
  ~5 min

Post-Run: Cleanup
  Delete temp files (.claude/state/doc-optimizer/)
  Identify & remove obsolete audit/review artifacts from docs/
  ~2 min
```

---

## Context Safety (Prevents Context Overflow)

> [!CRITICAL] The previous run crashed because 8 agents returned full results to
> the orchestrator, overflowing the context window. These rules are mandatory.

### Agent Return Protocol

**Every agent prompt MUST end with this instruction** (append to all prompts):

```
CRITICAL RETURN PROTOCOL: When you finish, return ONLY this single line:
COMPLETE: [agent-id] wrote N findings to [output-path]
Do NOT include finding details, file listings, summaries, or analysis in your
return message. All details belong in the JSONL output file, not your response.
```

### Orchestrator Must Not Read JSONL Files

The orchestrator checks agent completion via **file existence and line count
only**:

```bash
# CORRECT - check file exists and count lines
wc -l < ".claude/state/doc-optimizer/wave1-format.jsonl" 2>/dev/null || echo "0"

# WRONG - never do this in orchestrator context
# cat .claude/state/doc-optimizer/wave1-format.jsonl
```

### Wave Chunking (Max 2 Waves Per Invocation)

If context is running low (past ~60% usage), **stop after the current wave**,
save progress, and resume in a new invocation. The `progress.json` file tracks
exactly where to resume.

Recommended chunking: Wave 0+1 → pause → Wave 2 → pause → Wave 3+4 → unify.

### Shared-State Size Cap

`shared-state.json` inventory entries should include ONLY: `path`, `size_bytes`,
`word_count`. Strip `version`, `last_updated`, `status` fields to reduce file
size. Agents that need metadata should extract it themselves from individual
files.

### Budget Check Between Waves

Before launching each wave, the orchestrator should estimate remaining context.
If the conversation already contains 3+ agent completions, consider saving state
and resuming in a new session rather than risking overflow.

---

## JSONL Finding Schema

Standard schema from `docs/templates/JSONL_SCHEMA_STANDARD.md` plus these
additional fields:

```json
{
  "category": "string",
  "title": "string",
  "fingerprint": "string (<category>::<file>::<id>)",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": "number (0-100)",
  "files": ["array of file paths"],
  "why_it_matters": "string",
  "suggested_fix": "string",
  "acceptance_tests": ["array"],
  "evidence": ["array (optional)"],
  "auto_fixed": "boolean -- whether agent already applied the fix",
  "agent": "string -- which agent produced finding (1A, 1B, etc.)",
  "wave": "number -- which wave (0-4)",
  "finding_type": "issue|enhancement -- distinguishes problems from improvement ideas"
}
```

---

## Output Structure

```
.claude/state/doc-optimizer/
  shared-state.json          # Wave 0: inventory, link graph, metadata
  wave1-format.jsonl         # Agent 1A findings
  wave1-headers.jsonl        # Agent 1B findings
  wave1-external-links.jsonl # Agent 1C findings
  wave1-accuracy.jsonl       # Agent 1D findings
  wave2-internal-links.jsonl # Agent 2A findings
  wave2-orphans.jsonl        # Agent 2B findings
  wave2-lifecycle.jsonl      # Agent 2C findings
  wave2-crossrefs.jsonl      # Agent 2D findings
  wave3-coherence.jsonl      # Agent 3A findings
  wave3-structure.jsonl      # Agent 3B findings
  wave4-quality.jsonl        # Agent 4A findings
  wave4-gaps.jsonl           # Agent 4B findings
  wave4-navigation.jsonl     # Agent 4C findings
  all-findings.jsonl         # Unified + deduped
  progress.json              # Wave/agent progress tracker
  SUMMARY_REPORT.md          # Final human-readable report
```

---

## Execution Flow

### STEP 1: Pre-Flight

```bash
# Create output directory
mkdir -p .claude/state/doc-optimizer

# Verify output directory is safe
STATE_DIR=".claude/state/doc-optimizer"
STATE_PATH=$(realpath "${STATE_DIR}" 2>/dev/null || echo "${STATE_DIR}")
if [ -z "${STATE_DIR}" ] || [ "${STATE_PATH}" = "/" ] || [[ "${STATE_DIR}" == ".."* ]]; then
  echo "FATAL: Invalid or unsafe STATE_DIR"
  exit 1
fi
```

Initialize `progress.json`:

```json
{
  "started": "<ISO datetime>",
  "lastUpdated": "<ISO datetime>",
  "waves": {
    "0": { "status": "pending" },
    "1": {
      "status": "pending",
      "agents": {
        "1A": "pending",
        "1B": "pending",
        "1C": "pending",
        "1D": "pending"
      }
    },
    "2": {
      "status": "pending",
      "agents": {
        "2A": "pending",
        "2B": "pending",
        "2C": "pending",
        "2D": "pending"
      }
    },
    "3": {
      "status": "pending",
      "agents": { "3A": "pending", "3B": "pending" }
    },
    "4": {
      "status": "pending",
      "agents": { "4A": "pending", "4B": "pending", "4C": "pending" }
    }
  },
  "unification": { "status": "pending" },
  "report": { "status": "pending" }
}
```

Load false positives if they exist:

```bash
if [ -f "docs/audits/FALSE_POSITIVES.jsonl" ]; then
  echo "Loaded false positives database"
else
  echo "No false positives database found (proceeding without filter)"
fi
```

---

### STEP 2: Wave 0 -- Discovery (Orchestrator, sequential)

Build the shared state that all subsequent waves depend on. This runs in the
orchestrator context (not a subagent).

**2.1: Build File Inventory**

```bash
# Glob all active .md files, exclude node_modules, .git, docs/archive
# Use Glob tool with pattern: **/*.md
# Filter out: node_modules/, .git/, docs/archive/
```

For each .md file, extract:

- Relative path
- File size (bytes)
- Word count

**2.2: Extract Link Graph**

For each .md file, extract:

- Internal links: `[text](path.md)` with source file and line number
- External URLs: `https://...` with source file and line number
- Anchor refs: `#section` with source file and line number

**2.3: Extract Metadata**

For each .md file, parse:

- `version` (from frontmatter or "Document Version:" line)
- `lastUpdated` (from frontmatter or "Last Updated:" line)
- `tier` (from DOCUMENTATION_STANDARDS.md classification)
- `status` (from frontmatter or "Status:" line)

**2.4: Write shared-state.json**

```json
{
  "generated": "<ISO datetime>",
  "file_count": 297,
  "inventory": [
    {
      "path": "README.md",
      "size_bytes": 4523,
      "word_count": 892,
      "version": "1.0",
      "last_updated": "2026-01-15",
      "tier": 1,
      "status": "active"
    }
  ],
  "links": {
    "internal": [
      {
        "source": "README.md",
        "line": 15,
        "target": "ARCHITECTURE.md",
        "text": "Architecture"
      }
    ],
    "external": [
      {
        "source": "README.md",
        "line": 22,
        "url": "https://firebase.google.com",
        "text": "Firebase"
      }
    ],
    "anchors": [
      { "source": "README.md", "line": 8, "anchor": "#setup", "text": "Setup" }
    ]
  }
}
```

Update `progress.json`: Wave 0 = "completed"

**Display:**

```
Doc Optimizer - Wave 0 Complete
  Files discovered: X
  Internal links: Y
  External URLs: Z
  Proceeding to Wave 1...
```

---

### STEP 3: Wave 1 -- Independent Analysis

**Launch 1A + 1C + 1D in parallel (3 agents), then 1B sequentially after 1A.**

#### Agent 1A: Format & Lint Fixer (AUTO-FIX)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave1-format.jsonl`

**Prompt:**

````
You are the Format & Lint Fixer agent for the doc-optimizer skill.

Your job is to auto-fix markdown formatting issues and report remaining violations.

STEP 1: Run markdownlint with auto-fix on all doc locations:
  npx markdownlint --fix "*.md" "docs/**/*.md" ".claude/**/*.md" --config .markdownlint.json 2>&1

STEP 2: Run Prettier with auto-fix on docs:
  npx prettier --write "docs/**/*.md" ".claude/skills/**/*.md" 2>&1

STEP 3: Run markdownlint again (check mode) to capture remaining violations:
  npx markdownlint "*.md" "docs/**/*.md" ".claude/**/*.md" --config .markdownlint.json 2>&1

STEP 4: Run Prettier check to capture remaining violations:
  npx prettier --check "docs/**/*.md" ".claude/skills/**/*.md" 2>&1

STEP 5: For each auto-fixed file, create a finding with auto_fixed: true.
For each remaining violation, create a finding with auto_fixed: false.

Categories to check:
- Markdownlint rule violations
- Prettier formatting
- Heading hierarchy (H1 -> H2 -> H3, no skipping)
- Code block language tags (flag ``` without language)
- Table formatting consistency

Write findings as JSONL to: .claude/state/doc-optimizer/wave1-format.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "short description",
  "fingerprint": "documentation::<file>::<rule-or-description>",
  "severity": "S2|S3",
  "effort": "E0",
  "confidence": 90,
  "files": ["path/to/file.md"],
  "why_it_matters": "Consistent formatting improves readability",
  "suggested_fix": "specific fix",
  "acceptance_tests": ["markdownlint passes", "prettier --check passes"],
  "auto_fixed": true|false,
  "agent": "1A",
  "wave": 1,
  "finding_type": "issue"
}

IMPORTANT: Do NOT modify files outside docs/, .claude/skills/, or root .md files.

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 1A, output: .claude/state/doc-optimizer/wave1-format.jsonl
````

#### Agent 1C: External Link Validator (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave1-external-links.jsonl`

**Prompt:**

```
You are the External Link Validator agent for the doc-optimizer skill.

Your job is to check all external URLs in documentation for broken links.

STEP 1: Run the external link checker script:
  node scripts/check-external-links.js 2>&1

STEP 2: Read .claude/state/doc-optimizer/shared-state.json to get the full
list of external URLs from the link graph.

STEP 3: For any URLs not covered by the script, use WebFetch to HTTP HEAD
check them. Use a 10-second timeout. Rate limit to 100ms between requests
to the same domain.

STEP 4: For each broken, redirected, or timed-out URL, create a finding.

Severity mapping:
- 404 Not Found: S1 (broken documentation)
- 403 Forbidden: S2 (may work for users)
- 5xx Server Error: S2 (transient, recheck later)
- Redirect (301/302): S3 (update URL)
- Timeout: S3 (slow but may work)

Write findings as JSONL to: .claude/state/doc-optimizer/wave1-external-links.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Broken external link: <url>",
  "fingerprint": "documentation::<source-file>::ext-link-<url-hash>",
  "severity": "S1|S2|S3",
  "effort": "E0",
  "confidence": 95,
  "files": ["source-file.md:line"],
  "why_it_matters": "Broken links erode trust and frustrate readers",
  "suggested_fix": "Update or remove the broken URL",
  "acceptance_tests": ["URL returns 200 OK"],
  "auto_fixed": false,
  "agent": "1C",
  "wave": 1,
  "finding_type": "issue"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 1C, output: .claude/state/doc-optimizer/wave1-external-links.jsonl
```

#### Agent 1D: Content Accuracy Checker (MIXED)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave1-accuracy.jsonl`

**Prompt:**

```
You are the Content Accuracy Checker agent for the doc-optimizer skill.

Your job is to verify that documentation references to code artifacts are accurate.

STEP 1: Run the content accuracy checker:
  node scripts/check-content-accuracy.js 2>&1

STEP 2: Read .claude/state/doc-optimizer/shared-state.json for the file inventory.

STEP 3: For Tier 1-2 documents (highest priority), manually verify:
- Backtick-quoted file paths exist in the codebase (use Glob)
- npm script references (e.g., `npm run docs:check`) match package.json
- Version numbers match CLAUDE.md Section 1 stack versions
- Component/function references exist in source

STEP 4: For each inaccuracy found, create a finding.
If the fix is unambiguous (e.g., path clearly moved), auto-fix the reference
and set auto_fixed: true.

Severity mapping:
- Wrong file path (file doesn't exist): S1
- Wrong npm script name: S1
- Wrong version number: S2
- Outdated component reference: S2

Write findings as JSONL to: .claude/state/doc-optimizer/wave1-accuracy.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Inaccurate reference: <description>",
  "fingerprint": "documentation::<file>::accuracy-<identifier>",
  "severity": "S1|S2",
  "effort": "E0|E1",
  "confidence": 85,
  "files": ["doc-file.md:line"],
  "why_it_matters": "Inaccurate docs mislead developers and waste debugging time",
  "suggested_fix": "specific correction",
  "acceptance_tests": ["Reference resolves correctly"],
  "auto_fixed": true|false,
  "agent": "1D",
  "wave": 1,
  "finding_type": "issue"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 1D, output: .claude/state/doc-optimizer/wave1-accuracy.jsonl
```

#### Wave 1 Checkpoint (after 1A + 1C + 1D complete)

```bash
for f in wave1-format.jsonl wave1-external-links.jsonl wave1-accuracy.jsonl; do
  if [ -s ".claude/state/doc-optimizer/$f" ]; then
    echo "OK: $f ($(wc -l < ".claude/state/doc-optimizer/$f") findings)"
  else
    echo "WARN: $f missing or empty"
  fi
done
```

If any agent failed, log it and continue. Do NOT block Wave 1B or Wave 2.

#### Agent 1B: Header & Metadata Fixer (AUTO-FIX + REPORT)

**Sequential dependency: Runs AFTER Agent 1A completes** (1A may reformat
headers that 1B then validates).

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave1-headers.jsonl`

**Prompt:**

```
You are the Header & Metadata Fixer agent for the doc-optimizer skill.

Your job is to validate and fix document headers and metadata blocks.
Agent 1A (formatting) has already run, so files are already formatted.

STEP 1: Run the header check script on all docs:
  node scripts/check-doc-headers.js --all 2>&1

STEP 2: Run the light docs check:
  node scripts/check-docs-light.js 2>&1

STEP 3: For each document missing required header fields, determine if the
fix is safe to apply automatically:

Auto-fixable (set auto_fixed: true, apply the fix):
- Missing "Document Version:" line -> add "**Document Version:** 1.0"
- Missing "Last Updated:" line -> add "**Last Updated:** <today's date>"
- Missing "Purpose" section -> add empty "## Purpose" section
- Missing "---" separator after header block

Report-only (set auto_fixed: false):
- Missing required content sections (depends on document type)
- Incorrect tier classification metadata
- Frontmatter schema violations in skill docs

STEP 4: For each finding, use this schema.

Severity mapping:
- Missing header on Tier 1-2 doc: S1
- Missing header on Tier 3+ doc: S2
- Missing required section: S2
- Missing optional section: S3

Write findings as JSONL to: .claude/state/doc-optimizer/wave1-headers.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Missing header: <description>",
  "fingerprint": "documentation::<file>::header-<field>",
  "severity": "S1|S2|S3",
  "effort": "E0",
  "confidence": 95,
  "files": ["doc-file.md"],
  "why_it_matters": "Consistent headers enable automated tooling and improve discoverability",
  "suggested_fix": "Add <field> to document header",
  "acceptance_tests": ["npm run docs:headers passes"],
  "auto_fixed": true|false,
  "agent": "1B",
  "wave": 1,
  "finding_type": "issue"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 1B, output: .claude/state/doc-optimizer/wave1-headers.jsonl
```

#### Wave 1 Final Checkpoint

```bash
for f in wave1-format.jsonl wave1-headers.jsonl wave1-external-links.jsonl wave1-accuracy.jsonl; do
  if [ -s ".claude/state/doc-optimizer/$f" ]; then
    echo "OK: $f ($(wc -l < ".claude/state/doc-optimizer/$f") findings)"
  else
    echo "WARN: $f missing or empty"
  fi
done
```

Update `progress.json`: Wave 1 = "completed"

**Display:**

```
Wave 1 Complete (Independent Analysis)
  1A Format & Lint:    X auto-fixed, Y remaining
  1B Headers:          X auto-fixed, Y remaining
  1C External Links:   X broken URLs found
  1D Content Accuracy: X inaccuracies found
  Proceeding to Wave 2...
```

---

### STEP 4: Wave 2 -- Graph-Dependent Analysis

**Launch 2A + 2B + 2C + 2D in parallel (4 agents).**

All agents receive `shared-state.json` as input.

#### Agent 2A: Internal Link Fixer (MIXED)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave2-internal-links.jsonl`

**Prompt:**

```
You are the Internal Link Fixer agent for the doc-optimizer skill.

Your job is to verify all internal markdown links resolve correctly and fix
unambiguous broken links.

STEP 1: Read .claude/state/doc-optimizer/shared-state.json to get the link
graph (links.internal array).

STEP 2: For each internal link, verify:
- Target file exists at the referenced path
- If link has an anchor (#section), verify the heading exists in the target
- Check for case sensitivity issues (Windows-safe paths)
- Detect circular reference chains (A -> B -> C -> A)

STEP 3: For broken links where the fix is unambiguous:
- File was renamed (only one similar file exists): auto-fix the link
- File was moved to a different directory (search by filename): auto-fix
- Anchor heading was renamed (fuzzy match > 80%): auto-fix
Set auto_fixed: true and apply the edit.

For ambiguous breaks (multiple candidates, file deleted):
Set auto_fixed: false, suggest possible fixes.

STEP 4: Also check for backlink completeness:
- If doc A links to doc B, does B have a "See also" or reference back to A?
  (This is an enhancement suggestion, not an error.)

Severity mapping:
- Broken link (file doesn't exist): S1
- Broken anchor (heading doesn't exist): S2
- Case sensitivity issue: S2
- Missing backlink: S3 (finding_type: "enhancement")

Write findings as JSONL to: .claude/state/doc-optimizer/wave2-internal-links.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Broken internal link: <target>",
  "fingerprint": "documentation::<source>::int-link-<target-hash>",
  "severity": "S1|S2|S3",
  "effort": "E0",
  "confidence": 90,
  "files": ["source.md:line"],
  "why_it_matters": "Broken links block navigation and indicate stale docs",
  "suggested_fix": "Update link from <old> to <new>",
  "acceptance_tests": ["Link resolves to existing file"],
  "auto_fixed": true|false,
  "agent": "2A",
  "wave": 2,
  "finding_type": "issue|enhancement"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 2A, output: .claude/state/doc-optimizer/wave2-internal-links.jsonl
```

#### Agent 2B: Orphan & Connectivity Analyzer (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave2-orphans.jsonl`

**Prompt:**

```
You are the Orphan & Connectivity Analyzer agent for the doc-optimizer skill.

Your job is to find disconnected documents and check index accuracy.

STEP 1: Read .claude/state/doc-optimizer/shared-state.json to get the link
graph and file inventory.

STEP 2: Build an inbound link count for each document.

STEP 3: Identify orphans (zero inbound links). Exclude from orphan detection:
- README.md (entry point)
- Root-level canonical docs (CLAUDE.md, ARCHITECTURE.md, DEVELOPMENT.md, etc.)
- docs/archive/ files (intentionally disconnected)
- CHANGELOG.md, LICENSE.md, CONTRIBUTING.md
- .claude/skills/*/SKILL.md (loaded by skill system, not links)

STEP 4: Check DOCUMENTATION_INDEX.md accuracy:
- Every active .md file should appear in the index
- No index entries should point to non-existent files
- Categories should match actual content

STEP 5: For each orphan, recommend one of:
- ADD_LINK: Add a link from a relevant parent doc
- ARCHIVE: Move to docs/archive/ if content is outdated
- DELETE: Remove if empty or superseded
- MERGE: Combine with another doc covering same topic

Severity mapping:
- Orphaned Tier 1-2 doc: S1 (important doc unreachable)
- Orphaned Tier 3+ doc: S2
- Missing from DOCUMENTATION_INDEX.md: S2
- Stale index entry: S2

Write findings as JSONL to: .claude/state/doc-optimizer/wave2-orphans.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Orphaned document: <filename>",
  "fingerprint": "documentation::<file>::orphan",
  "severity": "S1|S2",
  "effort": "E0|E1",
  "confidence": 80,
  "files": ["orphaned-file.md"],
  "why_it_matters": "Unreachable docs are wasted effort and may contain outdated info",
  "suggested_fix": "recommendation (ADD_LINK/ARCHIVE/DELETE/MERGE)",
  "acceptance_tests": ["Document has at least 1 inbound link OR is archived"],
  "auto_fixed": false,
  "agent": "2B",
  "wave": 2,
  "finding_type": "issue"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 2B, output: .claude/state/doc-optimizer/wave2-orphans.jsonl
```

#### Agent 2C: Freshness & Lifecycle Analyzer (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave2-lifecycle.jsonl`

**Prompt:**

```
You are the Freshness & Lifecycle Analyzer agent for the doc-optimizer skill.

Your job is to check document staleness, deprecated references, and lifecycle status.

STEP 1: Read .claude/state/doc-optimizer/shared-state.json for metadata
(lastUpdated, tier, status per file).

STEP 2: Run the placement/staleness checker:
  node scripts/check-doc-placement.js 2>&1

STEP 3: Apply per-tier staleness thresholds (days since lastUpdated):
- Tier 1 (Canonical): >60 days = stale
- Tier 2 (Foundation): >90 days = stale
- Tier 3 (Planning): >120 days = stale
- Tier 4 (Reference): >120 days = stale
- Tier 5 (Guides): >120 days = stale

STEP 4: Check for deprecated references still in use:
- Outdated package versions referenced
- Deprecated API patterns mentioned
- References to removed features or scripts

STEP 5: Identify archive candidates:
- Completed plans not yet archived
- Session handoffs > 30 days old
- Old single-session audit results (> 60 days, likely in MASTER_DEBT.jsonl)
- Plans not referenced in current ROADMAP.md

STEP 6: Check for stray artifacts:
- .bak files in docs/
- .tmp files
- Files in root that belong in docs/ subdirectories

Severity mapping:
- Tier 1 doc stale >60 days: S1
- Tier 2 doc stale >90 days: S2
- Archive candidate: S3
- Stray artifact (.bak, .tmp): S2
- Deprecated reference: S2

Write findings as JSONL to: .claude/state/doc-optimizer/wave2-lifecycle.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Stale document: <filename> (<days> days old)",
  "fingerprint": "documentation::<file>::lifecycle-<type>",
  "severity": "S1|S2|S3",
  "effort": "E0|E1",
  "confidence": 85,
  "files": ["stale-file.md"],
  "why_it_matters": "Stale docs mislead developers and erode trust in documentation",
  "suggested_fix": "Update content OR archive if no longer relevant",
  "acceptance_tests": ["lastUpdated within tier threshold"],
  "auto_fixed": false,
  "agent": "2C",
  "wave": 2,
  "finding_type": "issue"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 2C, output: .claude/state/doc-optimizer/wave2-lifecycle.jsonl
```

#### Agent 2D: Cross-Reference & Dependency Checker (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave2-crossrefs.jsonl`

**Prompt:**

```
You are the Cross-Reference & Dependency Checker agent for the doc-optimizer skill.

Your job is to validate cross-document dependencies and template-instance sync.

STEP 1: Run the document sync checker:
  node scripts/check-document-sync.js 2>&1

STEP 2: Run the cross-doc dependency checker:
  node scripts/check-cross-doc-deps.js 2>&1

STEP 3: Scan all active .md files for unresolved placeholders:
  Search for: [TODO], [TBD], [FIXME], [PLACEHOLDER], [INSERT], XXX

STEP 4: Check template-instance sync:
- Templates in docs/templates/ should match instances that inherit from them
- Version numbers in instances should not exceed template version

STEP 5: Check dependency rule violations:
- If doc A says "see doc B for details", doc B must exist and cover that topic
- If doc A quotes a section from doc B, the quote should match current content

Severity mapping:
- Unresolved [TODO] in Tier 1-2 doc: S1
- Unresolved [TODO] in Tier 3+ doc: S2
- Template-instance version mismatch: S2
- Cross-doc dependency broken: S2
- Quote doesn't match source: S3

Write findings as JSONL to: .claude/state/doc-optimizer/wave2-crossrefs.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Cross-ref issue: <description>",
  "fingerprint": "documentation::<file>::crossref-<identifier>",
  "severity": "S1|S2|S3",
  "effort": "E0|E1",
  "confidence": 80,
  "files": ["doc-file.md:line"],
  "why_it_matters": "Cross-reference errors cascade confusion across docs",
  "suggested_fix": "specific fix",
  "acceptance_tests": ["npm run docs:sync-check passes"],
  "auto_fixed": false,
  "agent": "2D",
  "wave": 2,
  "finding_type": "issue"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 2D, output: .claude/state/doc-optimizer/wave2-crossrefs.jsonl
```

#### Wave 2 Checkpoint

```bash
for f in wave2-internal-links.jsonl wave2-orphans.jsonl wave2-lifecycle.jsonl wave2-crossrefs.jsonl; do
  if [ -s ".claude/state/doc-optimizer/$f" ]; then
    echo "OK: $f ($(wc -l < ".claude/state/doc-optimizer/$f") findings)"
  else
    echo "WARN: $f missing or empty"
  fi
done
```

Update `progress.json`: Wave 2 = "completed"

**Display:**

```
Wave 2 Complete (Graph-Dependent Analysis)
  2A Internal Links: X issues (Y auto-fixed)
  2B Orphans:        X orphaned docs found
  2C Lifecycle:      X stale, Y archive candidates
  2D Cross-Refs:     X dependency issues
  Proceeding to Wave 3...
```

---

### STEP 5: Wave 3 -- Issue Synthesis

**Launch 3A + 3B in parallel (2 agents).**

#### Agent 3A: Coherence & Duplication Detector (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave3-coherence.jsonl`

**Prompt:**

```
You are the Coherence & Duplication Detector agent for the doc-optimizer skill.

Your job is to find duplicate content blocks and terminology inconsistencies.

STEP 1: Read .claude/state/doc-optimizer/shared-state.json for the file inventory.

STEP 2: Read all Tier 1-2 documents fully. Sample Tier 3-4 documents (read
first 200 lines of each).

STEP 3: Detect duplicate content blocks:
- Find blocks of >50 words that appear nearly identically in 2+ documents
- Track the source of truth (which doc should own the content)
- Recommend: keep in source, replace duplicates with links

STEP 4: Track terminology consistency. Check for inconsistent usage of:
- "Cloud Functions" vs "cloud functions" vs "Cloud Function"
- "App Check" vs "appcheck" vs "AppCheck"
- "TDMS" vs "Technical Debt Management System"
- "skill" vs "command" vs "slash command"
- "agent" vs "subagent" vs "worker"
- "finding" vs "issue" vs "item"
- Any other terms used inconsistently

STEP 5: Flag contradictions where two docs give conflicting guidance for
the same task or concept.

Severity mapping:
- Contradictory information: S1
- Duplicate content block (>100 words): S2
- Terminology inconsistency in Tier 1: S2
- Terminology inconsistency in Tier 3+: S3
- Duplicate content block (50-100 words): S3

Write findings as JSONL to: .claude/state/doc-optimizer/wave3-coherence.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Duplication: <description> in <file1> and <file2>",
  "fingerprint": "documentation::<primary-file>::coherence-<hash>",
  "severity": "S1|S2|S3",
  "effort": "E1|E2",
  "confidence": 75,
  "files": ["file1.md:line", "file2.md:line"],
  "why_it_matters": "Duplicates diverge over time, causing contradictions",
  "suggested_fix": "Keep content in <source> and link from <duplicate>",
  "acceptance_tests": ["Content exists in exactly one canonical location"],
  "auto_fixed": false,
  "agent": "3A",
  "wave": 3,
  "finding_type": "issue"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 3A, output: .claude/state/doc-optimizer/wave3-coherence.jsonl
```

#### Agent 3B: Structure & Classification Reviewer (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave3-structure.jsonl`

**Prompt:**

```
You are the Structure & Classification Reviewer agent for the doc-optimizer skill.

Your job is to audit tier classifications and directory structure alignment.

STEP 1: Read .claude/state/doc-optimizer/shared-state.json for the file inventory.

STEP 2: Read docs/DOCUMENTATION_STANDARDS.md to understand the 5-tier system:
- Tier 1: Canonical (always loaded, governance)
- Tier 2: Foundation (architecture, development guides)
- Tier 3: Planning & Reference (roadmaps, session context)
- Tier 4: Operational (audits, debt tracking)
- Tier 5: Guides & Tutorials (how-to, onboarding)

STEP 3: For each document, evaluate:
- Does its current tier match its actual content and purpose?
- Is it in the correct directory for its tier?
- Does it follow the naming conventions for its type?

STEP 4: Check directory structure alignment:
- Plans should be in docs/plans/ or .planning/
- Archives should be in docs/archive/
- Templates should be in docs/templates/
- Audit outputs should be in docs/audits/
- Skills should be in .claude/skills/

STEP 5: Identify reclassification candidates:
- Docs that are effectively Tier 1 but not recognized as such
- Docs in wrong directories
- Docs that should be promoted or demoted

Severity mapping:
- Tier 1 doc misclassified: S2
- Doc in wrong directory: S2
- Naming convention violation: S3
- Reclassification suggestion: S3

Write findings as JSONL to: .claude/state/doc-optimizer/wave3-structure.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Structure: <filename> should be <recommendation>",
  "fingerprint": "documentation::<file>::structure-<type>",
  "severity": "S2|S3",
  "effort": "E0|E1",
  "confidence": 70,
  "files": ["misplaced-file.md"],
  "why_it_matters": "Correct classification ensures docs get proper maintenance attention",
  "suggested_fix": "Move to <directory> and/or reclassify as Tier <N>",
  "acceptance_tests": ["File in correct directory", "Tier classification matches content"],
  "auto_fixed": false,
  "agent": "3B",
  "wave": 3,
  "finding_type": "issue"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 3B, output: .claude/state/doc-optimizer/wave3-structure.jsonl
```

#### Wave 3 Checkpoint

```bash
for f in wave3-coherence.jsonl wave3-structure.jsonl; do
  if [ -s ".claude/state/doc-optimizer/$f" ]; then
    echo "OK: $f ($(wc -l < ".claude/state/doc-optimizer/$f") findings)"
  else
    echo "WARN: $f missing or empty"
  fi
done
```

Update `progress.json`: Wave 3 = "completed"

**Display:**

```
Wave 3 Complete (Issue Synthesis)
  3A Coherence:  X duplications, Y terminology issues, Z contradictions
  3B Structure:  X misclassifications, Y directory issues
  Proceeding to Wave 4...
```

---

### STEP 6: Wave 4 -- Enhancement & Optimization

**Launch 4A + 4B + 4C in parallel (3 agents).**

Each agent receives `shared-state.json` plus awareness of Wave 1-3 finding
counts (but not the full findings, to stay within context).

#### Agent 4A: Quality & Readability Scorer (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave4-quality.jsonl`

**Prompt:**

```
You are the Quality & Readability Scorer agent for the doc-optimizer skill.

Your job is to score each document's quality and identify readability issues.

STEP 1: Read .claude/state/doc-optimizer/shared-state.json for the file inventory.

STEP 2: For each Tier 1-2 document (fully read) and a sample of Tier 3-5
documents (first 200 lines), score on a 1-10 scale across 5 dimensions:

- Completeness (1-10): Are all expected sections present and filled?
- Clarity (1-10): Is the writing clear and unambiguous?
- Formatting (1-10): Is formatting consistent and professional?
- Cross-references (1-10): Does it link to related docs appropriately?
- Freshness (1-10): Is content current and up-to-date?

Overall quality = average of 5 dimensions.

STEP 3: Flag readability issues:
- Walls of text: paragraphs >300 words without any list, table, or code block
- Poor scannability: sections >500 words with no bullet lists
- Overly complex sentences: >40 words per sentence average in any section
- Missing visual breaks: >50 consecutive lines of prose without headings

STEP 4: Scan for typos, grammatical errors, and inconsistent capitalization.
Focus on:
- Title case vs sentence case inconsistency in headings
- Common misspellings of technical terms
- Broken markdown syntax (unclosed bold/italic, malformed links)

STEP 5: Rank the bottom-20 documents by overall quality score for priority rewrite.

IMPORTANT: Each finding should be finding_type: "enhancement" (not "issue")
since these are improvement opportunities, not errors.

Write findings as JSONL to: .claude/state/doc-optimizer/wave4-quality.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Quality: <filename> scores <N>/10 - <top issue>",
  "fingerprint": "documentation::<file>::quality-<dimension>",
  "severity": "S2|S3",
  "effort": "E1|E2",
  "confidence": 70,
  "files": ["doc-file.md"],
  "why_it_matters": "Low-quality docs waste reader time and reduce adoption",
  "suggested_fix": "specific improvement recommendation",
  "acceptance_tests": ["Quality score improves to >=7"],
  "evidence": ["completeness: 6, clarity: 4, formatting: 8, crossrefs: 3, freshness: 5"],
  "auto_fixed": false,
  "agent": "4A",
  "wave": 4,
  "finding_type": "enhancement"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 4A, output: .claude/state/doc-optimizer/wave4-quality.jsonl
```

#### Agent 4B: Content Gap & Consolidation Analyzer (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave4-gaps.jsonl`

**Prompt:**

```
You are the Content Gap & Consolidation Analyzer agent for the doc-optimizer skill.

Your job is to find undocumented code areas, suggest consolidation, and recommend
cross-links.

STEP 1: Read .claude/state/doc-optimizer/shared-state.json for the file inventory.

STEP 2: Cross-reference codebase directories against documentation:
- Glob scripts/*.js -> check if each script is documented somewhere
- Glob components/**/*.tsx -> check if key components have docs
- Glob lib/*.ts -> check if library modules are documented
- Glob hooks/*.ts -> check if custom hooks are documented
- Glob .claude/skills/*/SKILL.md -> check if each skill has usage docs

For each undocumented area, create a "content gap" finding.

STEP 3: Find consolidation opportunities:
- Documents covering overlapping topics (>60% topic overlap)
- Small docs (<200 words) that could be sections in a larger doc
- Fragmented coverage (3+ docs each covering part of the same system)

STEP 4: Identify missing cross-links:
- Docs that discuss related topics but don't link to each other
- Missing "See also" sections in docs that reference related concepts
- Missing "Prerequisites" references in guide/tutorial docs

STEP 5: Check for missing "getting started" paths:
- Key features without a quickstart guide
- Complex systems without an overview doc
- Skills without usage examples

Write findings as JSONL to: .claude/state/doc-optimizer/wave4-gaps.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Gap: <description>",
  "fingerprint": "documentation::<area>::gap-<identifier>",
  "severity": "S2|S3",
  "effort": "E1|E2|E3",
  "confidence": 65,
  "files": ["relevant-code-or-doc.ts"],
  "why_it_matters": "Undocumented code increases onboarding time and bus factor risk",
  "suggested_fix": "Create documentation for <area> covering <topics>",
  "acceptance_tests": ["Documentation exists and covers key functionality"],
  "auto_fixed": false,
  "agent": "4B",
  "wave": 4,
  "finding_type": "enhancement"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 4B, output: .claude/state/doc-optimizer/wave4-gaps.jsonl
```

#### Agent 4C: Visual & Navigation Enhancer (REPORT)

**Subagent type:** `general-purpose` **Run in background:** `true` **Output:**
`.claude/state/doc-optimizer/wave4-navigation.jsonl`

**Prompt:**

```
You are the Visual & Navigation Enhancer agent for the doc-optimizer skill.

Your job is to improve documentation navigation, discoverability, and visual clarity.

STEP 1: Read .claude/state/doc-optimizer/shared-state.json for the file
inventory and link graph.

STEP 2: Trace navigation paths from entry points:
- Start from README.md -> follow links -> identify dead ends
- Start from DOCUMENTATION_INDEX.md -> verify all categories reachable
- Start from CLAUDE.md -> verify all referenced docs accessible
- Identify docs >2 clicks deep from any entry point

STEP 3: Flag docs >100 lines without a table of contents:
- Long docs need a TOC at the top for scannability
- Recommend TOC format with anchor links

STEP 4: Identify diagram opportunities:
- Complex architecture descriptions without Mermaid diagrams or ASCII art
- Multi-step processes described only in prose (could use flowcharts)
- Relationship descriptions (could use entity diagrams)
- Pipeline/workflow descriptions (could use sequence diagrams)

STEP 5: Check skill docs and guides for missing sections:
- Prerequisites (what must be set up first)
- Next Steps (what to do after completing this guide)
- Related Skills/Docs (cross-navigation)
- Examples (usage examples for skills)

STEP 6: Evaluate DOCUMENTATION_INDEX.md:
- Are categories intuitive and non-overlapping?
- Would a user find what they need quickly?
- Are there too many or too few top-level categories?

Write findings as JSONL to: .claude/state/doc-optimizer/wave4-navigation.jsonl

Each line must be valid JSON with these fields:
{
  "category": "documentation",
  "title": "Navigation: <description>",
  "fingerprint": "documentation::<file>::nav-<type>",
  "severity": "S3",
  "effort": "E1|E2",
  "confidence": 65,
  "files": ["doc-file.md"],
  "why_it_matters": "Poor navigation causes readers to miss relevant docs",
  "suggested_fix": "specific improvement (add TOC, add diagram, add links)",
  "acceptance_tests": ["Document has TOC", "Navigation path exists from entry point"],
  "auto_fixed": false,
  "agent": "4C",
  "wave": 4,
  "finding_type": "enhancement"
}

**Follow the CRITICAL RETURN PROTOCOL defined in "Agent Return Protocol" above.** Agent ID: 4C, output: .claude/state/doc-optimizer/wave4-navigation.jsonl
```

#### Wave 4 Checkpoint

```bash
for f in wave4-quality.jsonl wave4-gaps.jsonl wave4-navigation.jsonl; do
  if [ -s ".claude/state/doc-optimizer/$f" ]; then
    echo "OK: $f ($(wc -l < ".claude/state/doc-optimizer/$f") findings)"
  else
    echo "WARN: $f missing or empty"
  fi
done
```

Update `progress.json`: Wave 4 = "completed"

**Display:**

```
Wave 4 Complete (Enhancement & Optimization)
  4A Quality:     X docs scored, bottom-20 identified
  4B Gaps:        X content gaps, Y consolidation opportunities
  4C Navigation:  X nav improvements, Y TOC candidates, Z diagram opportunities
  All waves complete. Proceeding to unification...
```

---

### STEP 7: Unification

Concatenate all 13 JSONL files into a single unified output.

```bash
# Concatenate all wave outputs
cat .claude/state/doc-optimizer/wave1-format.jsonl \
    .claude/state/doc-optimizer/wave1-headers.jsonl \
    .claude/state/doc-optimizer/wave1-external-links.jsonl \
    .claude/state/doc-optimizer/wave1-accuracy.jsonl \
    .claude/state/doc-optimizer/wave2-internal-links.jsonl \
    .claude/state/doc-optimizer/wave2-orphans.jsonl \
    .claude/state/doc-optimizer/wave2-lifecycle.jsonl \
    .claude/state/doc-optimizer/wave2-crossrefs.jsonl \
    .claude/state/doc-optimizer/wave3-coherence.jsonl \
    .claude/state/doc-optimizer/wave3-structure.jsonl \
    .claude/state/doc-optimizer/wave4-quality.jsonl \
    .claude/state/doc-optimizer/wave4-gaps.jsonl \
    .claude/state/doc-optimizer/wave4-navigation.jsonl \
    > .claude/state/doc-optimizer/all-findings-raw.jsonl 2>/dev/null
```

**Note:** Use `2>/dev/null` to handle any missing files gracefully. Missing
files from failed agents are already noted in progress.json.

**Deduplicate by fingerprint** (keep highest severity):

- Parse each line as JSON
- Group by `fingerprint`
- For duplicates, keep the finding with: (1) highest severity, (2) highest
  confidence, (3) most evidence items

**Filter against FALSE_POSITIVES.jsonl** (if it exists):

- Match by file pattern and title pattern
- Check expiration dates on false positives

**Sort the final output by:**

1. `finding_type`: "issue" before "enhancement"
2. `severity`: S0 > S1 > S2 > S3
3. `effort`: E0 > E1 > E2 > E3 (quick wins first)
4. `files[0]`: alphabetical

Write final output to: `.claude/state/doc-optimizer/all-findings.jsonl`

---

### STEP 8: Report

Generate `.claude/state/doc-optimizer/SUMMARY_REPORT.md`:

```markdown
# Documentation Optimizer Report - [DATE]

## Executive Summary

- **Documents scanned:** X
- **Auto-fixes applied:** Y
- **Issues found:** Z
- **Enhancement opportunities:** W
- **Agents completed:** 13/13 (or note failures)

### Severity Breakdown (Issues Only)

| Severity | Count |
| -------- | ----- |
| S0       | X     |
| S1       | Y     |
| S2       | Z     |
| S3       | W     |

### Finding Types

| Type         | Count |
| ------------ | ----- |
| Issues       | X     |
| Enhancements | Y     |
| Auto-fixed   | Z     |

## Auto-Fixes Applied

| File            | Fix                  | Agent |
| --------------- | -------------------- | ----- |
| path/to/file.md | Added missing header | 1B    |
| ...             | ...                  | ...   |

## Top 20 Issues (Priority-Ranked)

| #   | Severity | File       | Issue                | Effort | Agent |
| --- | -------- | ---------- | -------------------- | ------ | ----- |
| 1   | S1       | file.md:15 | Broken internal link | E0     | 2A    |
| ... | ...      | ...        | ...                  | ...    | ...   |

## Top 20 Enhancement Opportunities (Impact-Ranked)

| #   | File            | Recommendation             | Effort | Agent |
| --- | --------------- | -------------------------- | ------ | ----- |
| 1   | ARCHITECTURE.md | Add Mermaid system diagram | E1     | 4C    |
| ... | ...             | ...                        | ...    | ...   |

## Per-Wave Breakdown

### Wave 1: Independent Analysis

- Format & Lint (1A): X auto-fixed, Y remaining
- Headers (1B): X auto-fixed, Y remaining
- External Links (1C): X broken URLs
- Content Accuracy (1D): X inaccuracies

### Wave 2: Graph-Dependent Analysis

- Internal Links (2A): X broken, Y auto-fixed
- Orphans (2B): X orphaned docs
- Lifecycle (2C): X stale, Y archive candidates
- Cross-Refs (2D): X dependency issues

### Wave 3: Issue Synthesis

- Coherence (3A): X duplications, Y terminology issues
- Structure (3B): X misclassifications

### Wave 4: Enhancement & Optimization

- Quality (4A): Bottom-20 docs listed below
- Gaps (4B): X content gaps, Y consolidation opportunities
- Navigation (4C): X improvements, Y TOC candidates

## Bottom-20 Quality Scores (from Agent 4A)

| #   | File    | Score  | Top Issue                   |
| --- | ------- | ------ | --------------------------- |
| 1   | file.md | 3.2/10 | Poor clarity, no cross-refs |
| ... | ...     | ...    | ...                         |

## Content Gap Analysis (from Agent 4B)

### Undocumented Code Areas

- scripts/foo.js: No documentation found
- ...

### Consolidation Candidates

- docs/A.md + docs/B.md -> Merge into docs/combined.md
- ...

## Navigation Recommendations (from Agent 4C)

### TOC Needed

- docs/long-doc.md (250 lines, no TOC)
- ...

### Diagram Opportunities

- ARCHITECTURE.md: System overview deserves Mermaid diagram
- ...

## Agent Failures (if any)

| Agent                   | Wave | Error | Impact |
| ----------------------- | ---- | ----- | ------ |
| (none if all succeeded) |

---

_Generated by /doc-optimizer on [DATE]_ _Findings file:
.claude/state/doc-optimizer/all-findings.jsonl_
```

**Display summary to user:**

```
Documentation Optimizer Complete
  Scanned:       X documents
  Auto-fixed:    Y issues
  Issues found:  Z (S0: A, S1: B, S2: C, S3: D)
  Enhancements:  W recommendations
  Report:        .claude/state/doc-optimizer/SUMMARY_REPORT.md
  Findings:      .claude/state/doc-optimizer/all-findings.jsonl
```

---

### STEP 9: TDMS Intake (User-Confirmed)

Offer to ingest findings into the Technical Debt Management System:

```bash
# Dry run first
node scripts/debt/intake-audit.js .claude/state/doc-optimizer/all-findings.jsonl --source "doc-optimizer-$(date +%Y-%m-%d)" --dry-run
```

Show the dry-run output to the user. If they approve:

```bash
# Real intake
node scripts/debt/intake-audit.js .claude/state/doc-optimizer/all-findings.jsonl --source "doc-optimizer-$(date +%Y-%m-%d)"
```

**CRITICAL:** After intake, also copy MASTER_DEBT.jsonl to raw/deduped.jsonl to
prevent generate-views.js from overwriting intake results:

```bash
cp docs/technical-debt/MASTER_DEBT.jsonl docs/technical-debt/raw/deduped.jsonl
```

---

### STEP 10: Cleanup & Artifact Removal

#### 10.1: Regenerate Docs Index

```bash
# Regenerate docs index (auto-fixed files may have changed)
npm run docs:index
```

#### 10.2: Stage & Commit Fixes

Ask user: "Would you like me to stage the auto-fixed files for commit?"

If yes:

```bash
# Stage only the auto-fixed doc files (not state files)
git add docs/ .claude/skills/ *.md
git status
```

#### 10.3: Delete Temp Files

After the fix plan is committed and TDMS intake is complete, remove the working
directory:

```bash
# Remove all doc-optimizer temp/working files
rm -rf .claude/state/doc-optimizer/

# Also remove any plan files created during the process
rm -f .claude/plans/doc-optimizer-fixes.md
```

These files are gitignored and only needed during the active run. The
`progress.json` recovery system is no longer needed once findings are committed
and ingested into TDMS.

#### 10.4: Remove Obsolete Audit/Review Artifacts

After TDMS intake confirms all findings are in MASTER_DEBT.jsonl, the source
audit/review files in `docs/` are redundant. Survey and offer to remove them.

**What qualifies as obsolete:**

- `docs/audits/` -- per-session audit outputs (JSONL, markdown reports)
- `docs/archive/technical-debt-sources-*/` -- raw audit source data
- `docs/archive/tdms-intermediates-*/` -- pipeline intermediate files
- `docs/archive/completed-audits/` -- previously archived audit results
- `docs/archive/deprecated-findings-docs/` -- superseded findings
- `docs/archive/source-data/` -- raw data that fed into audits
- `docs/archive/obsolete-scripts-*/` -- scripts replaced by current pipeline

**Procedure:**

1. List candidate directories with file counts and sizes:

```bash
# Survey obsolete audit/review artifacts
for dir in docs/audits docs/archive/technical-debt-sources-* \
  docs/archive/tdms-intermediates-* docs/archive/completed-audits \
  docs/archive/deprecated-findings-docs docs/archive/source-data \
  docs/archive/obsolete-scripts-*; do
  if [ -d "$dir" ]; then
    count=$(find "$dir" -type f | wc -l)
    size=$(du -sh "$dir" 2>/dev/null | cut -f1)
    echo "$dir: $count files, $size"
  fi
done
```

2. Present the list to the user with total counts.

3. If user approves removal:

```bash
# Remove obsolete directories (only after user confirmation)
rm -rf docs/audits/
rm -rf docs/archive/technical-debt-sources-*/
rm -rf docs/archive/tdms-intermediates-*/
rm -rf docs/archive/completed-audits/
rm -rf docs/archive/deprecated-findings-docs/
rm -rf docs/archive/source-data/
rm -rf docs/archive/obsolete-scripts-*/
```

4. Regenerate docs index and commit:

```bash
npm run docs:index
git add -A docs/
git commit -m "chore: remove obsolete audit/review artifacts after TDMS intake"
```

**Important:** Do NOT remove:

- `docs/technical-debt/` -- active TDMS system (MASTER_DEBT.jsonl, views, etc.)
- `docs/archive/completed-plans/` -- product planning history
- `docs/templates/` -- reusable templates
- `docs/agent_docs/` -- active agent reference docs
- `docs/decisions/` -- Architecture Decision Records

---

## Recovery & Error Handling

### progress.json Recovery

If context compacts mid-run, read `progress.json` to determine current state:

| Progress State                       | Resume Action        |
| ------------------------------------ | -------------------- |
| Wave 0 pending                       | Start from beginning |
| Wave 0 complete, Wave 1 pending      | Run Wave 1           |
| Wave 1 complete, Wave 2 pending      | Run Wave 2           |
| Wave 2 complete, Wave 3 pending      | Run Wave 3           |
| Wave 3 complete, Wave 4 pending      | Run Wave 4           |
| Wave 4 complete, unification pending | Run Step 7           |
| Unification complete, report pending | Run Step 8           |

### Agent Failure Handling

- **Agent produces empty output:** Log warning, continue with remaining agents.
  Note in SUMMARY_REPORT.md.
- **Agent crashes:** Log error in progress.json, continue. The wave checkpoint
  will note the missing file.
- **Script fails (e.g., markdownlint not found):** Capture stderr, create a
  meta-finding about the tooling gap, continue.
- **Edit conflicts between agents:** Agent 1B runs after 1A specifically to
  avoid this. All other agents either read-only or edit different files.
- **Wave 4 failures:** These agents are purely additive (no auto-fixes), so
  failures don't block unification or earlier findings.

### Context Compaction Safety

Critical state is persisted in:

1. `progress.json` -- wave/agent completion status
2. `shared-state.json` -- file inventory and link graph
3. Individual `wave*.jsonl` files -- per-agent findings
4. `all-findings.jsonl` -- unified output (created in Step 7)

All files are in `.claude/state/doc-optimizer/` which is gitignored.

---

## Context Recovery

If context compacts mid-skill:

```bash
# Check current progress
cat .claude/state/doc-optimizer/progress.json 2>/dev/null

# Count completed wave files
ls -1 .claude/state/doc-optimizer/wave*.jsonl 2>/dev/null | wc -l

# Check if shared-state exists
ls -la .claude/state/doc-optimizer/shared-state.json 2>/dev/null
```

Resume from the last completed wave.

---

## Usage

```
/doc-optimizer
```

No arguments needed. The skill scans all non-archived docs automatically.

---

## Related Skills

- `/audit-documentation` -- Read-only diagnostic audit (18 agents, report-only)
- `/audit-comprehensive` -- Full 7-domain audit including documentation
- `/docs-sync` -- Quick document sync check

---

## Documentation References

### TDMS Integration (Required for Step 9)

- [PROCEDURE.md](docs/technical-debt/PROCEDURE.md) -- Full TDMS workflow
- [MASTER_DEBT.jsonl](docs/technical-debt/MASTER_DEBT.jsonl) -- Canonical debt
  store
- Intake:
  `node scripts/debt/intake-audit.js <output.jsonl> --source "doc-optimizer-<date>"`

### Documentation Standards

- [JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md) -- Output
  format
- [DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md) -- 5-tier
  hierarchy

### Scripts Leveraged

| Script                              | Used By  | Purpose                 |
| ----------------------------------- | -------- | ----------------------- |
| `scripts/check-doc-headers.js`      | Agent 1B | Header validation       |
| `scripts/check-docs-light.js`       | Agent 1B | Light doc check         |
| `scripts/check-external-links.js`   | Agent 1C | External URL validation |
| `scripts/check-content-accuracy.js` | Agent 1D | Accuracy checks         |
| `scripts/check-document-sync.js`    | Agent 2D | Template-instance sync  |
| `scripts/check-cross-doc-deps.js`   | Agent 2D | Dependency rules        |
| `scripts/check-doc-placement.js`    | Agent 2C | Placement/archival      |

---

## Update Dependencies

When modifying this skill, also update:

| Document                           | Section                  |
| ---------------------------------- | ------------------------ |
| `docs/SLASH_COMMANDS_REFERENCE.md` | /doc-optimizer reference |
| `.claude/skills/SKILL_INDEX.md`    | Add doc-optimizer entry  |

---

## Version History

| Version | Date       | Description                                                     |
| ------- | ---------- | --------------------------------------------------------------- |
| 1.3     | 2026-02-14 | Dedupe CRITICAL RETURN PROTOCOL (13x inline -> 1 shared ref)    |
| 1.2     | 2026-02-07 | Step 10 expanded: temp file cleanup + obsolete artifact removal |
| 1.1     | 2026-02-07 | Context safety: return protocol, wave chunking, budget checks   |
| 1.0     | 2026-02-07 | Initial version: 5-wave, 13-agent doc optimizer                 |
