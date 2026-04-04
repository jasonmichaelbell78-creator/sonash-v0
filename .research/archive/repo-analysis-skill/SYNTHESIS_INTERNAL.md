# SYNTHESIS_INTERNAL — What Our Codebase Teaches About Building a Repo Analysis Skill

**Topic:** Internal codebase analysis — what our project teaches us about
building a repo analysis skill **Synthesizer:** deep-research-synthesizer
**Synthesis Date:** 2026-03-31 **Findings Processed:** 7 files (D8, D9a-1,
D9a-2, D9b-1, D9b-2, D10a, D10b) **Overall Confidence:** HIGH — all findings
derived from direct filesystem reads of canonical source files, no external
sources or training-data inference.

---

## 1. Executive Summary

Our codebase is not just the subject of a repo analysis skill — it is the most
complete existing reference implementation for what that skill should produce
and enforce. Every design decision we need to make for a `/repo-analysis` skill
has already been solved somewhere in our hooks, agents, skills, or quality
documents. The challenge is not invention; it is extraction and generalization.

Five convergent insights emerge from reading the seven findings files together.

**First, our quality infrastructure is layered in a way that directly maps to
analysis dimensions.** We enforce quality through three independent mechanisms:
automated hooks (pre-commit and pre-push gates), AI-driven review (code-reviewer
with checklist phases), and a persistent pattern registry (CODE_PATTERNS.md,
distilled from 347 reviews). These three layers cover different failure modes —
hooks catch automatable violations, code-reviewer catches contextual judgment
calls, and the pattern registry captures empirically recurring issues that
escaped both. A repo analysis skill should assess whether a target repo has all
three layers or only one [D9a-1, D9a-2, D10a].

**Second, our skill orchestration patterns are directly reusable as the repo
analysis skill's execution engine.** The audit-comprehensive staged-wave
pattern, the deep-research write-to-disk-first rule, and the ecosystem-health
trend-tracking model provide a complete orchestration blueprint. The only design
work is adapting these to a cloned external repo context rather than the home
repo [D8].

**Third, we have 44 agents, 62 skills, and 8,479 TDMS items — and the majority
of the analysis capability they encode is portable.** The Tier 1 analysis agents
(explore, gsd-codebase-mapper, security-auditor, dependency-manager,
test-engineer, performance-engineer) require zero SoNash-specific knowledge to
run against an external repo. The TDMS category taxonomy (code-quality,
security, process, documentation, refactoring, performance) is universal and
ready-made as a finding output schema [D9b-1, D9b-2].

**Fourth, our propagation registry and review learnings are an empirically
validated rubric.** The 10 propagation patterns were added only after recurring
4–6+ violation instances across multiple PRs. The review learnings log (347+
reviews) provides the most battle-tested universal checklist available. Together
they define what a "well-defended codebase" looks like in practice, not in
theory [D9a-2, D10b].

**Fifth, we do several things that almost no other repo does.** The three-layer
enforcement model (hook + AI + propagation registry), the graduated
warn-then-block escalation for pattern compliance, the mandatory deduplication
gate before TDMS intake, and the episodic memory pre-search before any review —
these are innovations worth detecting as signals when analyzing external repos.
A repo that has even one of these patterns is significantly above average
[D9a-1, D9b-2, D10b].

The repo analysis skill we are designing should be built on this foundation:
generalize the quality rubric from D10a/D10b, use the orchestration blueprint
from D8, spawn the agent types catalogued in D9b-2, and measure external repos
against the quality bar our own hooks and patterns enforce.

---

## 2. Universal Quality Rubric

_Merged from D10a and D10b. This is the portable checklist — what to check in
any target repo._

The rubric has three tiers: Universal (any repo, any language),
Language-Specific (JS/TS/Node.js or bash), and Project-Specific (SoNash only —
not applicable to external repos). Only Universal and Language-Specific items
belong in the repo analysis skill output.

### Tier 1 — Universal (Any Repo, Any Language)

#### Security / Input Handling

| Ref   | Item                                                                                       | Priority |
| ----- | ------------------------------------------------------------------------------------------ | -------- |
| U-S01 | No raw `error.message` in logs — sanitize before logging (prevents path/stack/PII leakage) | CRITICAL |
| U-S02 | Path traversal: use regex `/^\.\.(?:[\\/]\|$)/` not `startsWith('..')`                     | CRITICAL |
| U-S03 | Path containment validated at every touch point, not just entry                            | CRITICAL |
| U-S04 | CLI arg validation: check existence, non-empty, not-a-flag at parse time                   | CRITICAL |
| U-S05 | Process execution: args array not template string interpolation                            | CRITICAL |
| U-S06 | Shell inputs sanitized before any exec/spawn call                                          | CRITICAL |
| U-S07 | Prototype pollution: `Object.create(null)` or `Map` for untrusted keys                     | CRITICAL |
| U-S08 | ReDoS: length-bounded quantifiers `{1,N}` not `+` for user input                           | CRITICAL |
| U-S09 | Nested quantifier detection for ReDoS patterns                                             | CRITICAL |
| U-S10 | SSRF: explicit hostname allowlist + HTTPS-only enforcement                                 | CRITICAL |
| U-S11 | Markdown injection: escape dynamic content in generated docs                               | CRITICAL |
| U-S12 | PII masking in log output                                                                  | CRITICAL |
| U-S13 | Defense-in-depth: single env var must not disable production security                      | CRITICAL |
| U-S14 | Security features fail-closed, not bypass on error                                         | CRITICAL |
| U-S15 | API secrets never passed through subprocess argv (visible in `ps`)                         | CRITICAL |
| U-S16 | Archive extraction: subdirectory containment (zip-slip prevention)                         | CRITICAL |
| U-S17 | `eval` in shell scripts replaced with direct execution                                     | CRITICAL |
| U-S18 | Token/secret redaction uses regex match, not whitespace-split                              | CRITICAL |
| U-S19 | Allowlists on generic data-access methods                                                  | CRITICAL |
| U-S20 | Secrets scan at pre-commit (gitleaks or equivalent)                                        | CRITICAL |

