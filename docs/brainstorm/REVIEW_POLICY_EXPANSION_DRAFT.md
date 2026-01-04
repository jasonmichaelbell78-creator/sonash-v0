# Review Policy Expansion - Draft Design

**Status:** DRAFT - For refinement before integration
**Created:** 2026-01-04
**Purpose:** Design document for expanding review policies beyond code

---

## 1. Correction Framework

### Philosophy

Detection without correction is documentation, not enforcement. Every detection must have a corresponding correction mechanism.

### Correction Types

| Correction Type | When to Use | Example |
|----------------|-------------|---------|
| **BLOCK** | Critical violations that cannot proceed | Security rule without tests |
| **REQUIRE_ACTION** | Must take action but have choice | "Run code-reviewer OR provide justification" |
| **WARN_PROMINENT** | Important but not blocking | Formatting issues (until codebase formatted) |
| **LOG_ONLY** | Track for patterns, no immediate action | First-time usage of a skill |

### Correction Template

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ BLOCKED: [What was detected]                              │
├─────────────────────────────────────────────────────────────┤
│ Context:                                                     │
│   [What triggered this check]                               │
│   [What was expected vs found]                              │
│                                                              │
│ Why this matters:                                            │
│   [Link to past issues caused by this - specific reviews]   │
│                                                              │
│ To proceed, EITHER:                                          │
│   1. [Specific action to fix]                               │
│   2. Override with justification:                           │
│      SKIP_REASON="[your reason]" npm run [command]          │
│                                                              │
│ Overrides are logged to: .claude/override-log.jsonl         │
└─────────────────────────────────────────────────────────────┘
```

### Override Mechanism

Overrides are allowed but:
1. Must provide explicit reason
2. Are logged permanently
3. Are reviewed during consolidation cycles
4. Excessive overrides trigger escalation:
   - **Per-session threshold:** ≥5 overrides in single session → WARN_PROMINENT
   - **Per-check threshold:** ≥3 overrides on same check type within 7 days → escalate to human review
   - **Absolute threshold:** ≥10 total overrides within 7 days → require explicit acknowledgment before next session

```jsonl
{"timestamp":"2026-01-04T10:30:00Z","check":"skill-usage","skipped":"code-reviewer","reason":"Trivial 1-line typo fix","session":21}
```

### Correction Actions by Detection Type

| Detection | Correction | Blocking Level |
|-----------|------------|----------------|
| Code written, no code-reviewer | Prompt to run code-reviewer | REQUIRE_ACTION |
| Bug fixed, no systematic-debugging | Prompt to document root cause | REQUIRE_ACTION |
| Security file changed, no security-auditor | Block push until audit | BLOCK |
| Skill config invalid | Block session start | BLOCK |
| Agent created without examples | Warn, log for review | WARN_PROMINENT |
| Procedure skipped | Require acknowledgment | REQUIRE_ACTION |

---

## 2. Event-Based Trigger System

### Trigger Categories

**Instead of time-based ("weekly", "monthly"), use activity-based:**

| Trigger Type | Mechanism | Examples |
|--------------|-----------|----------|
| **Count-Based** | After N occurrences | Every 10 reviews, every 50 commits |
| **Threshold-Based** | When metric exceeds limit | >100 lint warnings, >5 security files changed |
| **Completion-Based** | When milestone reached | Step complete, phase complete, PR merged |
| **Delta-Based** | When change detected | New skill added, config changed |
| **Accumulation-Based** | When backlog grows | 10+ patterns not yet consolidated |

### Specific Triggers

#### Consolidation Trigger (Already exists - keep)
```
WHEN: reviews_since_last >= 10
ACTION: Consolidate patterns to claude.md
```

#### Security Audit Trigger
```
WHEN: security_sensitive_files_changed >= 3
  OR: firestore.rules modified
  OR: Cloud Functions security-wrapper.ts modified
ACTION: Run security audit before merge
BLOCKING: Yes
```

#### Dependency Audit Trigger
```
WHEN: package.json modified
  AND: commits_since_change >= 5
ACTION: Run npm audit, review changes
BLOCKING: If high/critical CVEs
```

#### Documentation Drift Trigger
```
WHEN: code_files_changed >= 20
  AND: doc_files_changed == 0
