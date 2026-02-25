# Skill and Agent Usage Policy

**Document Version:** 1.2 **Status:** Active **Last Updated:** 2026-02-23

## Purpose

This document defines the policy for creating, using, and overriding skills and
agents in the SoNash development workflow. It ensures consistent quality gates
and creates an audit trail for accountability.

## Quick Start

1. Check available skills: `ls .claude/commands/`
2. Validate skills: `npm run skills:validate`
3. Override when needed: Document in session audit

---

## 1. Skill/Command File Requirements

### Required Structure

All skill files live in `.claude/skills/<skill-name>/SKILL.md`. For full
structural standards, see
[SKILL_STANDARDS.md](../../.claude/skills/_shared/SKILL_STANDARDS.md).

```markdown
---
name: skill-name
description: Brief description of what the skill does
---

# Skill Title

## When to Use

## When NOT to Use

[Content describing the skill's purpose and usage]

## Version History
```

### Shared Templates

Common boilerplate lives in `.claude/skills/_shared/`:

- `AUDIT_TEMPLATE.md` — Evidence, TDMS intake, review procedures for audit
  skills
- `SKILL_STANDARDS.md` — Canonical structural and quality standards

### Companion Files

When a skill exceeds 500 lines, extract content to companion files in the same
directory (e.g., `prompts.md`, `examples.md`, `domains.md`, `ARCHIVE.md`).
Reference via Read tool instructions in SKILL.md.

### Validation

Skills are automatically validated by `npm run skills:validate` which checks:

- YAML frontmatter with `name` and `description` fields
- Title heading (`# Title`)
- Required sections: When to Use, When NOT to Use, Version History
- Required sections for audit commands:
  - Pre-Audit Validation
  - Post-Audit
  - Output Requirements
- File references exist
- No deprecated patterns (TODO/FIXME/PLACEHOLDER)
- Line count under 500 (warning) / 800 (error)

### Creating New Skills

1. Create directory `.claude/skills/<skill-name>/`
2. Create `SKILL.md` with required frontmatter, sections, and version history
3. Reference
   [SKILL_STANDARDS.md](../../.claude/skills/_shared/SKILL_STANDARDS.md) for
   full checklist
4. Run `npm run skills:validate` before committing
5. Skill is automatically available via `/skill-name`

---

## 2. Expected Usage Patterns

### When to Use Each Skill/Agent

| Activity                     | Required Skill/Agent   | Severity  |
| ---------------------------- | ---------------------- | --------- |
| Modifying auth/security code | `security-auditor`     | Blocking  |
| Writing/modifying code files | `code-reviewer`        | Warning   |
| Adding/modifying test files  | `test-engineer`        | Suggested |
| Bug investigation            | `systematic-debugging` | Warning   |
| Starting a work session      | `/session-begin`       | Required  |
| Ending a work session        | `/session-end`         | Required  |
| Commit failure (pre-commit)  | `/pre-commit-fixer`    | Suggested |
| 5+ code files modified       | Delegated code review  | Suggested |

### Skill Usage Verification

The system tracks skill usage via session activity logging:

```bash
# Check if expected skills were used
npm run skills:verify-usage

# Strict mode (returns exit code 1 for missing skills)
npm run skills:verify-usage -- --strict
```

### Session Activity Logging

Activities are logged to `.claude/state/commit-log.jsonl`:

```bash
# Log a session event
npm run session:log -- --event=session_start
npm run session:log -- --event=file_write --file=path/to/file.ts
npm run session:log -- --event=skill_invoke --skill=code-reviewer

# View session summary
npm run session:summary
```

---

## 3. Trigger System

### Event-Based Triggers

The trigger checker (`npm run triggers:check`) monitors for conditions requiring
action:

| Trigger            | Condition                               | Severity | Action                     |
| ------------------ | --------------------------------------- | -------- | -------------------------- |
| `security_audit`   | Security-sensitive code files modified  | Blocking | Run security-auditor       |
| `consolidation`    | Within 2 reviews of consolidation limit | Warning  | Check consolidation status |
| `skill_validation` | Skill/command files modified            | Warning  | Validate skill structure   |

### Pre-Push Integration

Triggers are checked during `git push`:

1. **Blocking triggers** prevent the push until resolved
2. **Warning triggers** display recommendations but allow push
3. **Overrides** are available but logged for audit trail

---

## 4. Override Policy

### When Overrides Are Acceptable

