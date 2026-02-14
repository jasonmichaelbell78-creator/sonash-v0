# [Project Name] Multi-AI AI Optimization Audit Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Tier:** 3 (Planning)
**Status:** PENDING
**Overall Completion:** 0%
<!-- prettier-ignore-end -->

> **Multi-Agent Capability Note:** This template assumes orchestration by Claude
> Code which can spawn parallel agents via the Task tool. Other AI systems
> (ChatGPT, Gemini, etc.) cannot call multiple agents and should execute
> sections sequentially or use external orchestration.

---

> **Shared Boilerplate:** Common sections (AI Models, Severity/Effort scales,
> JSONL schema, TDMS integration, Aggregation process) are canonicalized in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md). Domain-specific content
> below takes precedence.

## Purpose

This document serves as the **execution plan** for running a multi-AI audit of
the AI infrastructure and optimization opportunities in [Project Name]. Use this
template when:

- AI infrastructure has grown significantly (50+ skills, 25+ hooks)
- Token costs or session times are increasing
- Skill overlap or dead automation suspected
- Hook latency impacting developer experience
- Context window management needs review
- Quarterly AI infrastructure health check
- After major Claude Code or MCP updates

**Review Scope (12 Domains):**

| #   | Domain                  | Location                           | Count |
| --- | ----------------------- | ---------------------------------- | ----- |
| 1   | Dead documentation      | `docs/`, `docs/archive/`           | [X]   |
| 2   | Dead scripts            | `scripts/`, `package.json`         | [X]   |
| 3   | Fragile parsing         | `scripts/*.js`, `.claude/hooks/`   | [X]   |
| 4   | Format waste            | Hook output, script output         | [X]   |
| 5   | AI instruction bloat    | `.claude/skills/`, `CLAUDE.md`     | [X]   |
| 6   | Hook latency            | `.claude/hooks/`                   | [X]   |
| 7   | Subprocess overhead     | `.claude/hooks/`, `scripts/`       | [X]   |
| 8   | Skill overlap           | `.claude/skills/`                  | [X]   |
| 9   | Agent prompt quality    | `.claude/skills/*/SKILL.md`        | [X]   |
| 10  | MCP config efficiency   | `.claude/mcp.json`, `scripts/mcp/` | [X]   |
| 11  | Context optimization    | Skills, hooks, session startup     | [X]   |
| 12  | Memory/state management | `.claude/state/`, `.claude/hooks/` | [X]   |

---

## AI Optimization Audit Prompt (Copy for Each AI Model)

You are auditing **[Project Name]** for AI infrastructure optimization
opportunities. This project uses Claude Code as the primary AI development tool,
with extensive hook/skill/MCP infrastructure.

### Context

- **Stack:** Next.js 16, React 19, Firebase, TypeScript, Tailwind CSS
- **AI Infrastructure:**
  - `.claude/hooks/` — ~29 hooks (SessionStart, PostToolUse, etc.)
  - `.claude/skills/` — ~52 skills (audit, session, development, etc.)
  - `.claude/mcp.json` — ~6 MCP servers configured
  - `scripts/` — ~61 standalone scripts
  - `docs/` — ~200+ documentation files
- **Key Files:**
  - `CLAUDE.md` — Core AI rules (~120 lines, progressive disclosure)
  - `SESSION_CONTEXT.md` — Current sprint context
  - `.claude/state/` — Persistent state files (commit-log, velocity, etc.)

### Instructions

Analyze the following 12 domains. For each finding, provide a JSONL object.

**IMPORTANT:**

- Only report findings you have HIGH confidence in (>70%)
- Provide specific file paths and line references
- Distinguish between "definitely unused" and "possibly unused"
- Check cross-references before flagging something as dead
- AI instruction files are intentionally detailed — flag bloat only when content
  is genuinely redundant or duplicated

---

### Domain 1: Dead Documentation

Look for documentation files that are:

- Not referenced by any other file in the project
- Marked as DEPRECATED but not in `docs/archive/`
- Have content that's been superseded by other docs
- Referenced in index files but the content is stale/irrelevant

