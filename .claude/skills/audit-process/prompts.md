# Audit-Process Agent Prompts

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Parent skill:** `.claude/skills/audit-process/SKILL.md` **Agents:** 22 across
6 parallel stages + 1 synthesis stage

---

## Stage 1: Inventory & Dependency Mapping

### Agent 1A: Hooks Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory all hooks in this codebase:

1. Claude hooks in .claude/hooks/ - list each file, what event it handles
2. Husky hooks in .husky/ - list each file, what it does
3. lint-staged config in package.json - what it runs

For each hook, document:
- File path
- Trigger event (SessionStart, PostToolUse, pre-commit, etc.)
- What it calls/executes
- Dependencies on other scripts

CRITICAL: You MUST write your findings directly to this file:
  ${AUDIT_DIR}/stage-1a-hooks.md

Use the Write tool to create this file. Do NOT return findings as text.
Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 1A wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 1B: Scripts Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory all scripts:

1. scripts/*.js and scripts/*.ts - list each with one-line description
2. scripts/lib/ - shared utilities
3. npm scripts in package.json - list each with what it runs

For each script, document:
- File path
- Purpose (from comments or code analysis)
- What calls it (npm script, hook, CI, manual)
- What it calls (other scripts, external commands)

CRITICAL: You MUST write your findings directly to this file:
  ${AUDIT_DIR}/stage-1b-scripts.md

Use the Write tool to create this file. Do NOT return findings as text.
Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 1B wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 1C: Skills & Commands Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory all Claude skills and commands:

1. .claude/skills/ - each subdirectory is a skill
2. .claude/commands/ - each .md file is a command

For each skill/command, document:
- Name
- Description (from SKILL.md or file header)
- Scripts it uses (if any)
- Dependencies

CRITICAL: You MUST write your findings directly to this file:
  ${AUDIT_DIR}/stage-1c-skills.md

Use the Write tool to create this file. Do NOT return findings as text.
Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 1C wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 1D: CI & Config Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory CI and config:

1. .github/workflows/ - each YAML workflow
2. eslint.config.mjs - what rules/plugins
3. .prettierrc - configuration
4. tsconfig*.json - all TypeScript configs

For each, document:
- File path
- Purpose
- Triggers (for workflows)
- What it validates/enforces

CRITICAL: You MUST write your findings directly to this file:
  ${AUDIT_DIR}/stage-1d-ci-config.md

Use the Write tool to create this file. Do NOT return findings as text.
Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 1D wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 1E: Firebase Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory Firebase automation:

1. functions/src/*.ts - Cloud Functions (callable and scheduled)
2. functions/src/jobs.ts - Scheduled jobs specifically
3. firestore.rules - Security rules
4. storage.rules - Storage security rules
5. firestore.indexes.json - Indexes

For each function, document:
- Name
- Type (callable, scheduled, trigger)
- Schedule (if applicable)
- What it does

CRITICAL: You MUST write your findings directly to this file:
  ${AUDIT_DIR}/stage-1e-firebase.md

Use the Write tool to create this file. Do NOT return findings as text.
Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 1E wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 1F: MCP Servers Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory MCP servers:

1. Check mcp.json.example for configured servers
2. Check scripts/mcp/ for custom MCP implementations
3. Check .claude/settings.json for enabled/disabled servers

For each server, document:
- Name
- Source (npm package or local script)
- Purpose
- Status (enabled/disabled)

CRITICAL: You MUST write your findings directly to this file:
  ${AUDIT_DIR}/stage-1f-mcp.md

Use the Write tool to create this file. Do NOT return findings as text.
Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 1F wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

## Stage 2: Redundancy & Dead Code Analysis

### Agent 2A: Orphan Detection

```
Task(subagent_type="Explore", prompt="""
Using the Stage 1 inventory, find orphaned automation:

1. Scripts never called by npm scripts, hooks, CI, or other scripts
2. npm scripts never used in hooks, CI, or documentation
3. Skills/commands that duplicate built-in functionality
4. GitHub Actions that never trigger (impossible conditions)
5. Firebase functions not referenced anywhere

Cross-reference the dependency graph from Stage 1.

For each orphan found, create a JSONL entry (JSONL_SCHEMA_STANDARD.md format):
{
  "category": "process",
  "title": "Orphaned: [name]",
  "fingerprint": "process::path/to/file::orphaned-name",
  "severity": "S2",
  "effort": "E1",
  "confidence": 90,
  "files": ["path/to/file:1"],
  "why_it_matters": "Orphaned code increases maintenance burden and confusion",
  "suggested_fix": "Remove if unused, or document intended use",
  "acceptance_tests": ["Verify no callers exist", "Remove and confirm no breakage"],
  "evidence": ["grep output showing zero callers", "dependency graph excerpt"]
}

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-2a-orphans.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 2A wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 2B: Duplication Detection

```
Task(subagent_type="Explore", prompt="""
Find duplicated logic across automation:

1. Same validation running in pre-commit AND CI (unnecessary duplication)
2. Same check in multiple hooks
3. Scripts that do the same thing with different names
4. Pattern checks duplicated between hook and script
5. Similar error handling code copy-pasted

For each duplication found, create a JSONL entry (JSONL_SCHEMA_STANDARD.md format):
{
  "category": "process",
  "title": "Duplicated: [description]",
  "fingerprint": "process::path/to/file::duplicated-logic-name",
  "severity": "S2",
  "effort": "E1",
  "confidence": 85,
  "files": ["path/to/file:123", "other/location:456"],
  "why_it_matters": "Duplicated logic leads to inconsistent behavior and double maintenance",
  "suggested_fix": "Consolidate into single source, call from both places",
  "acceptance_tests": ["Single source of truth exists", "Both callers use shared implementation"],
  "evidence": ["code snippet from each duplicate", "diff showing similarity"]
}

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-2b-duplications.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 2B wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 2C: Unused & Never-Triggered

```
Task(subagent_type="Explore", prompt="""
Find automation that never executes:

1. npm scripts with no callers and not in documentation
2. GitHub Actions with triggers that never fire
3. Hooks configured but for events that don't occur
4. Firebase scheduled jobs that are disabled
5. Dead code paths in scripts (unreachable conditions)

For each finding, create a JSONL entry (JSONL_SCHEMA_STANDARD.md format):
{
  "category": "process",
  "title": "Never executes: [name]",
  "fingerprint": "process::path/to/file::never-executes-name",
  "severity": "S3",
  "effort": "E0",
  "confidence": 80,
  "files": ["path/to/file:1"],
  "why_it_matters": "Dead automation clutters codebase and misleads developers",
  "suggested_fix": "Remove or fix trigger condition",
  "acceptance_tests": ["Removed from codebase", "OR trigger condition now fires correctly"],
  "evidence": ["grep output", "trigger condition analysis"]
}

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-2c-unused.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 2C wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

## Stage 3: Effectiveness & Functionality

### Agent 3A: Hook Effectiveness

```
Task(subagent_type="code-reviewer", prompt="""
Analyze hook effectiveness:

1. Do pre-commit hooks actually catch the issues they're designed for?
2. Are there bypass conditions that are too easy to trigger?
3. Do Claude hooks provide useful feedback or just noise?
4. Are hook error messages actionable?

Test methodology:
- Read hook code and identify what it checks
- Determine if checks are robust or easily bypassed
- Check if error messages help developers fix issues

For each ineffective hook, create a JSONL entry with severity S1-S2.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-3a-hook-effectiveness.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 3A wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 3B: CI Workflow Effectiveness

```
Task(subagent_type="code-reviewer", prompt="""
Analyze CI workflow effectiveness:

1. Do workflows actually catch failures before merge?
2. Are there race conditions or timing issues?
3. Do workflows test the right things?
4. Are there gaps where bad code could slip through?

For each workflow, verify:
- Triggers are appropriate
- Steps actually validate what they claim
- Failure modes are handled

For each issue, create a JSONL entry with severity S0-S2.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-3b-ci-effectiveness.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 3B wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 3C: Script Functionality

```
Task(subagent_type="code-reviewer", prompt="""
Verify script functionality:

1. Do scripts handle edge cases (empty input, missing files)?
2. Do scripts fail gracefully with useful errors?
3. Are there scripts that silently do nothing?
4. Do scripts actually accomplish their stated purpose?

For high-complexity scripts (check MASTER_DEBT.jsonl for complexity findings),
pay extra attention to logic correctness.

For each issue, create a JSONL entry with severity S1-S3.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-3c-script-functionality.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 3C wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 3D: Skill/Command Functionality

```
Task(subagent_type="code-reviewer", prompt="""
Verify skill and command functionality:

1. Do skill prompts actually guide Claude effectively?
2. Are there skills that produce poor/wrong outputs?
3. Do commands reference files that don't exist?
4. Are skill dependencies satisfied?

For each issue, create a JSONL entry with severity S2-S3.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-3d-skill-functionality.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 3D wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

## Stage 4: Performance & Bloat

### Agent 4A: Git Hook Performance

```
Task(subagent_type="Explore", prompt="""
Analyze pre-commit and pre-push performance:

1. What's the total time for pre-commit? (should be <10s for good DX)
2. Which checks are slowest?
3. Are there checks that could run in parallel but don't?
4. Are there checks that could be skipped for certain file types?
5. Is there unnecessary work (full scans when partial would do)?

For each performance issue, create a JSONL entry (JSONL_SCHEMA_STANDARD.md format):
{
  "category": "process",
  "title": "Slow: [check name]",
  "fingerprint": "process::.husky/pre-commit::slow-check-name",
  "severity": "S2",
  "effort": "E1",
  "confidence": 85,
  "files": [".husky/pre-commit:[line]"],
  "why_it_matters": "Slow hooks degrade developer experience and encourage bypassing",
  "suggested_fix": "[specific optimization]",
  "acceptance_tests": ["Hook completes in <[Y]s", "No functionality lost"],
  "evidence": ["timing measurement", "profiling output"]
}

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-4a-hook-performance.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 4A wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 4B: CI Performance

```
Task(subagent_type="Explore", prompt="""
Analyze CI workflow performance:

1. Which jobs take longest?
2. Are there jobs that could run in parallel?
3. Is caching used effectively?
4. Are there redundant installs or builds?
5. Could any jobs be skipped based on changed files?

For each issue, create a JSONL entry with severity S2-S3.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-4b-ci-performance.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 4B wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 4C: Script Performance

```
Task(subagent_type="code-reviewer", prompt="""
Analyze script performance:

1. Scripts that scan all files when they could be selective
2. Synchronous operations that could be async
3. Repeated file reads that could be cached
4. O(n^2) or worse algorithms
5. Spawning too many child processes

Focus on scripts in the critical path (hooks, CI).

For each issue, create a JSONL entry with severity S2-S3.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-4c-script-performance.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 4C wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

## Stage 5: Quality & Consistency

### Agent 5A: Error Handling Audit

```
Task(subagent_type="code-reviewer", prompt="""
Audit error handling in automation:

1. Silent failures (catch blocks that swallow errors)
2. Missing try/catch around file operations
3. Incorrect exit codes (0 on failure, non-zero on success)
4. continueOnError overuse in hooks
5. Missing error messages or unhelpful ones

For each issue, create a JSONL entry:
{
  "severity": "S1" for silent failures that hide real problems,
  "severity": "S2" for poor error messages
}

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-5a-error-handling.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 5A wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 5B: Code Quality Audit

```
Task(subagent_type="code-reviewer", prompt="""
Audit code quality in scripts and hooks:

1. Security issues (command injection, path traversal)
2. Race conditions (TOCTOU)
3. Hardcoded paths that should be configurable
4. Magic numbers/strings without explanation
5. Missing input validation

Use patterns from docs/agent_docs/CODE_PATTERNS.md as reference.

For each issue, create a JSONL entry with appropriate severity.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-5b-code-quality.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 5B wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 5C: Consistency Audit

```
Task(subagent_type="Explore", prompt="""
Audit consistency across automation:

1. Mixed JS and shell doing the same thing differently
2. Inconsistent naming (kebab-case vs camelCase vs snake_case)
3. Different error message formats
4. Some async, some sync for similar operations
5. Different logging approaches

For each inconsistency, create a JSONL entry with severity S3.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-5c-consistency.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 5C wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

## Stage 6: Coverage Gaps & Improvements

### Agent 6A: Coverage Gap Analysis

```
Task(subagent_type="Explore", prompt="""
Identify coverage gaps:

1. File types not covered by linting
2. Code paths not validated by any check
3. Missing pre-push checks that CI catches too late
4. Firebase functions without integration tests
5. Skills without usage documentation

For each gap, create a JSONL entry (JSONL_SCHEMA_STANDARD.md format):
{
  "category": "process",
  "title": "Gap: [description]",
  "fingerprint": "process::[file or N/A]::coverage-gap-identifier",
  "severity": "S2",
  "effort": "E2",
  "confidence": 80,
  "files": ["[relevant file or 'N/A']:1"],
  "why_it_matters": "[what's missing and why it matters]",
  "suggested_fix": "[how to add coverage]",
  "acceptance_tests": ["Coverage added", "Validation passes"],
  "evidence": ["missing coverage area", "gap analysis output"]
}

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-6a-coverage-gaps.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 6A wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 6B: Improvement Opportunities

```
Task(subagent_type="general-purpose", prompt="""
Identify improvement opportunities:

1. Scripts that could be consolidated
2. Manual processes that could be automated
3. Better tools that could replace current ones
4. Hooks that could provide better DX
5. CI optimizations (caching, parallelization)

For each opportunity, create a JSONL entry (JSONL_SCHEMA_STANDARD.md format):
{
  "category": "process",
  "title": "Improve: [description]",
  "fingerprint": "process::automation::improvement-identifier",
  "severity": "S3",
  "effort": "E2",
  "confidence": 75,
  "files": ["[relevant file or N/A]"],
  "why_it_matters": "[current state] -> [improved state]",
  "suggested_fix": "[specific implementation suggestion]",
  "acceptance_tests": ["Improvement implemented", "Verified working"],
  "evidence": ["current state measurement", "improvement opportunity analysis"]
}

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-6b-improvements.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 6B wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```

---

### Agent 6C: Documentation & Maintainability

```
Task(subagent_type="Explore", prompt="""
Audit documentation and maintainability:

1. Scripts without header comments explaining purpose
2. Complex logic without inline comments
3. Missing README files in key directories
4. Outdated documentation (references non-existent files)
5. TRIGGERS.md missing entries for new automation

For each issue, create a JSONL entry with severity S3.

CRITICAL: You MUST write findings directly to this file:
  ${AUDIT_DIR}/stage-6c-documentation.jsonl

Use the Write tool to create this file. Write one JSON object per line.
Do NOT return findings as text. Verify the file exists after writing.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: 6C wrote N findings to [path]`
- Do NOT return findings content in your response
""")
```