ACTION: Prompt for documentation review
BLOCKING: No (WARN_PROMINENT)
```

#### Skill/Agent Audit Trigger
```
WHEN: skill_created OR skill_modified OR agent_created OR agent_modified
ACTION: Validate configuration, require examples
BLOCKING: Yes for new, No for modifications
```

#### Pattern Enforcement Trigger
```
WHEN: new_pattern_added_to_claude_md
ACTION: Add automated check to patterns:check if possible
BLOCKING: No (tracked for next consolidation)
```

### Trigger Implementation

```javascript
// scripts/check-triggers.js
const TRIGGERS = {
  security_audit: {
    condition: (stats) =>
      stats.security_files_changed >= 3 ||
      stats.files_changed.includes('firestore.rules'),
    action: 'security-audit',
    blocking: true,
    message: 'Security-sensitive changes detected. Security audit required.'
  },

  consolidation: {
    condition: (stats) => stats.reviews_since_consolidation >= 10,
    action: 'consolidate-patterns',
    blocking: false,
    message: 'Pattern consolidation due (10+ reviews since last).'
  },

  skill_validation: {
    condition: (stats) =>
      stats.files_changed.some(f => f.includes('.claude/skills/') || f.includes('.claude/agents/')),
    action: 'validate-skill-config',
    blocking: true,
    message: 'Skill/agent files changed. Validation required.'
  }
};
```

---

## 3. Usage Verification System

### What to Verify

| Artifact Type | Expected Usage | Detection Method |
|---------------|----------------|------------------|
| code-reviewer agent | After writing significant code | Check git diff vs agent invocation log |
| systematic-debugging skill | Before fixing bugs | Check commit messages + skill invocation |
| security-auditor agent | After security file changes | Check file paths vs agent invocation |
| documentation-expert agent | After doc-heavy sessions | Check md file changes vs agent invocation |

### Session Activity Tracking

```jsonl
// .claude/session-activity.jsonl (append-only)
{"session":21,"timestamp":"2026-01-04T10:00:00Z","event":"session_start"}
{"session":21,"timestamp":"2026-01-04T10:05:00Z","event":"file_write","path":"components/auth/login.tsx","lines":45}
{"session":21,"timestamp":"2026-01-04T10:10:00Z","event":"skill_invoke","skill":"code-reviewer"}
{"session":21,"timestamp":"2026-01-04T10:15:00Z","event":"commit","hash":"abc123","files":3}
{"session":21,"timestamp":"2026-01-04T10:30:00Z","event":"session_end"}
```

### Verification Rules

```javascript
// scripts/verify-skill-usage.js
const USAGE_RULES = {
  'code-reviewer': {
    required_when: (session) =>
      session.files_written.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).length >= 3 ||
      session.lines_written >= 100,
    exception_allowed: true,
    exception_prompt: 'Code written but code-reviewer not used. Provide reason or run now.'
  },

  'systematic-debugging': {
    required_when: (session) =>
      session.commits.some(c => c.message.match(/fix|bug|error|issue/i)),
    exception_allowed: true,
    exception_prompt: 'Bug fix committed without systematic-debugging. Document root cause.'
  },

  'security-auditor': {
    required_when: (session) =>
      session.files_written.some(f =>
        f.includes('security') ||
        f.includes('auth') ||
        f === 'firestore.rules'
      ),
    exception_allowed: false,
    blocking: true,
    block_message: 'Security file modified. security-auditor REQUIRED before push.'
  }
};
```

### Configuration Validation

For skills and agents, validate on creation/modification:

```javascript
// scripts/validate-skill-config.js

