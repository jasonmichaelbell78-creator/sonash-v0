# Implementation Plan: Website-Analysis Skill

## Summary

Build `/website-analysis` — a creator-first website analysis skill that mirrors
`/repo-analysis` architecture but is designed for web content. Four modes (Page,
Site, Expedition, Cross-site), three depth tiers (Quick/Standard/Deep),
dual-lens output (Creator View + Engineer View), with `superpowers-chrome` as
primary extractor and `WebFetch` as processed content complement. Companion
`/website-synthesis` skill for cross-site analysis.

**Decisions:** See [DECISIONS.md](./DECISIONS.md) (36 decisions) **Effort
Estimate:** XL (multi-session implementation) **Research:**
`.research/website-analysis/` (RESEARCH_OUTPUT.md, BRAINSTORM.md, 28 findings
files, EXTRACTION_TEST.md)

## Files to Create

### New Files (4)

1. **`.claude/skills/website-analysis/SKILL.md`** — Core skill definition (<300
   lines)
2. **`.claude/skills/website-analysis/REFERENCE.md`** — Schemas, dimensions,
   templates, scoring rubrics
3. **`.claude/skills/website-synthesis/SKILL.md`** — Cross-site synthesis
   companion skill
4. **`.claude/skills/website-synthesis/REFERENCE.md`** — Synthesis schemas,
   paradigm templates

### Modified Files (3)

1. **`DOCUMENTATION_INDEX.md`** — Add website-analysis and website-synthesis
   entries
