<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Implementation Plan: Ecosystem Audit Expansion

## Summary

Build 3 new ecosystem audits (skill, doc, script), extend 2 existing systems
(hook audit + audit-health), add compaction resilience hardening, and create a
comprehensive-ecosystem-audit orchestrator — bringing total ecosystem audits to
7 and providing a single command to run them all.

## Decision Record (from Q&A)

| Decision                      | Choice                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| Category count philosophy     | Driven by necessity and coverage, NOT by matching other audits             |
| Domain count philosophy       | Same — as many domains as needed, not locked to 5                          |
| Bloat detection placement     | Its own domain in skill-ecosystem-audit (D4: Staleness & Drift)            |
| Skill audit scope             | ALL 61+ skills, no filtering                                               |
| Cross-reference validation    | Full: file + section + content similarity                                  |
| FIX_TEMPLATES duplication     | Yes, info severity                                                         |
| Dead skill detection          | 60+ days no version history update, info severity                          |
| Registry sync                 | Bidirectional (index→fs and fs→index)                                      |
| npm alias                     | `skills:audit`                                                             |
| Doc ecosystem audit           | Own standalone audit                                                       |
| Audit-system health           | Integrate into audit-health, ensure ecosystem audits covered               |
| Script infrastructure audit   | Own standalone audit                                                       |
| CI/CD pipeline audit          | Extend hook-ecosystem-audit with CI categories                             |
| Agent orchestration audit     | Fold into skill-ecosystem-audit as a domain                                |
| State file health             | Distribute across existing audits (per recommendation)                     |
| Comprehensive ecosystem audit | New orchestrator for ALL ecosystem audits (modeled on audit-comprehensive) |
| Compaction resilience         | Layered: progress.json + pre-compaction hook + domain chunking + CRTP      |

## Execution Order

```
Phase A:   skill-ecosystem-audit          ─┐
Phase B:   doc-ecosystem-audit             ├─ Parallel
Phase C:   script-ecosystem-audit          │
Phase D:   hook-ecosystem-audit CI ext    ─┘
Phase D.5: Compaction resilience hardening  (depends on A-D paths existing)
Phase E:   audit-health extension           (depends on knowing all 7 audit paths)
Phase F:   comprehensive-ecosystem-audit    (depends on all 7 audits existing)
Phase G:   SKILL_INDEX.md updates
Phase H:   package.json npm scripts
```

## File Counts

| Deliverable                     | New Files | Modified Files |
| ------------------------------- | --------- | -------------- |
| skill-ecosystem-audit           | ~12       | 0              |
| doc-ecosystem-audit             | ~12       | 0              |
| script-ecosystem-audit          | ~12       | 0              |
| hook-ecosystem-audit CI ext     | 1         | 3              |
| Compaction resilience (D.5)     | 0         | 3              |
| audit-health extension          | 0         | 2              |
| comprehensive-ecosystem-audit   | ~5        | 0              |
| Registration (index + pkg.json) | 0         | 2              |
| **Total**                       | **~42**   | **~10**        |

---

## Phase A: skill-ecosystem-audit (NEW)

### Domains & Categories (5 domains, 21 categories)

**D1: Structural Compliance (20%)**

| #   | Category           | What It Checks                                                                                       |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | Frontmatter Schema | Required fields (name, description, version, date, status), valid format, `---` delimiters           |
| 2   | Step Continuity    | Numbered steps sequential, no gaps/duplicates, no orphan step references                             |
| 3   | Section Structure  | Required sections present (When to Use, When NOT to Use, Version History)                            |
| 4   | Bloat Score        | Total lines, pre-check subsections, evidence blocks, inline code blocks, version history — composite |

**D2: Cross-Reference Integrity (25%)**

| #   | Category                   | What It Checks                                                                      |
| --- | -------------------------- | ----------------------------------------------------------------------------------- |
| 5   | Skill→Skill References     | Every "see X skill" / "invoke Y" resolves to existing skill with cited section/step |
| 6   | Skill→Script References    | Every script path/npm command in a skill exists and is executable                   |
| 7   | Skill→Template References  | "Template N" / "FIX_TEMPLATE #N" resolves to actual templates with matching content |
| 8   | Evidence Citation Validity | PR numbers, review numbers cited in evidence blocks actually exist                  |
| 9   | Dependency Chain Health    | A→B→C skill invocation chains resolve, no circular deps, no broken links            |

**D3: Coverage & Consistency (20%)**