#### File System Security

| Ref   | Item                                                              | Priority  |
| ----- | ----------------------------------------------------------------- | --------- |
| U-F01 | All file reads in try/catch (TOCTOU race condition)               | CRITICAL  |
| U-F02 | Symlink check on target AND parent directories before write       | CRITICAL  |
| U-F03 | Both target AND `.tmp` path guarded for symlinks in atomic writes | CRITICAL  |
| U-F04 | `realpathSync()` (or equivalent) to verify canonical path         | CRITICAL  |
| U-F05 | Exclusive file creation flag for temp/atomic files                | CRITICAL  |
| U-F06 | Atomic writes via tmp file + rename                               | CRITICAL  |
| U-F07 | Cross-device rename handled with copy+delete fallback             | IMPORTANT |
| U-F08 | Same-path rename guard                                            | IMPORTANT |
| U-F09 | Multi-file operations roll back on partial failure                | IMPORTANT |
| U-F10 | Log target type verified (isFile()) before writing                | CRITICAL  |

#### Shell / Process

| Ref   | Item                                                             | Priority  |
| ----- | ---------------------------------------------------------------- | --------- |
| U-P01 | `printf '%s'` not `echo "$VAR"` in POSIX scripts                 | CRITICAL  |
| U-P02 | `while IFS= read -r file` not `for file in $list`                | IMPORTANT |
| U-P03 | `set -o pipefail` before pipes in validation scripts             | IMPORTANT |
| U-P04 | Temp file cleanup via `trap 'rm -f "$TMPFILE"' EXIT`             | IMPORTANT |
| U-P05 | execSync/execFileSync with explicit timeout and maxBuffer limits | IMPORTANT |
| U-P06 | Process identity verified before termination operations          | CRITICAL  |
| U-P07 | Graceful SIGTERM before forced SIGKILL                           | IMPORTANT |

#### Regex Safety

| Ref   | Item                                                                                 | Priority  |
| ----- | ------------------------------------------------------------------------------------ | --------- |
| U-R01 | `/g` flag on regexes used in `while` + `exec()` loops                                | CRITICAL  |
| U-R02 | `lastIndex` reset before each use of stateful regex                                  | CRITICAL  |
| U-R03 | Length limits in user-controlled regex patterns                                      | CRITICAL  |
| U-R04 | Anchored patterns for enum validation (`^value$`)                                    | IMPORTANT |
| U-R05 | Alternation precedence explicit: `^(a\|b\|c)$` not `^a\|b\|c$`                       | IMPORTANT |
| U-R06 | Two-strikes rule: if flagged twice for same regex issue, replace with string parsing | CRITICAL  |

#### Data Integrity

| Ref   | Item                                                                   | Priority  |
| ----- | ---------------------------------------------------------------------- | --------- |
| U-D01 | Per-line try/catch in JSONL/stream parsing                             | IMPORTANT |
| U-D02 | Warnings logged on parse failures — no silent `.filter(Boolean)`       | IMPORTANT |
| U-D03 | Empty collection guard before writing output files                     | IMPORTANT |
| U-D04 | Null vs falsy distinction when 0/"" are valid values                   | IMPORTANT |
| U-D05 | Fail-fast on parse errors — no silent data loss                        | IMPORTANT |
| U-D06 | UTC date arithmetic for timezone safety                                | IMPORTANT |
| U-D07 | Exclusion sets built from independent source (not data being filtered) | IMPORTANT |

#### Atomic Operations and State Consistency

| Ref   | Item                                                      | Priority  |
| ----- | --------------------------------------------------------- | --------- |
| U-A01 | Atomic writes via `.tmp` + rename pattern                 | CRITICAL  |
| U-A02 | Backup-swap pattern for destructive updates               | CRITICAL  |
| U-A03 | Tmp file cleanup in catch block after failed atomic write | IMPORTANT |
| U-A04 | Stable IDs never reassigned once allocated                | IMPORTANT |
| U-A05 | Multi-write operations roll back on failure               | IMPORTANT |

#### CI / Automation

| Ref   | Item                                                              | Priority  |
| ----- | ----------------------------------------------------------------- | --------- |
| U-C01 | CI uses lockfile (`npm ci` or equivalent), not loose installs     | IMPORTANT |
| U-C02 | Third-party CI actions pinned to full SHA (supply chain security) | CRITICAL  |
| U-C03 | Test suite runs on every non-doc commit                           | IMPORTANT |
| U-C04 | Formatter failures are blocking (no drift between local and CI)   | IMPORTANT |
| U-C05 | Binary/generated artifacts excluded by .gitignore before commit   | IMPORTANT |
| U-C06 | Circular dependency detection                                     | IMPORTANT |
| U-C07 | Cognitive complexity thresholds enforced (CC <= 15)               | IMPORTANT |

#### Behavioral / Code Quality

| Ref   | Item                                                                      | Priority  |
| ----- | ------------------------------------------------------------------------- | --------- |
| U-B01 | Synchronous I/O never on render/hot path                                  | CRITICAL  |
| U-B02 | Array.isArray() before iterating parsed JSON fields                       | IMPORTANT |
| U-B03 | Async tasks that must complete before process exit anchored synchronously | IMPORTANT |
| U-B04 | File write/mkdir errors explicitly checked                                | IMPORTANT |
| U-B05 | Batch operations isolated (`Promise.allSettled` not `Promise.all`)        | IMPORTANT |
| U-B06 | Date comparisons use Date objects, not string comparisons                 | IMPORTANT |
| U-B07 | O(N²) deduplication replaced with Map/index                               | IMPORTANT |
| U-B08 | Silent catch blocks absent (log or comment why)                           | IMPORTANT |