**Check:** `docs/`, `docs/agent_docs/`, `docs/plans/`, `docs/templates/`

### Domain 2: Dead Scripts

Look for scripts that are:

- Not referenced in `package.json` scripts section
- Not called by any hook, skill, or other script
- Not called by any CI workflow (`.github/workflows/`)
- Have an entry in `package.json` that points to a missing file

**Check:** `scripts/*.js`, `scripts/*/*.js`, `package.json`

### Domain 3: Fragile Parsing

Look for code that uses:

- Complex regex to parse structured data (JSONL, markdown, etc.)
- String splitting/manipulation where `JSON.parse` should be used
- Multi-line regex with greedy quantifiers (ReDoS risk)
- Manual path construction where `path.join`/`path.resolve` should be used

**Check:** `scripts/*.js`, `.claude/hooks/*.js`

### Domain 4: Format Waste

Look for:

- Verbose `console.log` output in hooks that runs every session
- Status messages that repeat information already shown
- Scripts producing human-readable output that's only machine-consumed
- JSONL files with fields that are always null or empty

**Check:** `.claude/hooks/*.js`, `scripts/*.js`

### Domain 5: AI Instruction Bloat

Look for:

- SKILL.md files >500 lines — check for duplicated boilerplate
- Skills that share >50% content without referencing a shared base
- Example code blocks >20 lines that should be external files
- CLAUDE.md content that duplicates reference docs
- Hook scripts with inline prompts >10 lines

**Check:** `.claude/skills/*/SKILL.md`, `CLAUDE.md`, `.claude/hooks/*.js`

### Domain 6: Hook Latency

Look for:

- Hooks that spawn multiple synchronous child processes
- Sequential operations that could be parallelized
- File reads of large files (>10KB) on every hook trigger
- Hooks doing work that's only needed occasionally
- Slow operations on the critical path (SessionStart, PreToolUse)

**Check:** `.claude/hooks/*.js`

### Domain 7: Subprocess Overhead

Look for:

- `execFileSync` / `execSync` / `spawnSync` calls in hooks
- The same script called by multiple hooks redundantly
- Node.js child processes for operations that could be inline
- Scripts that shell out to `git` for simple checks when JS Git libs exist

**Check:** `.claude/hooks/*.js`, `scripts/*.js`

### Domain 8: Skill Overlap

Look for:

- Skills with overlapping purposes (e.g., two review skills)
- Skills that reference the same underlying scripts
- Skills that could be consolidated into a single skill with parameters
- Orphaned skills that aren't in the SKILL_INDEX

**Check:** `.claude/skills/*/SKILL.md`, `.claude/skills/SKILL_INDEX.md`

### Domain 9: Agent Prompt Quality

Look for:

- Agent prompts (Task tool calls in skills) missing output file paths
- Prompts missing JSONL schema specification
- Prompts missing the CRITICAL RETURN PROTOCOL
- Vague prompts without specific instructions ("analyze the code")
- Prompts that don't mention FALSE_POSITIVES.jsonl exclusion

**Check:** `.claude/skills/*/SKILL.md` (sections with `Task(` calls)

### Domain 10: MCP Config Efficiency

Look for:

- MCP servers configured but never referenced in skills/hooks
- MCP tools that duplicate built-in capabilities
- Misconfigured server endpoints or missing auth
- Opportunities to use MCP tools instead of manual API calls

**Check:** `.claude/mcp.json`, `scripts/mcp/`, `.claude/skills/*/SKILL.md`

### Domain 11: Context Optimization

Look for:

- Session-begin reading files that aren't always needed
- Skills that read entire large files when only headers/sections needed
- Hooks injecting large text blocks into conversation context
- Progressive disclosure tiers not working as designed
- The same file being read multiple times in a single skill flow

**Check:** `.claude/skills/session-begin/`, `.claude/skills/*/SKILL.md`,
`.claude/hooks/*.js`

### Domain 12: Memory & State Management

Look for:

- State files in `.claude/state/` >100KB without rotation
- JSONL log files (commit-log, override-log) growing without bounds
- Temporary files that persist across sessions
- State files referenced in code but never actually created
- Memory files (MEMORY.md, topic files) that are stale or contradictory

