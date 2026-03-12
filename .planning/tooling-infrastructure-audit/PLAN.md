# Implementation Plan: Tooling & Infrastructure Audit

## Summary

Comprehensive optimization of the project's tooling infrastructure: security hardening (branch protection, vulnerability alerts, SHA pinning), GitHub workflow fixes and modernization, plugin/agent/MCP deduplication (remove 19 agents, 2 plugins, 2 MCP servers), npm script full audit, ESLint plugin optimization, new tooling additions (4 devDeps, 1 GH Action), review bot configuration, and documentation update across all affected files.

**Decisions:** See DECISIONS.md (30 decisions)
**Effort Estimate:** XL — 8 implementation steps spanning security, CI/CD, config, code, and documentation

**Out of Scope:** CI failure on main (pre-existing, not caused by tooling configuration — tracked separately).

## Files to Create/Modify

### New Files (5)
1. **`.qodo.yaml`** — Qodo review bot configuration with category suppressions
2. **`.github/workflows/bundle-size.yml`** — compressed-size-action workflow
3. **`commitlint.config.js`** — commitlint configuration
4. **`.planning/tooling-infrastructure-audit/npm-script-audit.md`** — audit results for ~140 scripts
5. **`.planning/tooling-infrastructure-audit/skill-orphan-scan.md`** — orphan skill findings

### Modified Files (25+)
1. **`.claude/settings.json`** — remove GSD hook duplication, update hook refs
2. **`~/.claude/settings.json`** (user-level) — remove CodeRabbit, hookify, add commitlint config
3. **`.mcp.json`** — remove memory server entry
4. **`.claude/skills/checkpoint/SKILL.md`** — remove --mcp flag and MCP Save section
5. **`.serena/project.yml`** — DELETE
6. **`.claude/hooks/stop-serena-dashboard.js`** — DELETE
7. **19 agent files in `.claude/agents/`** — DELETE
8. **`.github/workflows/ci.yml`** — update action versions + SHA pins
9. **`.github/workflows/auto-label-review-tier.yml`** — SHA-pin tj-actions/changed-files
10. **`.github/workflows/docs-lint.yml`** — SHA-pin tj-actions/changed-files
11. **`.github/workflows/backlog-enforcement.yml`** — remove dead backlog-health job, update action versions
12. **`.github/workflows/deploy-firebase.yml`** — remove dead preview-deploy job, fix service account key handling
13. **`.github/workflows/cleanup-branches.yml`** — fix counter bug, update action version
14. **`.github/workflows/pattern-compliance-audit.yml`** — fix string-vs-numeric comparison
15. **`.github/workflows/semgrep.yml`** — migrate to semgrep/semgrep-action
16. **`.github/workflows/sonarcloud.yml`** — update action versions (keep disabled)
17. **`.github/workflows/validate-plan.yml`** — DELETE
18. **`.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md`** — DELETE (one-time procedure already executed; git history preserves content)
19. **`.github/copilot-instructions.md`** — full rewrite to current state
20. **`eslint-plugin-sonash/index.js`** — enable 4 rules, merge 1, remove 2
21. **`eslint.config.mjs`** — update rule config for sonash plugin changes
22. **`.husky/pre-commit`** — add timing output
23. **`package.json`** — add new devDeps, remove dead scripts, consolidate overlapping
24. **`CLAUDE.md`** — update agent trigger references
25. **`SKILL_INDEX.md`** — update after any skill orphan removal

---

## Step 1: Security Hardening (GitHub Settings)

**Per Decisions #1, #2**

1. Enable branch protection on `main`:
   - Require pull request before merging (no direct pushes)
   - Require status checks to pass (CI workflow)
   - No required reviewers (solo dev)
   - Disallow force pushes
   ```bash
   gh api repos/jasonmichaelbell78-creator/sonash-v0/branches/main/protection \
     -X PUT -f required_status_checks='{"strict":true,"contexts":["lint-typecheck-test","build"]}' \
     -f enforce_admins=true -f required_pull_request_reviews=null \
     -f restrictions=null -F allow_force_pushes=false -F allow_deletions=false
   ```

2. Enable Dependabot vulnerability alerts:
   ```bash
   gh api repos/jasonmichaelbell78-creator/sonash-v0/vulnerability-alerts -X PUT
   ```