2. **`.research/research-index.jsonl`** — Extend schema with website type fields
   (Per Decision #12)
3. **`CLAUDE.md`** — Add `/website-analysis` trigger in Section 7 Agent/Skill
   Triggers table

---

## Step 1: SKILL.md — Core Skill Definition

Write `.claude/skills/website-analysis/SKILL.md` (<300 lines per
SKILL_STANDARDS). Structure mirrors repo-analysis SKILL.md.

**Sections to include:**

1. **YAML frontmatter** — name, description
2. **Critical Rules** (front-loaded per SKILL_STANDARDS attention management)
   - Write-to-disk-first on every phase
   - Compliance check before any extraction (Per Decision #14)
   - superpowers-chrome as primary extractor (Per Decision #1)
   - No silent skips — retry once, report to user
   - State file on every phase transition (Per Decision #6)
   - Creator View mandatory for Standard/Deep
   - Conversational prose, not tables
3. **When to Use / When NOT to Use**
4. **Input specification** — URL (single or list), mode flags, depth tier
5. **Process Overview** — phase flow diagram:
   ```
   VALIDATE   → Tool availability check (superpowers-chrome? fallback?)
   PREFLIGHT  → Compliance (robots.txt, cf-mitigated, RSS detection)
   PHASE 0    → Quick Scan (navigate + eval + screenshot analysis)
   GATE       → Interactive (Run Standard/Deep? [y/N])
   PHASE 1    → Multi-page extraction (Site mode: auto-discovery or URL list)
   PHASE 2    → Creator View (7 sections, home context comparison)
   PHASE 3    → Engineer View (6 dimensions, 4-band scoring)
   PHASE 4    → Value Map (knowledge candidates ranked)
   ROUTING    → Menu (7 options)
   ```
6. **Mode definitions** — Page, Site, Expedition, Cross-site (brief, detail in
   REFERENCE.md)
7. **Extraction pipeline** — Per Decision #1:
   ```
   Step 1: superpowers-chrome navigate (→ HTML + MD + PNG + console)
   Step 2: superpowers-chrome eval   (→ metadata JSON)
   Step 3: WebFetch with prompt      (→ processed content) [Standard/Deep]
   Step 4: curl -sI                  (→ HTTP headers)      [Deep]
   ```
8. **Tool fallback** — Per Decision #27: detect superpowers-chrome availability,
   degrade to WebFetch + Playwright MCP + curl
9. **State file & resume**
10. **Compaction resilience**
11. **Guard rails**
12. **Version history**

**Done when:** SKILL.md exists, <300 lines, all Critical Rules from decisions
represented, MUST/SHOULD/MAY hierarchy applied. **Depends on:** None
**Triggers:** Step 2

---

## Step 2: REFERENCE.md — Schemas, Dimensions, Templates

Write `.claude/skills/website-analysis/REFERENCE.md`. This is the comprehensive
reference (no line limit). Structure mirrors repo-analysis REFERENCE.md.

**Sections to include:**

### Section 1: Output Schemas (Per Decision #12)

Per-site artifacts in `.research/website-analysis/<site-slug>/`:

```
<site-slug>/
├── analysis.json          # Core analysis (shared schema + website extensions)
├── findings.jsonl         # Per-finding records (shared schema)
├── value-map.json         # Knowledge candidates ranked (shared schema)
├── links.json             # Scored link candidates (website-only)
├── assets.json            # Images, downloadable files (website-only)
├── tables.json            # Extracted HTML tables (website-only, Per Decision #26)
├── meta.json              # Site metadata: OG, JSON-LD, etc. (website-only)
├── sitemap.json           # Site structure map (website-only)
├── SITE-ANALYSIS.md       # Human-readable Creator View report
├── trends.jsonl           # Append-only per-run tracking
└── expedition-*.{meta.json,snap.json,jsonl}  # Expedition state (Per Decision #18)
```

Cross-entity in `.research/`:

```
extraction-journal.jsonl   # Append-only extraction decisions (shared)
EXTRACTIONS.md             # Auto-regenerated grouped view (shared)
reading-chain.jsonl        # Cross-site relationships (shared)
research-index.jsonl       # Extended with website type fields
```

Include full JSON schemas for each artifact — field names, types, enums,
required vs optional. Mirror repo-analysis schema where field names overlap.

### Section 2: Value Axes (Per Decision #10)

Define all 13 value axes with:

- Description
- Measurement signals (what to look for in extracted content)
- Scoring rubric (1-5 scale per axis)

### Section 3: Absence Patterns (Per Decision #11)

Define all 11 patterns with:

- Detection signals
- Severity level
- Recommended action
- Detection capability by tier (Quick/Standard/Deep)

### Section 4: Creator View Template (Per Decision #9)

7-section template with:

- Section purpose
- Tone guidance (conversational prose)
- Example phrases
- Required home context sources (Per Decision #28)

### Section 5: Engineer View Dimensions (Per Decision #25)

6 dimensions with:

- What to measure
- How to measure (which extraction data to use)
- 4-band scoring thresholds

### Section 6: Scoring & Verdicts (Per Decision #13)

- 4-band health scale (Excellent/Healthy/Needs Work/Critical)
- Creator verdict scale (Study/Explore/Extract/Note)
- Composite scoring formula

### Section 7: Compliance Pre-flight (Per Decision #14)

- robots.txt check procedure
- `cf-mitigated` header detection (Per Decision #30)
- RSS/Atom feed detection (Per Decision #34)
- 3-tier classification: HARD_BLOCK / WARN / PROCEED
- HARD_BLOCK produces minimal analysis.json with reason

### Section 8: Link Scoring (Per Decisions #21, #22)

- Default weight formula
- `--link-weights` override spec
- High-link-density trigger (>40 external links)

### Section 9: URL-to-Slug Algorithm (Per Decision #23)

- Step-by-step conversion
- 80-char max, SHA-256 suffix
- Windows MAX_PATH calculation

### Section 10: Expedition Mode (Per Decisions #17, #18)

- HITL UX template (5 options + controls)
- 3-file state pattern schemas
- Resume protocol
- Epsilon-greedy selection strategy

### Section 11: Site Mode (Per Decisions #16, #31)

- `--urls` list mode
- Auto-discovery mode (link-scored internal links)
- Approval gate pattern (every 5 pages, progress summary)

### Section 12: Routing Menu (Per Decision #24)

- 7 options with behavior spec
- Extract knowledge → journal + EXTRACTIONS.md flow

### Section 13: Agent Allocation (Per Decision #29)

- Standard: up to 2 agents
- Deep: up to 3 agents
- 4-concurrent cap
- Wave staging

### Section 14: State File Schema (Per Decision #6)

Full JSON schema for `.claude/state/website-analysis.<site-slug>.state.json`

### Section 15: Tool Fallback Matrix (Per Decision #27)

| Tool               | Primary                     | Fallback              |
| ------------------ | --------------------------- | --------------------- |
| Content extraction | superpowers-chrome navigate | WebFetch              |
| Metadata           | superpowers-chrome eval     | Playwright MCP eval   |
| Screenshot         | superpowers-chrome (auto)   | Playwright screenshot |
| HTTP headers       | curl -sI                    | curl -sI (same)       |

**Done when:** REFERENCE.md exists with all 15 sections, schemas are complete
JSON with field types, all 36 decisions referenced. **Depends on:** Step 1
(SKILL.md defines what REFERENCE.md elaborates) **Triggers:** Step 3

---

## Step 3: Website-Synthesis Companion Skill

Write `.claude/skills/website-synthesis/SKILL.md` and
`.claude/skills/website-synthesis/REFERENCE.md`.

Per Decision #20, this is a separate skill mirroring `/repo-synthesis`.

**SKILL.md (<300 lines):**

- When to use: 3+ analyzed sites in `.research/website-analysis/`
- 4 synthesis paradigms: Thematic (default), Narrative, Matrix, Meta-pattern
  (Per research Section 9)
- Thematic saturation stopping rule (3 consecutive sites, no new themes)
- Source weighting: T1 original (3x), T2 expert (2x), T3 aggregation (1x), T4
  secondary (0.5x)
- Signal types: Convergence, Divergence, Gap, Trend
- Optimal site count: 5-12 for thematic synthesis
- Output: synthesis report in `.research/website-analysis/synthesis/`

**REFERENCE.md:**

- Paradigm templates
- Signal detection rubric
- Output schemas (synthesis.json, synthesis.md)
- Cross-type synthesis hooks (future: repos + websites together)

**Done when:** Both files exist, SKILL.md <300 lines, paradigms defined,
stopping rules specified. **Depends on:** Step 1 (shared schema definitions)
**Triggers:** Step 4

---

## Step 4: Integration Updates

Update existing files to register the new skills.

### 4a: DOCUMENTATION_INDEX.md

Add entries for `/website-analysis` and `/website-synthesis` in the skills
section.

### 4b: CLAUDE.md Section 7

Add trigger row:

```
| Website/URL analysis  | `website-analysis` skill | Skill |
```

### 4c: research-index.jsonl schema

Extend with website type fields per Decision #12:

```json
{
  "type": "website",
  "url": "https://example.com",
  "domain": "example.com",
  "siteType": "Blog",
  "techStack": ["Next.js", "Tailwind"]
}
```

**Done when:** All 3 files updated, no broken cross-references. **Depends on:**
Steps 1-3 **Triggers:** Step 5

---

## Step 5: Audit

Run code-reviewer agent on all new/modified files:

- `.claude/skills/website-analysis/SKILL.md`
- `.claude/skills/website-analysis/REFERENCE.md`
- `.claude/skills/website-synthesis/SKILL.md`
- `.claude/skills/website-synthesis/REFERENCE.md`
- `DOCUMENTATION_INDEX.md`
- `CLAUDE.md`

Verify:

- [ ] SKILL.md files <300 lines each
- [ ] MUST/SHOULD/MAY hierarchy applied
- [ ] Version history sections present
- [ ] All 36 decisions from DECISIONS.md covered in plan steps
- [ ] Schema parity with repo-analysis verified (shared fields match)
- [ ] No references to tools/features that don't exist
- [ ] SKILL_STANDARDS compliance (frontmatter, When to Use, When NOT to Use)

**Done when:** All findings addressed or tracked. **Depends on:** All
implementation steps.

---

## Parallelization Guidance

- **Steps 1 and 2 are sequential** — SKILL.md defines structure, REFERENCE.md
  elaborates
- **Step 3 can run in parallel with Step 2** — website-synthesis is a separate
  skill with its own files, only shares schema definitions from Step 1
- **Step 4 depends on Steps 1-3** — needs skill names and paths
- **Step 5 depends on all** — audit runs last

```
Step 1 (SKILL.md)
  → Step 2 (REFERENCE.md) ─┐
  → Step 3 (synthesis)  ───┤
                            → Step 4 (integration) → Step 5 (audit)
```

---

## Execution Approach

**Recommended: Subagent-driven** — Steps 2 and 3 are independent and can be
dispatched as parallel subagents after Step 1 completes. Step 1 should run
inline (orchestrator) since it defines the structure both subagents reference.

| Step | Approach                   | Agent                            |
| ---- | -------------------------- | -------------------------------- |
| 1    | Inline                     | Orchestrator                     |
| 2    | Subagent                   | skill-creator or general-purpose |
| 3    | Subagent (parallel with 2) | skill-creator or general-purpose |
| 4    | Inline                     | Orchestrator                     |
| 5    | Subagent                   | code-reviewer                    |