**Check:** `.claude/state/`, `.claude/hooks/`, `MEMORY.md`

---

### Output Format

For EACH finding, output one JSONL line:

```json
{
  "category": "ai-optimization",
  "title": "Short, specific description",
  "fingerprint": "ai-optimization::<file_or_scope>::<issue_slug>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 70-100,
  "files": ["path/to/affected/file"],
  "why_it_matters": "1-3 sentence impact explanation focused on token cost, latency, or reliability",
  "suggested_fix": "Concrete remediation direction",
  "acceptance_tests": ["How to verify this is fixed"],
  "evidence": ["Specific code/config that shows the issue"]
}
```

### Severity Guidelines (AI Optimization Specific)

| Severity | AI Optimization Examples                                |
| -------- | ------------------------------------------------------- |
| **S0**   | Hook causes session crash, data loss in state files     |
| **S1**   | >100 tokens wasted per session, >5s hook latency        |
| **S2**   | 10-100 tokens wasted, skill overlap causing confusion   |
| **S3**   | Minor naming inconsistency, cosmetic output improvement |

### Quality Guardrails

1. **Minimum confidence: 70** — Don't guess. If unsure, skip it.
2. **Evidence required for S0/S1** — Include specific code snippets or metrics.
3. **Cross-reference before "dead"** — Check package.json, hooks, skills, CI
   workflows, and other scripts before calling something dead.
4. **Respect intentional design** — SKILL.md files are intentionally detailed.
   Only flag genuine duplication or content that could be shared/external.
5. **Check FALSE_POSITIVES** — Read `docs/technical-debt/FALSE_POSITIVES.jsonl`
   and exclude known patterns.

---

## Aggregation Process

After collecting responses from all AI models:

### Step 1: Collect Raw Outputs

Place each model's JSONL output in:

```
docs/audits/multi-ai/<session-id>/raw/<model-name>.jsonl
```

### Step 2: Normalize

```bash
node scripts/multi-ai/normalize-format.js docs/audits/multi-ai/<session-id>/raw/
```

### Step 3: Aggregate Per Category

```bash
node scripts/multi-ai/aggregate-category.js docs/audits/multi-ai/<session-id>/raw/ \
  --output docs/audits/multi-ai/<session-id>/canon/
```

### Step 4: Unify Cross-Category

```bash
node scripts/multi-ai/unify-findings.js docs/audits/multi-ai/<session-id>/canon/ \
  --output docs/audits/multi-ai/<session-id>/final/unified.jsonl
```

### Step 5: TDMS Intake

```bash
node scripts/debt/intake-audit.js \
  docs/audits/multi-ai/<session-id>/final/unified.jsonl \
  --source "multi-ai-ai-optimization-$(date +%Y-%m-%d)"
```

### Step 6: Generate Views

```bash
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

---

## TDMS Integration

All deferred or confirmed findings flow into the Technical Debt Management
System:

```bash
# Validate schema first
node scripts/debt/validate-schema.js <findings.jsonl>

# Intake to TDMS
node scripts/debt/intake-audit.js <findings.jsonl> --source "audit-source-tag"

# Regenerate views
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

**False Positives:** Add to `docs/technical-debt/FALSE_POSITIVES.jsonl`:

```json
{
  "fingerprint": "ai-optimization::file::issue",
  "reason": "Intentional design"
}
```

---

## Completion Tracking

| Domain                  | Model 1 | Model 2 | Model 3 | Model 4 | Aggregated |
| ----------------------- | ------- | ------- | ------- | ------- | ---------- |
| Dead documentation      | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Dead scripts            | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Fragile parsing         | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Format waste            | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| AI instruction bloat    | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Hook latency            | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Subprocess overhead     | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Skill overlap           | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Agent prompt quality    | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| MCP config efficiency   | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Context optimization    | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |
| Memory/state management | [ ]     | [ ]     | [ ]     | [ ]     | [ ]        |

---

## Version History

| Version | Date       | Change           |
| ------- | ---------- | ---------------- |
| 1.0     | 2026-02-14 | Initial creation |