#### Documentation

| Ref    | Item                                               | Priority  |
| ------ | -------------------------------------------------- | --------- |
| U-DOC1 | Cross-document reference integrity checked         | IMPORTANT |
| U-DOC2 | Required headers on new documentation files        | IMPORTANT |
| U-DOC3 | Malformed markdown tables/headers caught pre-merge | IMPORTANT |
| U-DOC4 | Orphaned references cleaned up when items move     | IMPORTANT |

### Tier 2 — Language-Specific (JS/TS/Node.js)

| Ref   | Item                                                               |
| ----- | ------------------------------------------------------------------ |
| LS-01 | `Number.NaN` not bare `NaN`                                        |
| LS-02 | `process.execPath` not hardcoded `'node'`                          |
| LS-03 | CJS/ESM interop: `?.default ??` guard on dynamic require           |
| LS-04 | `z.coerce.number()` coerces `null` to `0` — use explicit nullable  |
| LS-05 | Lockfile updated when package.json dependency changes              |
| LS-06 | `node:fs`, `node:path` module prefixes (SonarQube S6803)           |
| LS-07 | `Error cause` preserved: `new Error(msg, { cause: err })`          |
| LS-08 | `Math.max(...arr)` call stack limit avoided for large arrays       |
| LS-09 | Nullish coalescing (`??`) over logical OR (`\|\|`) when 0/"" valid |
| LS-10 | Set iteration order non-deterministic — convert to sorted Array    |

### Tier 2 — Language-Specific (Bash)

| Ref    | Item                                                            |
| ------ | --------------------------------------------------------------- |
| LS-B01 | `[[` for conditionals, not `[` (POSIX vs bash)                  |
| LS-B02 | `eval` never used — replace with `"$@"` direct execution        |
| LS-B03 | Exit code capture: `if ! OUT=$(cmd)` not `cmd; if [ $? -ne 0 ]` |

**Confidence:** HIGH [D10a, D10b]. The universal tier derives from direct reads
of CODE_PATTERNS.md (347 reviews), SECURITY_CHECKLIST.md (180+ patterns), and
AI_REVIEW_LEARNINGS_LOG.md. The language-specific tier derives from the same
sources with explicit scope annotations.

---

## 3. Skill Architecture Patterns

_From D8 — concrete orchestration design drawn from deep-research and
audit-comprehensive._

**[CONFIDENCE: HIGH]** All patterns have explicit precedents in existing skill
SKILL.md files.

### 3.1 Agent Count Formula

Do not size the agent pool by repo size. Size it by analysis dimension count:

```
N = N_dimensions + 2 + floor(N_dimensions / 4)
```

Where `+2` covers a pre-flight agent and a synthesis/aggregation agent, and the
`floor()` term provides cross-domain correlation budget. For a standard
6-dimension analysis: `6 + 2 + 1 = 9 agents`.

Repo size affects the _depth_ of each agent's work (more files, longer history)
and the clone strategy (blobless vs. full), not the number of agents [D8].

### 3.2 Staged Wave Execution

Derived from the audit-comprehensive canonical pattern:

```
Phase 0: Interactive setup (inline orchestrator, no agent spawn)
  - Resume check (state file lookup by repo slug)
  - Dimension selection, depth selection, agent budget computation
  - State file creation, output directory creation

Phase 1: Pre-flight (inline orchestrator)
  - 3 API calls in parallel: GitHub metadata, OpenSSF Scorecard, deps.dev
  - Clone execution (single operation, cannot parallelize)

Phase 2: Dimension Wave (up to 4 agents, concurrent)
  - One agent per analysis dimension
  - Each writes dimensions/<dim>-findings.json before returning
  - Orchestrator verifies file existence after each return

Phase 3: History Wave (conditional — depth=deep or churn requested)
  - Deepen clone gate first (git fetch --shallow-since)
  - Up to 3 agents: churn, contributor, commit-trend

Phase 4: Aggregation (1 agent, sequential)
  - Reads all dimension files
  - Produces analysis.json, findings.jsonl, summary.md, trends.jsonl

Phase 4.5: TDMS Deduplication (inline, mandatory, before interactive review)

Phase 5: Interactive Review (3–5 findings per batch, S0 first)

Phase 6: Routing menu (deep-plan, add-debt, memory, compare, done)
```

The 4-agent concurrency cap from CLAUDE.md applies. Waves must stage to respect
it [D8, D9a-1].

### 3.3 Write-to-Disk-First Rule

Every agent writes its output file before returning. The orchestrator verifies
file existence — it does not trust return-value content. This enables:

- Partial result inspection by the user before aggregation completes
- State survival across context compaction
- Resume from the last completed dimension file on restart [D8]

### 3.4 State Schema

State file location: `.claude/state/repo-analysis.<repo-slug>.state.json`

```json
{
  "skill": "repo-analysis",
  "version": "1.0",
  "slug": "<repo-slug>",
  "target_repo": "github.com/org/repo",
  "target_commit": "<sha>",
  "status": "in-progress | complete | failed",
  "phase": 2,
  "depth": "standard | deep",
  "dimensions_requested": ["code-quality", "security", "structure", "process"],
  "dimensions_completed": [],
  "dimensions_failed": [],
  "wave_status": {
    "preflight_api": "complete",
    "preflight_clone": "complete",
    "phase2_dimensions": "in-progress",
    "phase3_history": "pending",
    "aggregation": "pending",
    "tdms_dedup": "pending"
  },
  "output_dir": ".research/<repo-slug>/",
  "clone_dir": "/tmp/repo-analysis-<repo-slug>/",
  "clone_strategy": "blobless-shallow",
  "prior_analysis": null,
  "agent_budget": { "allocated": 9, "spawned": 0, "completed": 0, "failed": 0 },
  "startedAt": "ISO 8601",
  "completedAt": null
}
```

