# PR Review Improvement Options

**Document Version:** 1.0
**Created:** 2026-01-08
**Status:** DRAFT - Options for evaluation
**Context:** 100% AI-coded application requiring careful code quality oversight

---

## Problem Statement

The current PR review workflow creates an endless feedback loop:
1. Code is written (by AI)
2. PR is created
3. Multiple AI review tools (CodeRabbit, Qodo, SonarQube) generate feedback
4. Fixes are applied
5. New feedback is generated on fixes
6. Cycle repeats (Reviews #101-107 demonstrate this pattern)

**Key Constraints:**
- User cannot always distinguish real issues from false positives
- Multiple tools have overlapping but inconsistent rules
- No single source of truth for what constitutes a valid issue
- Security issues must not be missed despite noise

---

## Current Tool Stack

| Tool | Integration | Strengths | Weaknesses |
|------|-------------|-----------|------------|
| **CodeRabbit** | GitHub PR | Fast, good summaries | Diff-only context, no cross-repo understanding |
| **Qodo** | GitHub PR | RAG-based context, learns patterns | Setup complexity, some false positives |
| **SonarQube** | GitHub PR | Industry standard, security focus | Static analysis only, no AI context |
| **ESLint** | Local/CI | Fast, configurable | No AI understanding of intent |
| **Pattern Compliance** | Local/CI | Project-specific rules | Requires manual rule creation |

---

## Option Categories

### Category A: Pre-Commit Prevention (Shift Left)

**Philosophy:** Catch issues before they reach PR stage

#### Option A1: Expanded Pre-Commit Hooks
**Effort:** Low (1-2 hours)
**Risk:** Low
**Implementation:**
```bash
# Add to .husky/pre-commit:
npm run patterns:check        # Already implemented
npm run lint                  # Already exists
npx tsc --noEmit             # Type checking
```

**Pros:**
- Zero PR review feedback for these categories
- Immediate developer feedback
- No tool configuration needed

**Cons:**
- Slower commits
- Only catches known patterns
- No AI-level understanding

#### Option A2: Local ESLint Security Plugin
**Effort:** Medium (2-4 hours)
**Risk:** Low
**Implementation:**
```bash
npm install --save-dev eslint-plugin-security
# Add to eslint.config.mjs:
import security from 'eslint-plugin-security'
...security.configs.recommended
```

**Catches:**
- `detect-object-injection`
- `detect-non-literal-fs-filename`
- `detect-unsafe-regex`
- `detect-eval-with-expression`
- `detect-child-process`

**Pros:**
- Catches ~80% of security issues CodeRabbit flags
- Fast local feedback
- Already have FALSE_POSITIVES.jsonl for known exceptions

**Cons:**
- Initial noise (need to configure exclusions)
- May duplicate existing ESLint rules

#### Option A3: Pre-Commit Secrets Detection
**Effort:** Low (1 hour)
**Risk:** Low
**Implementation:**
```bash
npm install --save-dev secretlint @secretlint/secretlint-rule-preset-recommend
# Add to pre-commit:
npx secretlint "**/*"
```

**Pros:**
- Catches API keys, tokens, credentials before commit
- Different from code quality issues

**Cons:**
- Additional tool to maintain
- May flag example/test credentials

#### Option A4: Pre-Commit Circular Dependency Check
**Effort:** Low (already exists)
**Risk:** Low
**Implementation:**
```bash
# Already in pre-push, move to pre-commit:
npx madge --circular --extensions ts,tsx src/
```

**Pros:**
- Catches architecture issues early
- Already integrated

**Cons:**
- Slower pre-commit

---

### Category B: Tool Consolidation

**Philosophy:** Reduce noise by using fewer, better-configured tools

#### Option B1: Single Primary Tool (Qodo Only)
**Effort:** Low (1 hour)
**Risk:** Medium
**Implementation:**
1. Disable CodeRabbit via `.coderabbit.yaml` or GitHub app settings
2. Configure Qodo as primary via `.pr_agent.toml`
3. Keep SonarQube for security baseline only

**Configuration (.pr_agent.toml):**
```toml
[pr_reviewer]
require_score_review = true
minimal_score_threshold = 80
extra_instructions = """
This is a 100% AI-coded project. Focus on:
- Security vulnerabilities (HIGH priority)
- Logic errors (HIGH priority)
- Performance issues (MEDIUM priority)
Skip:
- Style suggestions (handled by ESLint/Prettier)
- Documentation suggestions (handled locally)
"""
```

**Pros:**
- Single source of truth
- Qodo has best context understanding
- Fewer duplicate issues

**Cons:**
- May miss issues Qodo doesn't catch
- Dependency on single vendor

#### Option B2: Tiered Tool Activation
**Effort:** Medium (3-4 hours)
**Risk:** Low
**Implementation:**
- **Tier 1 (Every PR):** ESLint, Prettier, Pattern Compliance (local)
- **Tier 2 (Feature PRs):** Qodo only
- **Tier 3 (Release PRs):** All tools (Qodo + CodeRabbit + SonarQube)

**Pros:**
- Appropriate scrutiny per PR type
- Reduces noise on small PRs
- Full coverage on important PRs

**Cons:**
- Requires PR labeling/detection logic
- More complex workflow

#### Option B3: Tool-Specific Rule Profiles
**Effort:** Medium (4-6 hours)
**Risk:** Low
**Implementation:**
Create project-specific configurations for each tool:

**CodeRabbit (.coderabbit.yaml):**
```yaml
reviews:
  high_level_summary_only: true
  auto_review:
    ignore_files:
      - "**/*.test.ts"
      - "docs/**"
      - "scripts/**"
    only_files:
      - "src/**"
      - "functions/**"
```

**Qodo (.pr_agent.toml):**
```toml
[pr_reviewer]
minimal_score_threshold = 75
categories_to_skip = ["documentation", "style"]
```

**SonarQube:**
- Custom Quality Profile excluding info-level issues
- Custom Quality Gate with stricter security rules

**Pros:**
- Keeps all tools but reduces noise
- Each tool focused on its strengths

**Cons:**
- Configuration maintenance burden
- Tools may still overlap

---

### Category C: Intelligent Filtering

**Philosophy:** Keep all feedback but filter intelligently before human review

#### Option C1: Confidence-Based Scoring System
**Effort:** High (6-8 hours)
**Risk:** Medium
**Implementation:**
Create `scripts/score-pr-feedback.js`:
```javascript
const SCORE_WEIGHTS = {
  source: {
    'local-eslint': 95,
    'local-patterns': 90,
    'npm-audit': 90,
    'sonarqube': 75,
    'qodo': 70,
    'coderabbit': 65,
  },
  category: {
    'security': 1.3,
    'type-error': 1.2,
    'logic-error': 1.1,
    'performance': 0.9,
    'code-style': 0.5,
    'documentation': 0.4,
  },
  validation: {
    'dual-tool': 1.5,    // Multiple tools agree
    'single-tool': 1.0,
    'contradicted': 0.2, // Tools disagree
  }
};

// Only show issues scoring > THRESHOLD
const THRESHOLD = 70;
```

**Pros:**
- Data-driven prioritization
- Can tune based on historical accuracy
- Preserves all feedback for audit trail

**Cons:**
- Requires building and maintaining scorer
- May miss edge cases with low scores
- Initial calibration needed

#### Option C2: False Positives Database Expansion
**Effort:** Medium (ongoing)
**Risk:** Low
**Implementation:**
Aggressively populate `FALSE_POSITIVES.jsonl`:
```bash
# After each review cycle, add patterns that recur
node scripts/add-false-positive.js \
  --pattern "pattern-here" \
  --category "security|code|documentation" \
  --reason "Why this is a false positive" \
  --source "Review #N"
```

**Target categories:**
1. ESLint security plugin exceptions (FP-011 to FP-015 exist)
2. Tool hallucinations (file missing, range gaps)
3. Project-specific intentional patterns
4. Architecture decisions that look like issues

**Pros:**
- Gets smarter over time
- Already integrated with validate-audit.js
- Low ongoing effort per entry

**Cons:**
- Reactive, not proactive
- Requires discipline to maintain
- May become stale if patterns change

#### Option C3: AI Adjudicator Layer
**Effort:** High (8-12 hours)
**Risk:** Medium-High
**Implementation:**
Create `/pr-review-adjudicate` command:
```markdown
1. Collect all tool feedback into unified format
2. Send to Claude with project context:
   - claude.md
   - CODE_PATTERNS.md
   - FALSE_POSITIVES.jsonl
   - Recent file changes
3. Ask: "Which issues are real vs false positives?"
4. Output filtered list with confidence scores
```

**Pros:**
- Leverages AI to filter AI feedback
- Can understand project context
- Reduces human review burden

**Cons:**
- AI judging AI introduces error propagation
- Adds API cost per review
- May miss novel issues
- ~70-85% reliability at best

---

### Category D: Workflow Changes

**Philosophy:** Change when and how reviews happen

#### Option D1: Milestone-Based Reviews
**Effort:** Low (process change)
**Risk:** Medium
**Implementation:**
- Only trigger full AI review at milestones:
  - Feature completion
  - Pre-merge to main
  - Weekly scheduled audits
- Use light local validation for daily work

**Pros:**
- Fewer review cycles
- Focused feedback at decision points
- Matches natural development rhythm

**Cons:**
- Issues accumulate longer
- Bigger fix batches
- May miss urgent issues

#### Option D2: Draft PR Workflow
**Effort:** Low (process change)
**Risk:** Low
**Implementation:**
1. Create PRs as "Draft" initially
2. Work through issues without triggering reviews
3. Convert to "Ready for Review" when stable
4. Only then do full tool reviews run

**Pros:**
- Avoids feedback on WIP code
- Natural workflow in GitHub
- No tooling changes needed

**Cons:**
- Requires discipline to use drafts
- Some tools may still run on drafts
- Delays feedback

#### Option D3: Batched Fix Commits
**Effort:** Low (process change)
**Risk:** Low
**Implementation:**
Instead of:
- Fix issue 1 → commit → push → review → Fix issue 2 → ...

Do:
- Fix all issues → single commit → push → review

**Pros:**
- One review cycle instead of many
- Reduces context-switching
- Cleaner git history

**Cons:**
- Larger commits harder to review
- May introduce new issues in batch

---

### Category E: Enhanced Monitoring

**Philosophy:** Track patterns to improve over time

#### Option E1: Review Feedback Analytics
**Effort:** Medium (4-6 hours)
**Risk:** Low
**Implementation:**
Create `scripts/analyze-review-history.js`:
- Parse AI_REVIEW_LEARNINGS_LOG.md
- Calculate: issues per review, fix rate, category breakdown
- Track: false positive rate by tool, recurring patterns
- Output: monthly report

**Metrics to track:**
- Issues per tool (CodeRabbit vs Qodo vs SonarQube)
- False positive rate per tool
- Time spent on reviews
- Recurring pattern frequency

**Pros:**
- Data-driven tool selection
- Identifies high-noise tools
- Tracks improvement over time

**Cons:**
- Requires consistent logging
- Analysis effort
- Historical data may be incomplete

#### Option E2: Automated False Positive Detection
**Effort:** High (8-10 hours)
**Risk:** Medium
**Implementation:**
After each review:
1. Compare new feedback to FALSE_POSITIVES.jsonl
2. Auto-filter matches
3. Suggest new FP entries for recurring items
4. Track FP hit rate

**Pros:**
- Reduces manual filtering
- Surfaces FP candidates automatically
- Self-improving system

**Cons:**
- Complex to implement well
- May suggest incorrect FPs
- Requires human oversight

---

## Recommended Implementation Path

### Phase 1: Immediate (This Session)
- [x] Add `patterns:check` to pre-commit hook
- [ ] Create this options document

### Phase 2: Short-Term (Step 5)
- [ ] Option A2: Add ESLint security plugin locally
- [ ] Option B3: Create tool-specific configurations
- [ ] Option C2: Add 10+ more false positives from recent reviews

### Phase 3: Medium-Term (Post Step 7)
- [ ] Option B1 or B2: Evaluate tool consolidation after data collection
- [ ] Option C1: Build scoring system if noise remains high
- [ ] Option E1: Implement review analytics

### Phase 4: Long-Term (As Needed)
- [ ] Option C3: AI adjudicator (only if other options insufficient)
- [ ] Option D1: Milestone-based reviews (requires process maturity)

---

## Decision Criteria

When evaluating options, consider:

| Criterion | Weight | Notes |
|-----------|--------|-------|
| **Security coverage** | Critical | Must not miss real security issues |
| **False positive rate** | High | Reduces wasted effort |
| **Implementation effort** | Medium | Solo project, time is limited |
| **Maintenance burden** | Medium | Ongoing cost matters |
| **Developer experience** | Medium | Friction affects velocity |

---

## References

- [AI_REVIEW_LEARNINGS_LOG.md](../AI_REVIEW_LEARNINGS_LOG.md) - Historical review patterns
- [AI_REVIEW_PROCESS.md](../AI_REVIEW_PROCESS.md) - Current review workflow
- [REVIEW_POLICY_EXPANSION_DRAFT.md](./REVIEW_POLICY_EXPANSION_DRAFT.md) - Related policy work
- [CODE_PATTERNS.md](../agent_docs/CODE_PATTERNS.md) - Known patterns to check
- [FALSE_POSITIVES.jsonl](../audits/FALSE_POSITIVES.jsonl) - Current false positive database

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-01-08 | Initial creation with 5 categories, 14 options |