function validateSkill(skillPath) {
  const errors = [];
  const warnings = [];

  const skillMd = readFile(`${skillPath}/SKILL.md`);

  // Required sections
  if (!skillMd.includes('## When to Use')) {
    errors.push('Missing "When to Use" section');
  }

  if (!skillMd.includes('## Examples')) {
    warnings.push('Missing "Examples" section (recommended)');
  }

  // Check file references exist
  const fileRefs = extractFileReferences(skillMd);
  for (const ref of fileRefs) {
    if (!fileExists(ref)) {
      errors.push(`Broken reference: ${ref}`);
    }
  }

  // Check for deprecated patterns
  const deprecatedPatterns = loadDeprecatedPatterns();
  for (const pattern of deprecatedPatterns) {
    if (skillMd.includes(pattern.text)) {
      warnings.push(`Uses deprecated pattern: ${pattern.name}`);
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
}
```

---

## 4. Integration Points

### Pre-Commit Hook Additions

```bash
# .husky/pre-commit (additions)

# Check skill/agent config if modified
SKILL_CHANGES=$(git diff --cached --name-only | grep -E '\.claude/(skills|agents)/')
if [ -n "$SKILL_CHANGES" ]; then
  echo "  ▶ Validating skill/agent configurations..."
  if ! node scripts/validate-skill-config.js $SKILL_CHANGES; then
    echo "  ❌ Skill/agent validation failed"
    exit 1
  fi
  echo "  ✅ Skill/agent configurations valid"
fi
```

### Pre-Push Hook Additions

```bash
# .husky/pre-push (additions)

# Check event-based triggers
echo "  ▶ Checking review triggers..."
TRIGGER_RESULT=$(node scripts/check-triggers.js)
if echo "$TRIGGER_RESULT" | grep -q "BLOCKING"; then
  echo "  ❌ Blocking trigger active:"
  echo "$TRIGGER_RESULT"
  exit 1
fi
if echo "$TRIGGER_RESULT" | grep -q "WARNING"; then
  echo "  ⚠️  Non-blocking triggers:"
  echo "$TRIGGER_RESULT"
fi
```

### Session-End Additions

```bash
# In session-end command processing

# Verify skill usage for session
echo "  ▶ Verifying skill/agent usage..."
USAGE_RESULT=$(node scripts/verify-skill-usage.js --session=$SESSION_ID)
if echo "$USAGE_RESULT" | grep -q "REQUIRED"; then
  echo "  ⚠️  Skill usage verification:"
  echo "$USAGE_RESULT"
  # Prompt for action or override
fi
```

---

## 5. New Scripts Required

| Script | Purpose | Priority |
|--------|---------|----------|
| `scripts/check-triggers.js` | Event-based trigger evaluation | P0 |
| `scripts/verify-skill-usage.js` | Session skill usage verification | P1 |
| `scripts/validate-skill-config.js` | Skill/agent configuration validation | P1 |
| `scripts/log-session-activity.js` | Track session events (hook integration) | P2 |
| `scripts/review-overrides.js` | Analyze override patterns | P3 |

---

## 6. Policies Required

| Policy Document | Purpose | Priority |
|-----------------|---------|----------|
| `docs/FIREBASE_CHANGE_POLICY.md` | Firebase/security change requirements | P0 |
| `docs/SKILL_AGENT_POLICY.md` | Skill/agent creation and usage standards | P1 |
| `docs/OVERRIDE_POLICY.md` | When and how overrides are acceptable | P2 |

---

## 7. Metrics to Track

| Metric | Source | Purpose |
|--------|--------|---------|
| Skill invocation rate per session | session-activity.jsonl | Verify skills being used |
| Override frequency by check type | override-log.jsonl | Identify friction points |
| Trigger activations per week | check-triggers.js output | Calibrate thresholds |
| Blocked actions per session | pre-commit/push logs | Measure enforcement |
| Time from detection to correction | Session timestamps | Efficiency metric |

---

## 8. Testing Strategy

### Unit Tests for New Scripts

Each new script should have corresponding Jest tests:

| Script | Test File | Key Test Cases |
|--------|-----------|----------------|
| `check-triggers.js` | `__tests__/check-triggers.test.js` | Threshold boundaries, multi-trigger scenarios, edge cases |
| `verify-skill-usage.js` | `__tests__/verify-skill-usage.test.js` | Exception handling, blocking vs non-blocking |
| `validate-skill-config.js` | `__tests__/validate-skill-config.test.js` | Valid/invalid configs, missing sections |

### Integration Tests

```javascript
// __tests__/integration/policy-enforcement.test.js
describe('Policy Enforcement Integration', () => {
  it('should block security file changes without audit', async () => {
    // Simulate git commit with firestore.rules
    // Verify pre-push hook blocks
  });

  it('should log override and allow with justification', async () => {
    // Trigger check, provide override reason
    // Verify logged to override-log.jsonl
  });

  it('should escalate after threshold breached', async () => {
    // Create 5 overrides in session
    // Verify WARN_PROMINENT triggered
  });
});
```

### Manual Testing Checklist

Before deploying new enforcement:
- [ ] Test with real session (not just unit tests)
- [ ] Verify override mechanism works
- [ ] Check that blocking doesn't break normal workflows
- [ ] Confirm log files written correctly
- [ ] Test rollback procedure

### Rollback Strategy

If new enforcement causes issues:
1. Disable in `.claude/settings.json` (`"enforcementLevel": "warn"`)
2. Document issue in AI_REVIEW_LEARNINGS_LOG.md
3. Adjust thresholds or fix logic
4. Re-enable with `"enforcementLevel": "block"`

---

## 9. Implementation Order

**Principle: Build detection before correction, infrastructure before policies**

### Phase A: Infrastructure (Do First - Benefits Everything)
1. Session activity logging script
2. Trigger checking script
3. Pre-commit/pre-push hook integration

### Phase B: Skill/Agent System
4. Skill configuration validator
5. Usage verification script
6. SKILL_AGENT_POLICY.md

### Phase C: Security/Firebase
7. FIREBASE_CHANGE_POLICY.md
8. Security file detection in triggers
9. Firestore rules testing integration

### Phase D: Refinement
10. Override logging and analysis
11. Metrics dashboard
12. Threshold tuning based on data

---

## Next Steps

1. Integrate as **Step 5** in INTEGRATED_IMPROVEMENT_PLAN.md (Review Policy Integration)
2. Prioritize based on dependencies (infrastructure first)
3. Estimate effort for each task
4. Begin implementation after Step 4 (Delta Review) is complete