**Resume protocol:** On invocation, check for state file matching `<repo-slug>`.
If `status=in-progress`, offer resume. If state file is missing or corrupted,
scan `output_dir/dimensions/` for written files and infer resumption point from
what exists on disk [D8].

### 3.5 Failure Handling

Single dimension failure: verify file was written → re-spawn once → mark failed
and continue if second attempt fails. Report gap to user, proceed with available
dimensions.

Majority failure (50%+ of wave): stop, present user with three options: retry
failed, proceed partial, abort. Never proceed silently [D8].

### 3.6 Trend Tracking

Mirror the ecosystem-health append-only log pattern. On every run, append one
record to `trends.jsonl`:

```json
{
  "analysis_id": "uuid",
  "timestamp": "ISO8601",
  "repo": "github.com/org/repo",
  "commit": "sha",
  "overall_score": 74,
  "dimensions": { "security": 52, "reliability": 78 },
  "delta_overall": 6,
  "new_findings": 6,
  "resolved_findings": 12,
  "regression_flags": []
}
```

Duplicate-run guard: if `trends.jsonl` already contains an entry for the current
HEAD SHA, warn and confirm before re-analyzing [D8].

### 3.7 Handoff Decision Tree

Route to `/deep-plan` when: more than 20 S0/S1 findings, any dimension score
below 40, systemic architectural issue, or findings spanning 5+ files in the
same subsystem.

Inline planning (no deep-plan) when: 5 or fewer S0+S1 findings, all isolated,
score delta positive, user explicitly limits scope [D8].

---

## 4. Reusable Agent Types

_From D9b-2 — which of our 44 agents to spawn for external repo analysis._

**[CONFIDENCE: HIGH]**

### Tier 1 — Core Analysis (spawn for every run)

| Agent                      | Role                                                               | Notes                                  |
| -------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `explore`                  | Initial codebase map; trace data flows; identify entry points      | Entry point for unfamiliar repos       |
| `gsd-codebase-mapper`      | Structured analysis per focus area (tech, arch, quality, concerns) | Ideal for parallel dimension spawn     |
| `gsd-assumptions-analyzer` | Extract risks and assumptions from external codebase               | Risk surface identification            |
| `code-reviewer`            | Quality, security, maintainability review                          | Run on representative file samples     |
| `security-auditor`         | OWASP compliance, vulnerability identification                     | Universal across all stacks            |
| `dependency-manager`       | Dependency vulnerability scanning, license compliance              | Requires package manifest access       |
| `test-engineer`            | Coverage analysis, test strategy health assessment                 | Requires test runner config inspection |
| `performance-engineer`     | Bottleneck profiling, caching, hot-path analysis                   | Requires profiling or code analysis    |

### Tier 2 — Structural Analysis (spawn based on scope)

| Agent                  | Role                                         | When to Spawn                     |
| ---------------------- | -------------------------------------------- | --------------------------------- |
| `backend-architect`    | API design, microservice boundary assessment | Backend/API repos                 |
| `database-architect`   | Data model and schema assessment             | Repos with DB layer               |
| `deployment-engineer`  | CI/CD pipeline and infrastructure review     | Any repo with CI config           |
| `error-detective`      | Log patterns, error handling quality         | Repos with logging infrastructure |
| `documentation-expert` | Doc coverage and quality                     | Any repo with docs/ directory     |
| `git-flow-manager`     | Branch strategy, workflow health             | Any git repo                      |

### Tier 3 — Stack-Specific (spawn only if target stack matches)

| Agent                            | When Applicable                  |
| -------------------------------- | -------------------------------- |
| `nextjs-architecture-expert`     | Target repo uses Next.js         |
| `react-performance-optimization` | Target repo uses React           |
| `frontend-developer`             | Target has React/frontend layer  |
| `security-engineer`              | Compliance-focused organizations |

**Not applicable to external repo analysis:** gsd-ui-\*, gsd-planner,
gsd-executor, gsd-roadmapper, prompt-engineer, markdown-syntax-formatter.

The `gsd-codebase-mapper` is the highest-value parallel spawn for analysis. Its
four built-in focus areas (tech, arch, quality, concerns) map directly to core
analysis dimensions and enable concurrent execution without cross-contamination
[D9b-2].

---

## 5. Analysis Skill Catalog

_From D9b-1 — which of our 62 skills represent portable analysis patterns._

**[CONFIDENCE: HIGH]**

### Three-Tier Audit Architecture (Portable as Design Pattern)

Our audit system has three distinct tiers — a structure directly transferable to
external repo analysis design:

- **Tier 1 (Domain Audits):** audit-code, audit-security, audit-performance,
  audit-documentation, audit-refactoring, audit-process,
  audit-engineering-productivity
- **Tier 2 (Ecosystem Audits):** hook-ecosystem-audit, pr-ecosystem-audit,
  script-ecosystem-audit, session-ecosystem-audit, tdms-ecosystem-audit
- **Tier 3 (Orchestrators):** audit-comprehensive, comprehensive-ecosystem-audit

For external repo analysis: Tier 1 = code analysis dimensions, Tier 2 =
process/tooling subsystem health, Tier 3 = aggregate roll-up.

### Most Directly Transferable Skills