| #   | Category                  | What It Checks                                                                       |
| --- | ------------------------- | ------------------------------------------------------------------------------------ |
| 10  | Scope Boundary Clarity    | Overlapping skills have documented differentiation                                   |
| 11  | Trigger Accuracy          | SKILL_INDEX.md description matches actual "When to Use" section                      |
| 12  | Output Format Consistency | Skills with similar outputs use consistent schemas                                   |
| 13  | Skill Registry Sync       | Bidirectional: SKILL_INDEX.md ↔ filesystem, flag missing entries in either direction |

**D4: Staleness & Drift (15%)**

| #   | Category                 | What It Checks                                                                   |
| --- | ------------------------ | -------------------------------------------------------------------------------- |
| 14  | Version History Currency | Last update within 30 days of related code changes (git log cross-reference)     |
| 15  | Dead Skill Detection     | Skills with no version history update in 60+ days (info severity)                |
| 16  | Pattern Reference Sync   | Known Churn Patterns match current state; resolved patterns still inline = bloat |
| 17  | Inline Code Duplication  | Code blocks that duplicate FIX_TEMPLATES content (info severity)                 |

**D5: Agent Orchestration Health (20%)**

| #   | Category                    | What It Checks                                                              |
| --- | --------------------------- | --------------------------------------------------------------------------- |
| 18  | Agent Prompt Consistency    | Return protocols present, context overflow guards                           |
| 19  | Agent↔Skill Alignment       | Agent descriptions in CLAUDE.md/skills match actual invocation patterns     |
| 20  | Parallelization Correctness | Independent tasks marked parallelizable, dependent tasks properly sequenced |
| 21  | Team Configuration Health   | Team definitions reference valid agent types, no orphaned team configs      |

### Files to Create

```
.claude/skills/skill-ecosystem-audit/
├── SKILL.md
├── scripts/
│   ├── run-skill-ecosystem-audit.js
│   ├── lib/
│   │   ├── scoring.js
│   │   ├── benchmarks.js
│   │   ├── state-manager.js
│   │   └── patch-generator.js
│   └── checkers/
│       ├── structural-compliance.js
│       ├── cross-reference-integrity.js
│       ├── coverage-consistency.js
│       ├── staleness-drift.js
│       └── agent-orchestration.js
```

### Compaction Protection

- Progress.json guard (save after each user decision)
- Domain-based chunking (process D1 → save → D2 → save → etc.)

---

## Phase B: doc-ecosystem-audit (NEW)

### Domains & Categories (5 domains, 16 categories)

**D1: Index & Registry Health (20%)**

| #   | Category                | What It Checks                                                        |
| --- | ----------------------- | --------------------------------------------------------------------- |
| 1   | Index↔Filesystem Sync   | DOCUMENTATION_INDEX.md entries match actual .md files bidirectionally |
| 2   | Index Metadata Accuracy | Descriptions, categories, paths in index match file contents          |
| 3   | Orphaned Documents      | .md files in docs/ not referenced by any index, skill, or script      |

**D2: Link & Reference Integrity (25%)**

| #   | Category                      | What It Checks                                                       |
| --- | ----------------------------- | -------------------------------------------------------------------- |
| 4   | Internal Link Health          | All `[text](path)` markdown links resolve to existing files/sections |
| 5   | Cross-Doc Dependency Accuracy | `check-cross-doc-deps.js` rules still valid, no stale declarations   |
| 6   | Anchor Reference Validity     | `#section-name` anchors resolve to actual headings in target files   |
| 7   | Image & Asset References      | Referenced images/assets exist at declared paths                     |

**D3: Content Quality & Compliance (20%)**

| #   | Category                      | What It Checks                                                               |
| --- | ----------------------------- | ---------------------------------------------------------------------------- |
| 8   | Header/Frontmatter Compliance | Required headers (Purpose, Version History per doc-lint CI)                  |
| 9   | Formatting Consistency        | Consistent markdown style (tables, code block language tags, heading levels) |
| 10  | Content Freshness             | Docs referencing code that changed significantly since doc's last update     |

**D4: Generation Pipeline Health (20%)**

| #   | Category                      | What It Checks                                                        |
| --- | ----------------------------- | --------------------------------------------------------------------- |
| 11  | docs:index Script Correctness | `npm run docs:index` produces consistent output, no git-follow issues |
| 12  | doc-optimizer Pipeline        | doc-optimizer skill findings ↔ actual doc state alignment             |
| 13  | Pre-commit Doc Checks         | Doc header, cross-doc deps, doc index checks all functional           |