**Done when:** `gh api repos/.../branches/main/protection` returns protection rules; `gh api repos/.../vulnerability-alerts` returns 204.
**Depends on:** None
**Triggers:** None

---

## Step 2: GitHub Workflow Fixes & Modernization

**Per Decisions #4, #6, #7, #15, #16**

### 2a: SHA-pin all third-party actions to latest stable

For every workflow file, replace tag-only references with SHA-pinned latest versions:
- `actions/checkout@v6` → `actions/checkout@<v6-SHA>`
- `actions/setup-node@v6` → `actions/setup-node@<v6-SHA>`
- `actions/github-script@v8` → `actions/github-script@<v8-SHA>`
- `tj-actions/changed-files@v47` → `tj-actions/changed-files@<latest-safe-SHA>`
- `actions/upload-artifact@v7` → `actions/upload-artifact@<v7-SHA>`
- `actions/dependency-review-action@v4` → pinned SHA
- `github/codeql-action/*@v4` → pinned SHAs

Fetch latest SHAs:
```bash
gh api repos/actions/checkout/git/refs/tags/v6 --jq '.object.sha'
# Repeat for each action
```

### 2b: Migrate Semgrep action

In `semgrep.yml`:
- Replace `returntocorp/semgrep-action@<old-SHA>` with `semgrep/semgrep-action@<latest-SHA>`
- Remove `|| true` that masks failures in local rules step
- Verify SARIF upload still works

### 2c: Fix workflow bugs

1. **cleanup-branches.yml** — Fix counter bug: replace pipe-to-while with process substitution or temp file approach so DELETED/SKIPPED/FAILED counters propagate
2. **pattern-compliance-audit.yml** — Fix comparison: `${{ steps.scan.outputs.blocking != '0' }}` instead of `${{ steps.scan.outputs.blocking > 0 }}`
3. **deploy-firebase.yml** — Replace service account key file write with `google-github-actions/auth` action

### 2d: Remove dead code

1. **backlog-enforcement.yml** — Remove `backlog-health` job entirely (references archived file); keep `security-patterns` job
2. **deploy-firebase.yml** — Remove commented-out `preview-deploy` job
3. **validate-plan.yml** — DELETE entire file
4. **ISSUE_TEMPLATE_APP_CHECK_REENABLE.md** — DELETE (one-time procedure already executed; git history preserves content)

**Done when:** All workflows pass `act` dry-run or manual workflow_dispatch test; no tag-only third-party action refs remain; `grep -r '@v[0-9]' .github/workflows/` returns only first-party actions.
**Depends on:** None (can run parallel with Step 1)
**Triggers:** Step 8 (documentation update)

---

## Step 3: Plugin & MCP Cleanup

**Per Decisions #9, #10, #18, #19, #20**

### 3a: Remove MCP memory server

1. Edit `.mcp.json` — remove `memory` server entry (keep `sonarcloud`)
2. Edit `.claude/skills/checkpoint/SKILL.md` — remove `--mcp` flag, "MCP Save" section, and step 3 from recovery flow

### 3b: Remove Serena

1. DELETE `.serena/project.yml`
2. DELETE `.claude/hooks/stop-serena-dashboard.js`
3. Edit `.claude/settings.json` — remove the SessionStart hook entry for `stop-serena-dashboard.js`

### 3c: Remove dead plugins (user-level settings)

1. Edit `~/.claude/settings.json`:
   - Remove `"coderabbit@claude-plugins-official": true`
   - Remove `"hookify@claude-plugins-official": false`

### 3d: Remove GSD hook duplication

1. Edit `.claude/settings.json` — remove the SessionStart hook entry for `gsd-check-update.js` (lines 33-38). The user-level `~/.claude/settings.json` handles this globally.

**Done when:** `.mcp.json` has only `sonarcloud`; `.serena/` directory gone; no Serena hook in settings; CodeRabbit and hookify removed from user settings; GSD hook runs once per session (not twice).
**Depends on:** None (can run parallel with Steps 1-2)
**Triggers:** Step 8 (documentation update)

---

## Step 4: Agent Cleanup

**Per Decision #12**

### 4a: Delete 19 agent files