| Skill                            | Portable Pattern                                             | Notes                                   |
| -------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| `audit-code`                     | Code quality multi-agent sweep                               | Language-agnostic orchestration pattern |
| `audit-security`                 | Security vulnerability scan across dimensions                | Pattern, not SoNash-specific rules      |
| `audit-performance`              | Performance bottleneck detection                             | Pattern-based; applies to any stack     |
| `audit-refactoring`              | Refactoring opportunity identification                       | Code-structural analysis                |
| `audit-documentation`            | Documentation coverage and quality audit                     | Applies to any repo with docs           |
| `audit-engineering-productivity` | Workflow efficiency analysis (CI, PR cadence, test coverage) | Git-history-based                       |
| `ecosystem-health`               | Composite health scoring (8 categories)                      | Scoring framework is generic            |
| `system-test`                    | 23-domain full repo test plan                                | Framework is domain-configurable        |
| `pr-retro`                       | PR review cycle retrospective                                | Git-history-based, repo-agnostic        |
| `convergence-loop`               | Multi-pass claim verification                                | Meta-pattern for any analysis           |
| `audit-comprehensive`            | Wave-staged multi-domain orchestration                       | Direct orchestration blueprint          |
| `alerts`                         | Lightweight multi-category health signal                     | Adaptable category set                  |

### Skills NOT Transferable (SoNash-Specific)

hook-ecosystem-audit, pr-ecosystem-audit, session-ecosystem-audit,
tdms-ecosystem-audit, script-ecosystem-audit, add-debt, debt-runner,
session-begin, session-end, pre-commit-fixer, validate-claude-folder,
sonarcloud.

### The Convergence-Loop as Universal Trust Mechanism

The `convergence-loop` skill is referenced by name in at least 6 other skills.
It is the epistemic trust mechanism: discover claims → verify against filesystem
→ iterate until claims converge with reality. Any external repo analysis should
apply this: dimension agents make claims, aggregation agent verifies claims
against actual artifacts, output reflects only verified state [D9b-1].

---

## 6. Hook Pipeline as Quality Blueprint

_From D9a-1 — what a well-instrumented repo looks like._

**[CONFIDENCE: HIGH]**

Our pre-commit + pre-push pipeline is the most concrete answer to "what does a
high-quality repo look like." Analyzing it reveals a blueprint for assessing
external repos.

### What Our Pipeline Checks

**Pre-commit (13 waves, 9 discrete named checks plus inline guards):**

| Quality Signal         | Check                              | Universality      |
| ---------------------- | ---------------------------------- | ----------------- |
| Credential hygiene     | `secrets-scan` (gitleaks)          | UNIVERSAL         |
| Code quality gate      | `eslint` (staged JS/TS only)       | JS/TS-specific    |
| Regression prevention  | `tests` (smart skip for doc-only)  | UNIVERSAL concept |
| Formatting consistency | `lint-staged` (Prettier + restage) | JS/TS-specific    |
| Security anti-patterns | `pattern-compliance`               | UNIVERSAL concept |
| Doc link integrity     | `cross-doc-deps`                   | UNIVERSAL         |
| Doc header standards   | `doc-headers` (new .md only)       | UNIVERSAL         |
| Propagation misses     | `propagation-staged`               | UNIVERSAL concept |
| Branching hygiene      | PR creep guard (commit count)      | UNIVERSAL         |

**Pre-push (9 waves, 10 discrete checks):**

| Quality Signal             | Check                            | Universality        |
| -------------------------- | -------------------------------- | ------------------- |
| Warning acknowledgment     | `escalation-gate`                | UNIVERSAL concept   |
| Module graph health        | `circular-deps` (madge)          | JS/TS-specific      |
| Review discipline          | `code-reviewer-gate`             | UNIVERSAL concept   |
| Pattern consistency        | `propagation` (full)             | UNIVERSAL concept   |
| Vulnerability scan         | `security-check`                 | UNIVERSAL concept   |
| Type safety                | `type-check` (tsc --noEmit)      | TypeScript-specific |
| Complexity ceiling         | `cyclomatic-cc` + `cognitive-cc` | UNIVERSAL           |
| Dependency vulnerabilities | `npm-audit`                      | JS/TS-specific      |

### External Detectability Matrix

For external repo analysis, these signals are externally detectable:

| Signal             | How to Detect                                                    |
| ------------------ | ---------------------------------------------------------------- |
| Secrets scan       | `.gitleaks.toml` + gitleaks in devDeps or PATH                   |
| ESLint             | `.eslintrc.*` or `eslint.config.*` + lint script in package.json |
| Test suite         | `"test"` script + test framework in devDependencies              |
| Lint-staged        | `lint-staged` in devDeps + config in package.json                |
| Circular deps      | `madge` in devDeps + `"deps:circular"` script                    |
| Type checking      | `tsconfig.json` + TypeScript in devDeps                          |
| Dependency audit   | `package-lock.json` existence (npm audit available)              |
| PR size discipline | `git rev-list --count` on branch                                 |
| Pattern compliance | Regex scan for bare anti-patterns directly on codebase           |

### Wave Order as Recommendation

The wave numbering encodes a priority philosophy: fastest/most critical checks
run earliest (Wave 0 = secrets, Wave 1 = lint+tests), conditional checks run
later (Wave 4+ = audit-specific). This ordering is directly portable as a
"recommended hook ordering" rubric for target repos [D9a-1].

### Non-Obvious Sophistications Worth Detecting

- **Rebase-only detection:** pre-push skips code-analysis gates when push
  contains only rebase commits with no content diff vs upstream. Prevents false
  positives.
- **Parallel execution:** ESLint + tests run concurrently (Wave 1), type-check +
  CC checks run concurrently (pre-push Wave 7). ~50% time savings on slowest
  gates.
- **Cognitive complexity advisory pre-commit:** non-blocking advisory run on
  staged files before the blocking CC check at pre-push. Provides early warning.
- **Backward-compat skip aliases:** `SKIP_PATTERN_CHECK=1` maps to
  `SKIP_CHECKS=patterns`. Prevents hook bypass workarounds from accumulating.

---

## 7. Pattern Compliance as Analysis Dimension

_From D9a-2 — the graduated enforcement model and what it reveals about
quality._

**[CONFIDENCE: HIGH]**