**D5: Coverage & Completeness (15%)**

| #   | Category               | What It Checks                                                          |
| --- | ---------------------- | ----------------------------------------------------------------------- |
| 14  | Documentation Coverage | Major systems/features with no corresponding documentation              |
| 15  | Agent Doc References   | AGENT_ORCHESTRATION.md, agent docs in CLAUDE.md all exist and current   |
| 16  | README & Onboarding    | Root README, CLAUDE.md, AI_WORKFLOW.md consistent and not contradictory |

### Files to Create

```
.claude/skills/doc-ecosystem-audit/
├── SKILL.md
├── scripts/
│   ├── run-doc-ecosystem-audit.js
│   ├── lib/
│   │   ├── scoring.js
│   │   ├── benchmarks.js
│   │   ├── state-manager.js
│   │   └── patch-generator.js
│   └── checkers/
│       ├── index-registry-health.js
│       ├── link-reference-integrity.js
│       ├── content-quality.js
│       ├── generation-pipeline.js
│       └── coverage-completeness.js
```

---

## Phase C: script-ecosystem-audit (NEW)

### Domains & Categories (5 domains, 18 categories)

**D1: Module System & Consistency (20%)**

| #   | Category                  | What It Checks                                                                        |
| --- | ------------------------- | ------------------------------------------------------------------------------------- |
| 1   | CJS/ESM Consistency       | Scripts in same directory use consistent module systems, no mixed require/import      |
| 2   | Shebang & Entry Point     | Executable scripts have proper shebangs, package.json scripts reference valid entries |
| 3   | Node.js API Compatibility | No deprecated APIs, consistent with project's Node version                            |

**D2: Safety & Error Handling (25%)**

| #   | Category              | What It Checks                                                          |
| --- | --------------------- | ----------------------------------------------------------------------- |
| 4   | File I/O Safety       | All file reads wrapped in try/catch (existsSync race condition pattern) |
| 5   | Error Sanitization    | Scripts use `sanitize-error.js`, no raw `error.message` logging         |
| 6   | Path Traversal Guards | Relative path checks use correct regex, not `startsWith('..')`          |
| 7   | exec() Safety         | Regex with `/g` flag where required, no infinite loop risk              |
| 8   | Security Helper Usage | Scripts handling file I/O, git, CLI args use `security-helpers.js`      |

**D3: Registration & Reachability (20%)**

| #   | Category                  | What It Checks                                                           |
| --- | ------------------------- | ------------------------------------------------------------------------ |
| 9   | package.json Coverage     | Scripts in npm scripts all exist; scripts NOT referenced flagged as dead |
| 10  | Cross-Script Dependencies | `require()`/`import` chains resolve, no broken internal references       |
| 11  | Shared Lib Utilization    | Scripts that could use shared libs but don't                             |

**D4: Code Quality (20%)**

| #   | Category              | What It Checks                                                        |
| --- | --------------------- | --------------------------------------------------------------------- |
| 12  | Documentation Headers | JSDoc or comment block at top describing purpose, usage, dependencies |
| 13  | Consistent Patterns   | Similar scripts follow consistent structure                           |
| 14  | Dead Code             | Exported functions never imported elsewhere, unreachable code blocks  |
| 15  | Complexity            | Scripts over 300 lines without clear function decomposition           |

**D5: Testing & Reliability (15%)**

| #   | Category           | What It Checks                                              |
| --- | ------------------ | ----------------------------------------------------------- |
| 16  | Test Coverage      | Scripts that have corresponding `__tests__/` files          |
| 17  | Test Freshness     | Test files not updated when source script changed           |
| 18  | Error Path Testing | Tests covering only happy path, no error/edge case coverage |

### Files to Create

```
.claude/skills/script-ecosystem-audit/
├── SKILL.md
├── scripts/
│   ├── run-script-ecosystem-audit.js
│   ├── lib/
│   │   ├── scoring.js
│   │   ├── benchmarks.js
│   │   ├── state-manager.js
│   │   └── patch-generator.js
│   └── checkers/
│       ├── module-consistency.js
│       ├── safety-error-handling.js
│       ├── registration-reachability.js
│       ├── code-quality.js
│       └── testing-reliability.js
```

---

## Phase D: hook-ecosystem-audit CI Extension (MODIFY)

### New Domain: D6: CI/CD Pipeline Health (10%)