Overrides should be used sparingly and only when:

1. **Already completed the action** - e.g., already ran security-auditor in
   session
2. **False positive** - trigger detected incorrectly (document in override
   reason)
3. **Emergency fix** - time-critical issue requiring immediate push (explain in
   reason)
4. **Known baseline** - existing issue documented elsewhere

### How to Override

```bash
# Override with reason (recommended)
SKIP_REASON="Already ran security-auditor this session" SKIP_TRIGGERS=1 git push

# Override without reason (discouraged)
SKIP_TRIGGERS=1 git push
```

### Override Audit Trail

All overrides are logged to `.claude/override-log.jsonl`:

```bash
# View recent overrides
npm run override:list

# Log manual override
npm run override:log -- --check=triggers --reason="Reason here"
```

### Override Log Contents

Each override entry includes:

- Timestamp
- Check type that was overridden
- Reason provided (or "No reason provided")
- User who made the override
- Git branch
- Working directory

### Reviewing Override History

Periodic review of override logs is recommended to:

1. Identify recurring false positives (add to FALSE_POSITIVES.jsonl)
2. Detect patterns of skipped checks (potential process issues)
3. Audit accountability for critical overrides

---

## 5. Hooks Integration

### Pre-Commit Hooks

| Check                   | Blocking | Condition               |
| ----------------------- | -------- | ----------------------- |
| ESLint                  | Yes      | Always                  |
| Prettier                | No       | Always (warning only)   |
| Pattern compliance      | Yes      | Always                  |
| Tests                   | Yes      | Always                  |
| CANON validation        | No       | When JSONL files staged |
| Skill validation        | No       | When skill files staged |
| Learning entry reminder | No       | When many files changed |

### Pre-Push Hooks

| Check                 | Blocking | Override           |
| --------------------- | -------- | ------------------ |
| Tests                 | Yes      | None               |
| Circular dependencies | Yes      | None               |
| Pattern compliance    | Yes      | None               |
| Type check            | Yes      | None               |
| npm audit             | No       | N/A (warning only) |
| Event triggers        | Varies   | `SKIP_TRIGGERS=1`  |

---

## 6. Examples

### Example: Security-Sensitive Code Change

```bash
# 1. Modify auth-related file
# (system detects lib/auth/login.ts modified)

# 2. Try to push
git push
# ❌ Blocked: Security-sensitive files modified

# 3. Run required skill
# Use security-auditor agent to review changes

# 4. Push succeeds after review
git push
# ✅ All checks passed
```

### Example: Overriding After Completing Action

```bash
# 1. Already ran security-auditor during session

# 2. Push blocked because system doesn't know
git push
# ❌ Blocked: Security-sensitive files modified

# 3. Override with explanation
SKIP_REASON="Ran security-auditor earlier in session #65" SKIP_TRIGGERS=1 git push
# ✅ Push allowed (override logged)
```

### Example: Creating a New Skill

```bash
# 1. Create skill file
cat > .claude/commands/my-skill.md << 'EOF'
---
description: My custom skill for specific task
---

# My Custom Skill

Description of what this skill does...

## Usage

How to use this skill...
EOF

# 2. Validate
npm run skills:validate

# 3. Commit (skill validation runs automatically)
git commit -m "feat: add my-skill command"
```

---

## 7. Metrics and Monitoring

### Session Summary

At session end, review activity summary:

```bash
npm run session:summary
```

Shows:

- Session duration
- Files modified
- Skills/agents invoked
- Commits made

### Override Frequency

Monitor override usage:

```bash
npm run override:list
```

High override counts for specific checks may indicate:

- Need for false positive entries
- Process friction requiring adjustment
- Training needs

---

## Related Documentation

- [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Anti-patterns to avoid
- [AI_WORKFLOW.md](../../AI_WORKFLOW.md) - Session workflow guidelines
- [DEVELOPMENT.md](../../DEVELOPMENT.md) - Development setup and hooks
- [FALSE_POSITIVES.jsonl](../technical-debt/FALSE_POSITIVES.jsonl) - Known false
  positives

---

## Version History

| Version | Date       | Changes                                                             |
| ------- | ---------- | ------------------------------------------------------------------- |
| 1.0     | 2026-01-13 | Initial policy documentation                                        |
| 1.1     | 2026-01-15 | Added Version History section                                       |
| 1.2     | 2026-02-23 | Fix FALSE_POSITIVES link, fix session log path, update Last Updated |