### The Three-Layer Defense

Our pattern compliance system is not ESLint. It operates as a third, independent
layer alongside ESLint (automated) and code-reviewer (AI). Each layer catches
different failure modes:

| Layer            | Mechanism                              | What It Catches                                                            |
| ---------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| ESLint           | Automated syntax/rule checking         | Standard JS/TS rule violations                                             |
| `patterns:check` | Custom regex scanner (bespoke Node.js) | Project-specific anti-patterns, security issues that ESLint does not model |
| `code-reviewer`  | AI checklist review                    | Contextual judgment calls, multi-file patterns, design issues              |

The duplication across all three layers for the 7 highest-severity checks is
intentional: defense-in-depth, not redundancy [D9a-2].

### Graduation System (Warn-Then-Block)

The patterns:check scanner has a sophisticated false-positive mitigation
mechanism:

1. First violation = **warn** only (logged to `.claude/state/warned-files.json`)
2. Repeat violation on same file = **block** (promoted to hard failure)
3. If a pattern accumulates 25+ false-positive exclusions = **auto-disabled** by
   default (requires `--include-fp-disabled` to re-enable)

This graduation system is itself a quality signal. A repo with a high FP
exclusion count for a given pattern is a signal of "noisy but real" — worth
investigating what the exclusions are protecting [D9a-2].

### Custom ESLint + Semgrep Rules (Three-Layer Enforcement)

Several patterns are enforced at three independent levels: patterns:check regex,
custom ESLint plugin rules (`sonash/no-*`), AND Semgrep rules. This
triple-enforcement model is the maximum defensible enforcement density for a
security-critical pattern [D9a-2].

### What to Detect in an External Repo

When analyzing an external repo for pattern compliance:

1. Does it have a custom pattern scanner beyond ESLint?
2. Does it have custom ESLint plugins for project-specific safety rules?
3. Does the scanner have a false-positive management mechanism?
4. Are there recurring violation types across the git history (equivalent to our
   propagation registry)?
5. Do the patterns extend beyond linting to behavioral requirements (AI review
   invocation, skip reason validation)?

The presence of a **propagation registry** (patterns added empirically after 4+
recurrences) is the strongest positive signal. It means the repo has a feedback
loop from PR review findings back into automated enforcement [D10b].

### Review Learnings as Rubric Source

CODE_PATTERNS.md v4.1 was distilled from 347 AI code reviews.
SECURITY_CHECKLIST.md references 180+ patterns. This empirical origin is a
quality signal in itself: patterns derived from real violations in production
code reviews are more reliable than theoretical checklists [D9a-2].

---

## 8. Design Decisions for the Repo Analysis Skill

_Synthesized across all 7 findings files. These are the concrete decisions the
skill design must resolve._

**[CONFIDENCE: HIGH unless noted otherwise]**

### Decision 1: Scope Boundary with audit-comprehensive

`audit-comprehensive` is for the home repo (sonash-app). The repo-analysis-skill
is for external repos. If invoked on the home repo, the skill should detect this
(compare target URL against known home repo) and warn, offering to route to
`/audit-comprehensive` instead.

Rationale: Both skills would produce overlapping findings if both ran on the
same repo. The audit-comprehensive skill has access to SoNash-specific schemas
and internal APIs that produce higher-quality home-repo findings [D8].

### Decision 2: Clone Strategy Determines Analysis Depth

Two strategies, user-selectable:

- `standard`: blobless + shallow clone (`--filter=blob:none --depth=1`). Enables
  Phase 2 dimension analysis. No history-dependent analysis.
- `deep`: blobless + 1-year history
  (`--filter=blob:none --shallow-since="1 year ago"`). Enables Phase 3 history
  wave (churn, contributor, commit-trend agents).

Clone directory is temporary. No existing skill pattern manages a temp directory
across multiple agents — this requires explicit design [D8].

### Decision 3: Dimension Agent Spawn Contract