Delete the following from `.claude/agents/`:
```
database-architect.md
fullstack-developer.md
security-engineer.md
deployment-engineer.md
devops-troubleshooter.md
mcp-expert.md
backend-architect.md
debugger.md
error-detective.md
frontend-developer.md
penetration-tester.md
technical-writer.md
ui-ux-designer.md
dependency-manager.md
markdown-syntax-formatter.md
test-engineer.md
performance-engineer.md
prompt-engineer.md
git-flow-manager.md
```

### 4b: Verify remaining agents

Confirm `.claude/agents/` contains only:
- `nextjs-architecture-expert.md`
- `react-performance-optimization.md`
- `security-auditor.md`
- `code-reviewer.md`
- `documentation-expert.md`
- `global/` (11 GSD agents — do not touch)

**Done when:** `ls .claude/agents/*.md | wc -l` returns 5; `ls .claude/agents/global/*.md | wc -l` returns 11.
**Depends on:** None (can run parallel with Steps 1-3)
**Triggers:** Step 8 (documentation update)

---

## Step 5: ESLint Plugin Sonash Optimization

**Per Decision #28**

### 5a: Enable 4 Phase 3 rules

In `eslint.config.mjs`, add to the sonash rules section:
```javascript
"sonash/no-effect-missing-cleanup": "warn",
"sonash/no-async-component": "error",
"sonash/no-missing-error-boundary": "warn",
"sonash/no-callback-in-effect-dep": "warn",
```

### 5b: Merge no-unguarded-loadconfig into no-unguarded-file-read

In `eslint-plugin-sonash/`:
1. Add `require()` coverage from `no-unguarded-loadconfig` into `no-unguarded-file-read` rule
2. Remove `no-unguarded-loadconfig` rule definition
3. Update index.js to remove the rule export

### 5c: Remove 2 rules

1. Remove `no-unsafe-innerhtml` (Semgrep covers it better)
2. Remove `no-sql-injection` (Firestore project, no SQL)
3. Update index.js exports
4. Remove any test files for these rules

### 5d: Run full ESLint check

```bash
npm run lint
```
Address any new findings from the 4 newly-enabled rules.

**Done when:** `npm run lint` passes cleanly; 4 new rules active; 2 rules removed; merged rule covers both file-read and loadconfig patterns.
**Depends on:** None (can run parallel with Steps 1-4)
**Triggers:** Step 8 (documentation update)

---

## Step 6: New Tooling Setup

**Per Decision #26**

### 6a: Install new devDependencies

```bash
npm install -D @next/bundle-analyzer commitlint @commitlint/config-conventional typedoc
```

### 6b: Configure commitlint

Create `commitlint.config.js`:
```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'chore', 'refactor', 'test', 'ci', 'perf', 'style']],
  },
};
```

Add commitlint to husky commit-msg hook:
```bash
# .husky/commit-msg
npx --no-install commitlint --edit "$1"
```

### 6c: Configure @next/bundle-analyzer

Add to `next.config.js`/`next.config.mjs`:
```javascript
import bundleAnalyzer from '@next/bundle-analyzer';
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
// Wrap existing config
```

Add npm script: `"analyze": "ANALYZE=true npm run build"`

### 6d: Add compressed-size-action workflow

Create `.github/workflows/bundle-size.yml`:
```yaml
name: Bundle Size
on: pull_request
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<SHA>
      - uses: preactjs/compressed-size-action@<SHA>
        with:
          build-script: "build"
```

### 6e: Configure typedoc

Add npm script: `"docs:api": "typedoc --entryPointStrategy expand src/lib/ --out docs/api"`

### 6f: Evaluate unit-test-generator plugin

```bash
# Install temporarily
# Test on one module (e.g., scripts/lib/sanitize-error.js)
# If quality is template-garbage: uninstall
# If useful: keep and document
```

**Done when:** `npm run analyze` produces bundle report; `npx commitlint --from HEAD~1` validates commits; `npm run docs:api` generates typedoc output; bundle-size workflow passes dry run.
**Depends on:** None (can run parallel with Steps 1-5)
**Triggers:** Step 7 (npm script audit — new scripts to integrate), Step 8 (documentation update)

---

## Step 7: npm Script Full Audit + Husky Optimization

**Per Decisions #17, #29**

### 7a: Audit all ~140 npm scripts

For each script in `package.json`:
1. Run it (or dry-run if destructive)
2. Classify: ACTIVE (runs successfully, serves clear purpose), DEAD (references deleted files, errors), REDUNDANT (duplicate of another script), CONSOLIDATE (merge with related script)
3. Document findings in `.planning/tooling-infrastructure-audit/npm-script-audit.md`

