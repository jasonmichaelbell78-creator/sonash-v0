# Doc-Optimizer Agent Prompts

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Parent skill:** `.claude/skills/doc-optimizer/SKILL.md` **Agents:** 13 across
5 waves

---

## Wave 1: Independent Analysis

### Agent 1A: Format & Lint Fixer (AUTO-FIX)

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

---

### Agent 1C: External Link Validator (REPORT)

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

---

### Agent 1D: Content Accuracy Checker (MIXED)

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

---

### Agent 1B: Header & Metadata Fixer (AUTO-FIX + REPORT)

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

---

## Wave 2: Graph-Dependent Analysis

### Agent 2A: Internal Link Fixer (MIXED)

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

---

### Agent 2B: Orphan & Connectivity Analyzer (REPORT)

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

---

### Agent 2C: Freshness & Lifecycle Analyzer (REPORT)

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

---

### Agent 2D: Cross-Reference & Dependency Checker (REPORT)

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

---

## Wave 3: Issue Synthesis

### Agent 3A: Coherence & Duplication Detector (REPORT)

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

---

### Agent 3B: Structure & Classification Reviewer (REPORT)

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

---

## Wave 4: Enhancement & Optimization

### Agent 4A: Quality & Readability Scorer (REPORT)

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

---

### Agent 4B: Content Gap & Consolidation Analyzer (REPORT)

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

---

### Agent 4C: Visual & Navigation Enhancer (REPORT)

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