Each dimension agent receives: dimension name, scope (file paths or "full
repo"), output path, repo path on disk, target repo string, HEAD SHA, prior
findings path (if available), and clone strategy. Returns only:
`COMPLETE: [dimension] wrote N findings to [output-path]`. No inline return of
findings content [D8].

### Decision 4: TDMS Deduplication is Mandatory and Pre-Review

Cross-reference against MASTER_DEBT.jsonl before any interactive review. Do not
present findings for review until dedup is complete. Write
DEDUP_VS_MASTER_DEBT.md to output_dir. Present only "New Finding" and "Possibly
Related" categories in review [D8, D9b-2].

### Decision 5: The Findings Schema is Already TDMS-Compatible

The findings.jsonl schema from the output scoring design uses the exact field
schema from `docs/templates/JSONL_SCHEMA_STANDARD.md`. No transformation is
needed for TDMS intake. Source field convention:
`"repo-analysis-<repo-slug>-<date>"` [D8].

### Decision 6: Output Metric Taxonomy Matches TDMS Categories

Use the TDMS category taxonomy (code-quality, security, process, documentation,
refactoring, performance, ai-optimization, enhancements,
engineering-productivity) as the finding output schema. This ensures findings
produced by the skill are directly ingestible into TDMS without mapping [D9b-2].

### Decision 7: 4-State Finding Lifecycle Reused from TDMS

The TDMS `NEW → VERIFIED → RESOLVED / FALSE_POSITIVE` lifecycle is a clean
4-state machine. Adopt as-is for repo analysis findings output. Do not invent a
new status vocabulary [D9b-2].

### Decision 8: Private Repo Support is a Gap

All existing analysis patterns (GitHub API, OpenSSF Scorecard, deps.dev) operate
on public repos. No existing skill pattern addresses credential passing to a
cloning agent. Private repo support is a V2 concern [D8].

### Decision 9: Team Mode for Large Repos

For repos exceeding 50k LOC or 6+ dimensions, consider using
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` mode. This enables cross-dimension
agent messaging during analysis — dimension agents can flag cross-cutting
findings to each other without routing through the orchestrator. This is
architecturally superior for correlation analysis but requires the experimental
flag [D8].

### Decision 10: Trends.jsonl Location

No existing pattern for a per-external-repo persistent data directory. Options:
(a) `.research/<repo-slug>/trends.jsonl` per-repo, or (b)
`data/repo-analyses/trends.jsonl` central. The per-repo option (a) follows the
deep-research `.research/` convention; the central option (b) follows
ecosystem-health's `data/` convention.

**Recommendation:** Use per-repo (a) for V1. A central index can be added in V2.

---

## 9. What We Do That Nobody Else Does

_Unique innovations in our codebase worth detecting as positive signals when
analyzing external repos._

**[CONFIDENCE: HIGH]** These are features confirmed by direct codebase
inspection, not inferred.

### 1. Three-Layer Enforcement (Hook + AI + Propagation Registry)

Most repos have one enforcement layer (linting). High-quality repos have two
(linting + CI). We have three: pre-commit hooks, AI code-reviewer, and a
propagation registry that automatically enforces patterns across sibling files
when one instance is corrected. The propagation registry is the differentiator —
it transforms a single PR review finding into a permanent automated check within
the same PR. No other tool does this by default [D9a-2, D10b].

### 2. Empirically-Grown Pattern Registry

CODE_PATTERNS.md v4.1 was built from 347 real AI code reviews. The
propagation-patterns.json only adds patterns after 4+ recurrences across
distinct PRs. This empirical origin means every pattern in the registry has been
validated against real production failures — not derived from theoretical
checklists. A repo with a pattern registry that tracks provenance (which PR, how
many recurrences) is significantly more mature than one with a static linting
ruleset [D9a-2, D10b].

### 3. Graduated Warn-Then-Block Escalation

Most repos fail-hard or warn-silently. Our pattern-compliance system offers a
third model: warn first (logged to warned-files.json), block on repeat. The
escalation gate at pre-push requires explicit acknowledgment before a
previously-warned issue can be pushed. This prevents "warning fatigue" (where
developers learn to ignore warnings) while avoiding the reject-everything
brittleness of pure hard-block systems [D9a-1, D10b].

### 4. Episodic Memory Pre-Search Before Review

The code-reviewer requires a search of episodic memory for past review decisions
on the same module before starting any review. The audit-comprehensive skill
checks "episodic memory for context from past audit sessions" before running
(Step 0). No external tool has this — code review tools start fresh every time.
The implication for detection: repos using AI-assisted review tools with memory
will show lower recurrence rates for the same class of violation [D8, D9a-2].

### 5. Self-Maintaining Propagation Registry via PR Retro

The propagation-patterns.json `_meta` contains an AI instruction: "during
/pr-retro, when a propagation miss is identified, propose adding it here." The
registry is designed to be AI-maintained and grows automatically from PR retro
sessions. This creates a feedback loop where missed patterns in one PR become
automated enforcement in the next. Detecting this pattern in an external repo (a
registry with AI-maintenance instructions and PR-sourced provenance) is a strong
signal of mature AI-assisted development practices [D10b].

### 6. Mandatory TDMS Deduplication Before Review

Most code quality tools surface all findings and leave deduplication to the
developer. We enforce dedup as a mandatory gate: findings.jsonl is
cross-referenced against MASTER_DEBT.jsonl before any interactive review.
Developers never see findings that are already tracked. This eliminates
re-discovery overhead and prevents debt inflation. Repos with formal
deduplication pipelines are a rare positive signal [D8, D9b-2].

### 7. CANON Artifact Enforcement

The hook-checks.json is declared as a "CANON artifact" — it is the single source
of truth for all hook checks. No undocumented check can exist; every check must
have a registry entry. The CANON principle (one authoritative source, all other
representations derived) applied to infrastructure configuration is unusual.
Most repos have hooks that drift from documentation over time. Detecting CANON
enforcement in an external repo (a machine-parseable config that fully describes
all quality gates) is a strong quality signal [D9a-1].

### 8. Session Continuity Across Context Compaction

The deep-research skill's Critical Rule #5 (state file updated after every
state-changing event) and audit-comprehensive's "re-read state file at the start
of each wave, not rely on in-memory variables" represent a design philosophy
that almost no AI-assisted workflow has: explicit engineering for AI context
loss. For human-authored workflows this is irrelevant; for AI-assisted repos,
the presence of this pattern is a maturity signal [D8].

---

## 10. Consolidated Gaps

_Gaps identified across all 7 findings files. These require design decisions
before the skill can be built._

**[CONFIDENCE: HIGH — these are confirmed absences, not speculation]**

### Gap 1: No Spawn Prompt Template for Dimension Agents

deep-research REFERENCE.md Section 20 documents searcher agent spawn prompts,
but no equivalent template exists for code-analysis dimension agents. The
repo-analysis SKILL.md will need to define these from scratch. [D8]

### Gap 2: Clone Directory Lifecycle Across Multiple Agents

No existing skill manages a temporary directory across multiple agents.
deep-research writes to `.research/<slug>/` (persistent). For repo-analysis, the
clone is temporary. No pattern exists for passing a temp directory path to
multiple agents and ensuring cleanup on skill completion or failure. [D8]

### Gap 3: Private Repo Credential Handling

All existing analysis patterns operate on public repos. No skill addresses
passing GitHub credentials to a cloning agent. Private repo support is
undesigned. [D8]

### Gap 4: Cross-Dimension Correlation in Subagent Mode

In subagent mode, cross-dimension correlations must be handled by the
aggregation agent reading all dimension files post-execution. No pattern exists
for dimension agents communicating findings to each other during execution. Team
mode (experimental flag) solves this but is not universally available. [D8]

### Gap 5: Trends.jsonl Central vs. Per-Repo Location

No existing pattern for a central per-external-repo data directory. The per-repo
vs. central location decision is unresolved. Recommendation: per-repo
(`.research/<slug>/`) for V1. [D8]

### Gap 6: Full ai-patterns.json Pattern Set Unread

The `scripts/config/ai-patterns.json` file (used by `pattern-compliance` check)
was not read in the D9a-1 or D9a-2 passes. The full set of enumerated pattern
IDs beyond the Top 5 documented in CLAUDE.md is unknown. This is a gap in the
universal quality rubric completeness. [D9a-1, D9a-2]

### Gap 7: POSITIVE_PATTERNS.md Unread

`docs/agent_docs/POSITIVE_PATTERNS.md` (referenced by code-reviewer SKILL.md)
was not read. It contains the safe-alternative patterns that complement the
anti-patterns. These positive patterns would strengthen the rubric's "what good
looks like" recommendations. [D9a-2]

### Gap 8: gsd-\* Agent Internal Orchestration Unknown

The gsd-\* agents beyond their first 5 lines are opaque — their internal
orchestration patterns (spawner/child relationships, convergence behavior) were
not captured in D9b-2. For the repo-analysis skill to use gsd-codebase-mapper as
a parallel spawn, the full spawn contract needs to be confirmed. [D9b-2]

### Gap 9: Historical Review Data Pre-2026-03-18

The review learnings read in D10b covered only Reviews #53–#60 and #486–#502.
Earlier reviews may contain unique patterns not represented in the current
rubric. The Go-specific findings (from statusline binary development) represent
a partially-captured sub-domain. [D10b]

### Gap 10: Full Anti-Patterns Array Count

Only the first 2 defined patterns in `check-pattern-compliance.js` were
extracted (exit-code-capture and for-file-iteration). The complete list of
enumerated pattern IDs and their count is not confirmed. The D10a rubric covers
patterns from CODE_PATTERNS.md but the script's runtime pattern list may differ.
[D9a-2]

---

## Sources

| Ref   | Path                                                                         | Type                       | Trust | Date       |
| ----- | ---------------------------------------------------------------------------- | -------------------------- | ----- | ---------- |
| D8    | `.research/repo-analysis-skill/findings/D8-skill-orchestration.md`           | Internal research findings | HIGH  | 2026-03-31 |
| D9a-1 | `.research/repo-analysis-skill/findings/D9a-1-hooks-precommit.md`            | Internal research findings | HIGH  | 2026-03-31 |
| D9a-2 | `.research/repo-analysis-skill/findings/D9a-2-patterns-codereview.md`        | Internal research findings | HIGH  | 2026-03-31 |
| D9b-1 | `.research/repo-analysis-skill/findings/D9b-1-skills-inventory.md`           | Internal research findings | HIGH  | 2026-03-31 |
| D9b-2 | `.research/repo-analysis-skill/findings/D9b-2-agents-tdms-session.md`        | Internal research findings | HIGH  | 2026-03-31 |
| D10a  | `.research/repo-analysis-skill/findings/D10a-universal-quality-standards.md` | Internal research findings | HIGH  | 2026-03-31 |
| D10b  | `.research/repo-analysis-skill/findings/D10b-hook-review-rubric.md`          | Internal research findings | HIGH  | 2026-03-31 |

**Primary sources behind the findings (canonical codebase artifacts):**

| ID   | Path                                          | Type                                | Date       |
| ---- | --------------------------------------------- | ----------------------------------- | ---------- |
| S-01 | `.claude/skills/deep-research/SKILL.md`       | Skill definition                    | 2026-03-29 |
| S-02 | `.claude/skills/audit-comprehensive/SKILL.md` | Skill definition                    | 2026-02-22 |
| S-03 | `.claude/skills/ecosystem-health/SKILL.md`    | Skill definition                    | 2026-03-11 |
| S-04 | `.claude/skills/code-reviewer/SKILL.md`       | Skill definition                    | 2026-03-13 |
| S-05 | `.claude/skills/deep-plan/SKILL.md`           | Skill definition                    | 2026-03-07 |
| S-06 | `.husky/pre-commit`                           | Hook source                         | Active     |
| S-07 | `.husky/pre-push`                             | Hook source                         | Active     |
| S-08 | `scripts/config/hook-checks.json`             | Config (CANON artifact)             | 2026-03-16 |
| S-09 | `scripts/config/propagation-patterns.json`    | Config (propagation registry)       | 2026-03-30 |
| S-10 | `scripts/check-pattern-compliance.js`         | Script source                       | Active     |
| S-11 | `docs/agent_docs/CODE_PATTERNS.md`            | Pattern catalog (v4.1, 347 reviews) | 2026-02-26 |
| S-12 | `docs/agent_docs/SECURITY_CHECKLIST.md`       | Security reference (v1.3)           | 2026-03-12 |
| S-13 | `docs/agent_docs/PRE_GENERATION_CHECKLIST.md` | Behavioral checklist                | 2026-03-14 |
| S-14 | `docs/AI_REVIEW_LEARNINGS_LOG.md`             | Review learnings (v17.116)          | 2026-03-26 |
| S-15 | `docs/technical-debt/INDEX.md`                | TDMS index                          | 2026-03-31 |
| S-16 | `SESSION_CONTEXT.md`                          | Session state                       | 2026-03-31 |
| S-17 | `.claude/agents/*.md` (44 files)              | Agent definitions                   | 2026-03-31 |
| S-18 | `.claude/skills/*/SKILL.md` (62 files)        | Skill definitions                   | 2026-03-31 |

---

_No contradictions were found across the 7 findings files. All sources are
first-party codebase artifacts read directly from the filesystem. No external
sources or training-data inference were used in any finding._