Redistribute existing domain weights (each loses ~2%) to accommodate D6.

| #   | Category                    | What It Checks                                                       |
| --- | --------------------------- | -------------------------------------------------------------------- |
| 17  | Workflow↔Script Alignment   | GitHub Actions workflow steps reference valid npm scripts/commands   |
| 18  | Bot Configuration Freshness | Qodo, Gemini review bot configs exist and reference current patterns |
| 19  | CI Cache Effectiveness      | Cache keys reference current lock files, no stale cache patterns     |

### Files to Modify

- `.claude/skills/hook-ecosystem-audit/SKILL.md` — add D6, update count to 19
- `.claude/skills/hook-ecosystem-audit/scripts/lib/benchmarks.js` — add 3
  weights, rebalance
- `.claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js` —
  import new checker

### Files to Create

- `.claude/skills/hook-ecosystem-audit/scripts/checkers/cicd-pipeline.js`

---

## Phase D.5: Compaction Resilience Hardening

| Task  | File                                         | Change                                                                               |
| ----- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| D.5.1 | `.claude/hooks/pre-compaction-save.js`       | Scan `.claude/tmp/*-audit-progress.json`, include in handoff.json `activeAudits` key |
| D.5.2 | `.claude/hooks/compact-restore.js`           | Output "ACTIVE ECOSYSTEM AUDIT DETECTED: {name} at finding {N}/{total}" on restore   |
| D.5.3 | `.claude/skills/pr-ecosystem-audit/SKILL.md` | Backfill progress.json guard (save/resume pattern from hook audit)                   |
| D.5.4 | skill-ecosystem-audit SKILL.md               | Domain-based chunking: D1 → save → D2 → save → budget check between domains          |
| D.5.5 | comprehensive-ecosystem-audit SKILL.md       | CRITICAL RETURN PROTOCOL for all 7 agents + wave budget checking                     |

---

## Phase E: audit-health Extension (MODIFY)

### Changes to `scripts/audit/audit-health-check.js`

Add checks 7-9:

| Check | What It Validates                                                                       |
| ----- | --------------------------------------------------------------------------------------- |
| 7     | Ecosystem Audit Directories — all 7 skill dirs exist with required `scripts/run-*.js`   |
| 8     | Ecosystem Audit State Files — all `*-history.jsonl` state files exist and not corrupted |
| 9     | Ecosystem Audit Lib Consistency — scoring.js/state-manager.js export same API surface   |

### Changes to `.claude/skills/audit-health/SKILL.md`

- Update summary template from "X/6 health checks" to "X/9 health checks"
- Add ecosystem audit section to report template

---

## Phase F: comprehensive-ecosystem-audit (NEW)

### Wave Architecture

| Stage                | Agents       | Audits                  |
| -------------------- | ------------ | ----------------------- |
| Stage 1: Foundation  | 4 parallel   | hook, session, tdms, pr |
| Stage 2: Extended    | 3 parallel   | skill, doc, script      |
| Stage 3: Aggregation | 1 sequential | Aggregate all 7 results |

### Aggregation Output: `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md`

1. Executive Summary — overall health grade, trend
2. Domain Heat Map — weakest domains across all audits
3. Cross-Audit Insights — findings appearing in multiple audits
4. Per-Audit Summary — grade, top 3 findings, trend
5. Priority-Ranked Findings — top 20 by impact score
6. Dedup vs MASTER_DEBT

### Compaction Protection

- CRITICAL RETURN PROTOCOL for all 7 sub-audit agents
- progress.json with per-stage, per-audit completion tracking
- Wave budget checking between Stage 1 and Stage 2
- Checkpoint files for compaction recovery

### Files to Create

```
.claude/skills/comprehensive-ecosystem-audit/
├── SKILL.md
├── reference/
│   ├── WAVE_DETAILS.md
│   ├── AGGREGATION_GUIDE.md
│   └── RECOVERY_PROCEDURES.md
```

---

## Phase G: SKILL_INDEX.md Updates

Register 4 new skills:

- skill-ecosystem-audit
- doc-ecosystem-audit
- script-ecosystem-audit
- comprehensive-ecosystem-audit

Update hook-ecosystem-audit description (now 19 categories).

## Phase H: package.json npm Scripts

```json
"skills:audit":      "node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js"
"docs:audit":        "node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js"
"scripts:audit":     "node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js"
"ecosystem:audit:all": "echo 'Use /comprehensive-ecosystem-audit skill'"
```