Known dead scripts (from memory): `ecosystem:audit:all`, `lighthouse`, `docs:lint` (and 3 others)

### 7b: Execute cleanup

1. Remove all DEAD scripts from `package.json`
2. Merge REDUNDANT scripts (keep the better-named one)
3. Update any skill/hook/doc that references removed scripts

### 7c: Review bot configuration

1. Create `.qodo.yaml` — suppress categories where Gemini/Copilot provide better coverage
2. Update Gemini config (if configurable) to focus on architectural review
3. copilot-instructions.md update happens in Step 8

### 7d: Husky pre-commit optimization

1. Add timing output to pre-commit hook:
   ```bash
   HOOK_START=$(date +%s%N)
   # ... at end:
   HOOK_END=$(date +%s%N)
   ELAPSED=$(( (HOOK_END - HOOK_START) / 1000000 ))
   echo "⏱️ Pre-commit checks completed in ${ELAPSED}ms"
   ```

2. Investigate oxlint double-run: lint-staged runs `oxlint -c .oxlintrc.json` on staged files, then Wave 1 runs `npm run lint` which runs ESLint (not oxlint again). Verify whether ESLint config also invokes oxlint — if not, this may be correct behavior (oxlint on staged only, ESLint on all).

### 7e: Skill orphan scan

Quick scan for skills that:
- Reference deleted agents
- Reference removed scripts
- Have broken internal links
Document findings in `.planning/tooling-infrastructure-audit/skill-orphan-scan.md`

**Done when:** npm-script-audit.md documents all ~140 scripts with classifications; dead scripts removed; .qodo.yaml created; pre-commit hook has timing output; skill orphan scan complete.
**Depends on:** Steps 3-6 (need to know what was removed/changed to check for broken references)
**Triggers:** Step 8 (documentation update)

---

## Step 8: Comprehensive Documentation Update

**Per Decisions #21, #30**

### 8a: Update CLAUDE.md

- Section 7 agent triggers: verify security-auditor, code-reviewer, documentation-expert references still point to existing agents
- Remove any references to deleted agents
- Add any new tooling references (commitlint, typedoc, bundle analyzer)

### 8b: Update copilot-instructions.md

Full rewrite of `.github/copilot-instructions.md` to reflect current:
- Project structure
- Stack versions (Next.js 16, React 19, Firebase 12.8, etc.)
- Build/test commands
- CI/CD overview (updated workflow list)
- Architecture patterns
- Common issues

### 8c: Update SKILL_INDEX.md

- Remove references to any orphaned skills found in Step 7e
- Verify all listed skills still exist
- Update counts

### 8d: Update other affected docs

- `AI_WORKFLOW.md` — if it references Serena, MCP memory, or deleted agents
- `SESSION_CONTEXT.md` — if it references removed tooling
- `scripts/README.md` — update after npm script cleanup
- Any docs referencing validate-plan.yml or removed workflows

### 8e: Update .mcp.json note

Update the `_note` field in `.mcp.json` to reflect current auto-discovered servers (remove Serena reference if present).

**Done when:** All docs reference only existing agents/skills/workflows/scripts; copilot-instructions.md is current; no broken references in CLAUDE.md.
**Depends on:** All previous steps (needs final state to document accurately)
**Triggers:** Step 9 (audit)

---

## Step 9: Audit

Run code-reviewer agent on all new/modified files. Verify:

1. **Security:** Branch protection active, vulnerability alerts enabled, all actions SHA-pinned
2. **Consistency:** No references to deleted agents, removed plugins, dead scripts
3. **Functionality:** CI passes, pre-commit hook works, new devDeps configured correctly
4. **Completeness:** Every decision in DECISIONS.md maps to a completed action

**Done when:** All findings addressed or tracked in TDMS.
**Depends on:** All previous steps.

---

## Parallelization Guide

```
Wave 1 (parallel): Steps 1, 2, 3, 4, 5, 6
Wave 2 (after Wave 1): Step 7 (needs to know what was removed)
Wave 3 (after Wave 2): Step 8 (needs final state)
Wave 4 (after Wave 3): Step 9 (audit)
```

Steps 1-6 are fully independent and can be executed in parallel by separate agents.
