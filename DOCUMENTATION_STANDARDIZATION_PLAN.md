# 📚 SoNash Documentation Standardization Plan

**Document Version:** 1.0
**Created:** 2025-12-31
**Status:** Active - Ready for Implementation
**Overall Completion:** 0% (Planning Complete)

---

## ⚠️ CRITICAL: WORK BLOCKER

**THIS DOCUMENTATION STANDARDIZATION EFFORT BLOCKS ALL OTHER PROJECT WORK.**

No feature development, refactoring, or new initiatives should begin until:
- ✅ All 7 phases of this plan are COMPLETE
- ✅ All docs pass automated linter
- ✅ AI_WORKFLOW.md is published and verified
- ✅ All templates are created and tested
- ✅ Multi-AI review system is established

**Why this is a blocker:**
- Without standardized docs, AI collaboration is inconsistent
- Without clear hierarchy, work gets duplicated
- Without update procedures, docs become stale
- Without enforcement, standards drift
- Without review system, code quality degrades

**Estimated blocker duration:** 4-5 weeks (2026-01-01 to 2026-02-05)
**After this completes:** M1.6 Support Tab, M1.5 remaining items can resume

---

## 🎯 DOCUMENT PURPOSE

This is the **CANONICAL** plan for standardizing all SoNash documentation. This document serves as:

1. **Blueprint** for documentation structure across the project
2. **Template specification** for all document tiers
3. **Migration guide** for updating existing docs
4. **Enforcement strategy** for maintaining standards
5. **AI workflow integration** ensuring any AI can navigate docs perfectly
6. **Multi-AI review system** for ongoing code quality

**⚠️ CRITICAL**: All new documentation must follow this standard. All existing documentation will be migrated per the timeline below.

---

## 📋 EXECUTIVE SUMMARY

### Problem Statement
Current documentation lacks consistency:
- Mixed structures (some have status tracking, some don't)
- No clear hierarchy (which doc is source of truth?)
- Duplicate content (3 docs merged, 4 archived)
- No AI navigation guide (AIs must guess where to look)
- Update procedures unclear (when to update? what sections?)
- No systematic code review process (quality degrades over time)

### Solution
Implement comprehensive documentation and review system:
- **5-tier documentation system** inspired by EIGHT_PHASE_REFACTOR_PLAN.md
- **4 specialized review templates** + coordinator for ongoing quality
- **Progress-based review triggers** (not time-based)
- **Automated enforcement** (linting, validation, cross-reference checking)
- **AI workflow guide** for perfect navigation
- **Template library** for all document types

### Success Criteria
- ✅ All docs follow tier-appropriate template
- ✅ Clear hierarchy established (README → ROADMAP → specialized docs)
- ✅ Auto-update system functional (scripts + triggers)
- ✅ AI can pick up any doc and know exactly how to act
- ✅ Zero duplicate content across docs
- ✅ All outdated docs archived
- ✅ Multi-AI review system operational
- ✅ Progress-based review triggers active

### Timeline
- **Week 1** (Jan 1-7): Templates, AI_WORKFLOW.md, scripts
- **Week 1.5** (Jan 8-10): Multi-AI review templates + coordinator
- **Week 2** (Jan 11-17): Migrate Tier 1-2 docs
- **Week 3** (Jan 18-24): Migrate Tier 3-4 docs
- **Week 4** (Jan 25-31): Migrate Tier 5 docs
- **Week 5** (Feb 1-5): Archive, cleanup, verification

**Total Estimated Effort:** 25-35 hours across 5 weeks

---

## 🗺️ OVERALL STATUS DASHBOARD

| Phase | Title | Status | Completion | Dependencies |
|-------|-------|--------|------------|--------------|
| Phase 1 | Create Templates & Standards | **PENDING** | 0% | None |
| Phase 1.5 | Create Multi-AI Review System | **PENDING** | 0% | Phase 1 |
| Phase 2 | Build Automation Scripts | **PENDING** | 0% | Phase 1 |
| Phase 3 | Migrate Tier 1-2 Docs | **PENDING** | 0% | Phase 1, 2 |
| Phase 4 | Migrate Tier 3-4 Docs | **PENDING** | 0% | Phase 1, 2 |
| Phase 5 | Migrate Tier 5 Docs | **PENDING** | 0% | Phase 1, 2 |
| Phase 6 | Archive & Cleanup | **PENDING** | 0% | Phase 3, 4, 5 |

**Overall Progress:** 0/6 phases complete (0%)
**Estimated Total Effort:** 25-35 hours
**Target Completion:** 2026-02-05

---

## 🔀 PHASE DEPENDENCY MAP

```
Phase 1 (Templates) ──┬──> Phase 1.5 (Multi-AI Review System)
                      │
                      ├──> Phase 2 (Scripts) ───┬──> Phase 3 (Tier 1-2)
                      │                         │
                      │                         ├──> Phase 4 (Tier 3-4)
                      │                         │
                      │                         └──> Phase 5 (Tier 5)

Phase 3, 4, 5 ──────────────────────────────────> Phase 6 (Cleanup)
```

**Critical Path:** Phase 1 → Phase 1.5 → Phase 2 → Phase 3 → Phase 6

---

## 📚 DOCUMENT TIER SYSTEM

### Tier 1: Canonical Living Documents
**Full treatment required - these are the project's source of truth**

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| README.md | Entry point, project overview, status dashboard | After major milestones |
| ROADMAP.md | Product roadmap, feature planning | Weekly |
| ROADMAP_LOG.md | Completed work archive | After milestone completion |
| EIGHT_PHASE_REFACTOR_PLAN.md | Refactoring plan (model doc) | After each phase |

**Required Sections:**
- 📊 Status Dashboard
- 🎯 Intentions & Goals
- 🔀 Dependencies (with graph if applicable)
- 📋 What Was Accomplished / What Remains
- 🤔 Reasoning & Decisions
- 🚧 Current Blockers
- ✅ Acceptance Criteria
- 🤖 AI Instructions
- 📝 Update Triggers
- 🗓️ Version History

---

### Tier 2: Foundation Documents
**Full treatment required - technical and architectural foundations**

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| ARCHITECTURE.md | Technical decisions, patterns | After architectural changes |
| SECURITY.md | Security posture, decisions | After security changes |
| DEVELOPMENT.md | Setup, testing, deployment | After dev workflow changes |

**Required Sections:**
- 📊 Status Dashboard (component health)
- 🏗️ Overview & Principles
- 🔀 Dependencies (technical)
- 🔴 Known Gaps (architectural/security debt)
- 🤔 Reasoning & Decisions (ADRs)
- 🤖 AI Instructions
- 📝 Update Triggers
- 🗓️ Version History

---

### Tier 3: Planning Documents
**Full treatment when active - specific initiatives/plans**

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| M1.6_SUPPORT_TAB_PLAN.md | Support Tab implementation | During active work |
| LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md | Resources feature plan | During active work |
| ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md | Admin monitoring spec | During active work |
| MONETIZATION_RESEARCH.md | Monetization research | During research phase |
| POST_PHASE_8_BACKLOG.md | Post-refactor backlog | After each phase |
| Active review docs (docs/reviews/*.md) | Multi-AI review results | Per review cycle |

**Required Sections:**
- 📊 Status Dashboard
- 🎯 Objectives & Scope
- 🔀 Dependencies
- 📋 Tasks & Progress
- 🚧 Blockers
- ✅ Acceptance Criteria
- 🤖 AI Instructions
- 📝 Update Triggers

---

### Tier 4: Reference Documents
**Standardized flow, lighter structure - workflow and reference**

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| **AI_WORKFLOW.md** (NEW) | Master AI navigation guide | After major doc changes |
| **MULTI_AI_REVIEW_COORDINATOR.md** (NEW) | Review system coordinator | After each review |
| **SESSION_CONTEXT.md** (NEW) | Session-to-session handoff | After every session |
| claude.md | AI rules & stack versions | After stack changes |
| IMPLEMENTATION_PROMPTS.md | Refactor prompts | After prompt refinement |
| PR_WORKFLOW_CHECKLIST.md | PR checklist | After workflow changes |

**Required Sections:**
- 📋 Purpose & Scope
- 🗓️ Last Updated
- 📝 Content (specific to doc type)
- 🤖 AI Instructions (how to use this doc)

---

### Tier 5: Guides
**Standardized flow, minimal tracking - how-to guides**

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| SENTRY_INTEGRATION_GUIDE.md | Sentry setup | After Sentry changes |
| APPCHECK_SETUP.md | App Check setup | After App Check changes |
| INCIDENT_RESPONSE.md | Incident handling | After incidents/learnings |
| recaptcha_removal_guide.md | reCAPTCHA guide | After reCAPTCHA changes |
| ANTIGRAVITY_GUIDE.md | Antigravity feature | After feature changes |
| TESTING_PLAN.md | Testing strategy | After testing changes |

**Required Sections:**
- 📋 Purpose
- 🗓️ Last Updated
- 📝 Prerequisites
- 📝 Step-by-Step Instructions
- ✅ Verification Steps
- 🚨 Troubleshooting

---

## 🔄 DOCUMENT HIERARCHY (Flow Chart)

```
┌─────────────────────────────────────────────────────────────┐
│  README.md (Entry Point)                                    │
│  ├─ Project overview                                        │
│  ├─ 📊 Status Dashboard (auto-scripted)                     │
│  └─ Links to all major docs                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  AI_WORKFLOW.md (AI Navigation Guide) ← READ THIS FIRST     │
│  ├─ Document hierarchy explained                            │
│  ├─ Where to look for what                                  │
│  └─ Standard procedures for AI agents                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ┌──────┴──────┐
                    ↓             ↓
        ┌───────────────┐  ┌──────────────┐
        │  ROADMAP.md   │  │ SESSION_     │
        │  (What we're  │  │ CONTEXT.md   │
        │   building)   │  │ (Current     │
        │               │  │  focus)      │
        └───────┬───────┘  └──────────────┘
                ↓
        ┌──────────────────────────┐
        │   ARCHITECTURE.md        │
        │   SECURITY.md            │
        │   DEVELOPMENT.md         │
        │   (How it's built)       │
        └──────────┬───────────────┘
                   ↓
        ┌──────────────────────────┐
        │   Planning Docs          │
        │   (Specific initiatives) │
        │   + Review Results       │
        └──────────┬───────────────┘
                   ↓
        ┌──────────────────────────┐
        │   Guides                 │
        │   (How-to references)    │
        └──────────────────────────┘
```

**Rule:** Always start at README → AI_WORKFLOW → Specific doc needed

---

## 📝 UPDATE TRIGGER SYSTEM

### Document-Level "Last Updated"

**Update when:**
- ✅ Milestone status changes (pending → in_progress → complete)
- ✅ New major section added
- ✅ Dependency graph modified
- ✅ Decision documented in "Reasoning & Decisions"
- ✅ Version number increments

**Do NOT update for:**
- ❌ Typo fixes
- ❌ Formatting tweaks
- ❌ Minor wording changes
- ❌ Link updates

### Section-Level "Last Updated"

**Update when:**
- ✅ Content materially changes (new tasks, status updates)
- ✅ Completion percentage changes
- ✅ Blockers added/removed

**Do NOT update for:**
- ❌ Grammar fixes
- ❌ Formatting improvements

### Version Numbering

**Format:** `X.Y` (Major.Minor)

**Major version (X.0) increments when:**
- Document restructure
- Major milestone complete
- Significant scope change

**Minor version (X.Y) increments when:**
- New section added
- Significant content addition
- Decision documented

---

## 🔍 MULTI-AI CODE REVIEW SYSTEM

### Overview

Progress-based code quality reviews using multiple AI models to identify issues, with automated aggregation and phased remediation plans.

### Review Types (4 Specialized Templates)

**1. Code Quality Review** (`MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md`)
- Focus: Hygiene/Duplication, Types/Correctness, Maintainability, Testing
- Cadence: After 5,000+ lines changed OR milestone completion
- Output: CANON findings → PR plan

**2. Security Audit** (`MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md`)
- Focus: Firebase Auth/Rules, App Check, Rate Limiting, Trust Boundaries
- Cadence: Quarterly OR after major security changes
- Output: Security findings → remediation plan

**3. Performance Audit** (`MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md`)
- Focus: Bundle size, Render performance, Database queries, Memory
- Cadence: Bi-annually OR after major UX features
- Output: Performance findings → optimization plan

**4. Refactoring Plan** (`MULTI_AI_REFACTOR_PLAN_TEMPLATE.md`)
- Focus: God objects, Duplicate clusters, SOLID violations, Architecture
- Cadence: After Code Quality review finds >30 issues
- Output: Phased refactor plan (like EIGHT_PHASE_REFACTOR_PLAN.md)

### Progress-Based Review Triggers

```markdown
## 🔍 Code Review Checkpoints (Hybrid Approach)

**Automatic triggers - run review when ANY of:**
- ✅ 5,000+ lines changed (additions + deletions) since last review
- ✅ 50+ files modified since last review
- ✅ 20+ new files added since last review
- ✅ 10+ new components created since last review

**Milestone-based triggers:**
- ✅ Major milestone complete (M1, M2, M3, etc.)
- ✅ Before starting new major initiative
- ✅ After completing 3+ features in same area

**Risk-based triggers:**
- ✅ 5+ new Cloud Functions added
- ✅ 3+ new Firestore collections created
- ✅ Major security changes (auth, rules, App Check)
- ✅ Test coverage drops below 90%
- ✅ ESLint warnings increase by 20+
- ✅ Build time increases by >30%

**Track via:**
```bash
npm run review:check  # Automated checkpoint script
```

**Last Review:** 2025-12-30 (resulted in EIGHT_PHASE_REFACTOR_PLAN.md)
**Lines Since:** 0 / 5,000
**Files Since:** 0 / 50
**Next Review Due:** After M1.6 completion OR trigger threshold
```

### Review Workflow

```
1. Trigger Detected (progress checkpoint reached)
   ↓
2. Select Review Type (Code/Security/Performance/Refactor)
   ↓
3. Run Multi-AI Review (4-6 AI models, specialized prompts)
   ↓
4. Aggregate Findings (dedup, verify, rank by consensus)
   ↓
5. Create Review Document (docs/reviews/REVIEW_NAME_YYYY_QX.md)
   ↓
6. Generate PR Plan (phased remediation, small reviewable PRs)
   ↓
7. Link to ROADMAP (add phases as milestones if actionable)
   ↓
8. Execute Phases (following plan structure)
   ↓
9. Archive (move completed plan to docs/archive/reviews/)
```

---

## 🗓️ ROADMAP DOCUMENTATION REVIEW CHECKPOINTS

### After Every Milestone Completion:
```markdown
## 🔍 Documentation Review Checkpoint

- [ ] **ROADMAP.md**: Update status dashboard, mark milestone complete
- [ ] **ROADMAP_LOG.md**: Move completed items to archive with full metadata
- [ ] **README.md**: Update high-level progress (run `npm run docs:update-readme`)
- [ ] **ARCHITECTURE.md**: Document new patterns if added
- [ ] **SECURITY.md**: Document security changes if any
- [ ] **SESSION_CONTEXT.md**: Update "Next Session Goals"
- [ ] **Check for code review trigger**: Run `npm run review:check`
- [ ] **Check for refactoring opportunities**: Add to POST_PHASE_8_BACKLOG.md
```

### Before Starting New Milestone:
```markdown
## 🚀 Pre-Milestone Checklist

- [ ] Read milestone's "Intentions & Goals" (ROADMAP.md)
- [ ] Verify dependencies are COMPLETE (check status dashboard)
- [ ] Check "Current Blockers" section (do not proceed if blocked)
- [ ] Review "Acceptance Criteria" to understand done-ness
- [ ] Update SESSION_CONTEXT.md with new focus
- [ ] Run `npm run review:check` to see if review needed first
```

---

## 📋 PHASE 1: CREATE TEMPLATES & STANDARDS

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 6-8 hours
**Dependencies:** None
**Risk Level:** Low

### 🎯 Phase Objectives

Create comprehensive templates for all 5 document tiers plus AI_WORKFLOW.md to establish the foundation for consistent documentation across the project.

### 📝 Deliverables

**1. docs/templates/CANONICAL_DOC_TEMPLATE.md**
- Template for Tier 1 documents (README, ROADMAP, ROADMAP_LOG, major plans)
- Full treatment with all required sections
- Example content showing proper formatting

**2. docs/templates/FOUNDATION_DOC_TEMPLATE.md**
- Template for Tier 2 documents (ARCHITECTURE, SECURITY, DEVELOPMENT)
- Technical debt tracking sections
- ADR integration

**3. docs/templates/PLANNING_DOC_TEMPLATE.md**
- Template for Tier 3 documents (feature plans, initiatives, review results)
- Active work tracking structure
- Blocker management

**4. docs/templates/REFERENCE_DOC_TEMPLATE.md**
- Template for Tier 4 documents (workflow guides, reference docs)
- Lighter structure with essential sections

**5. docs/templates/GUIDE_TEMPLATE.md**
- Template for Tier 5 documents (how-to guides)
- Step-by-step format with verification

**6. docs/templates/DOCUMENTATION_STANDARDS.md**
- Master standards document
- All rules, conventions, and procedures
- Quick reference for AI agents

**7. AI_WORKFLOW.md** (root level)
- Master AI navigation guide
- Document hierarchy explanation
- Where to find what
- Standard procedures for AI agents
- Session handoff procedures

**8. SESSION_CONTEXT.md** (root level)
- Replaces AI_HANDOFF.md
- Current focus, recent completions
- Next session goals
- Collaboration notes

### 📋 Tasks

- [ ] **Task 1.1**: Create CANONICAL_DOC_TEMPLATE.md (2 hours)
  - Status dashboard structure
  - Dependencies with graph syntax
  - All required sections with examples
  - Update trigger definitions
  - AI instruction blocks

- [ ] **Task 1.2**: Create FOUNDATION_DOC_TEMPLATE.md (1.5 hours)
  - Component health dashboard
  - Known gaps section
  - ADR integration format
  - Technical dependency mapping

- [ ] **Task 1.3**: Create PLANNING_DOC_TEMPLATE.md (1.5 hours)
  - Task tracking structure
  - Blocker management
  - Acceptance criteria format
  - Progress tracking

- [ ] **Task 1.4**: Create REFERENCE_DOC_TEMPLATE.md (1 hour)
  - Simplified structure
  - Essential sections only
  - Usage instructions

- [ ] **Task 1.5**: Create GUIDE_TEMPLATE.md (1 hour)
  - Step-by-step format
  - Prerequisites section
  - Verification steps
  - Troubleshooting section

- [ ] **Task 1.6**: Create DOCUMENTATION_STANDARDS.md (2 hours)
  - Update trigger rules
  - Version numbering conventions
  - Markdown formatting standards
  - Cross-reference conventions
  - Archive procedures

- [ ] **Task 1.7**: Create AI_WORKFLOW.md (2 hours)
  - Document hierarchy flowchart
  - Navigation rules (always start README → AI_WORKFLOW → specific doc)
  - What information lives where
  - Standard operating procedures
  - Session context usage
  - When to update which docs

- [ ] **Task 1.8**: Create SESSION_CONTEXT.md (1 hour)
  - Current sprint focus
  - Recent completions (last 3 sessions)
  - Active blockers
  - Next session goals
  - Collaboration notes

### ✅ Acceptance Criteria

- [ ] All 8 documents created and committed
- [ ] Each template includes example content
- [ ] AI_WORKFLOW.md clearly explains where to find what
- [ ] SESSION_CONTEXT.md includes all unique content from AI_HANDOFF.md
- [ ] Templates tested by creating one sample doc from each
- [ ] All templates follow markdown best practices
- [ ] Cross-references between templates are correct

### 🤖 AI Instructions

When implementing this phase:
1. Read EIGHT_PHASE_REFACTOR_PLAN.md first to understand the model structure
2. Create templates in order (1.1 → 1.8) as dependencies exist
3. Use example content from existing docs where applicable
4. Test each template by creating a sample document
5. Commit templates individually for easier review
6. Update this phase's completion percentage after each task

---

## 📋 PHASE 1.5: CREATE MULTI-AI REVIEW SYSTEM

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 8-10 hours
**Dependencies:** Phase 1 (templates created)
**Risk Level:** Medium

### 🎯 Phase Objectives

Create comprehensive multi-AI code review system with 4 specialized templates and 1 coordinator document to enable ongoing code quality management through progress-based reviews.

### 📝 Deliverables

**1. docs/templates/MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md**
- General code quality review template
- Focus: Hygiene/Duplication, Types/Correctness, Maintainability, Testing
- Full 6-phase prompt embedded
- JSONL output schema
- Aggregation procedures

**2. docs/templates/MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md**
- Security-focused review template
- Focus: Firebase Auth/Rules, App Check, Rate Limiting, Trust Boundaries
- Security-specific categories
- Severity scale for security issues

**3. docs/templates/MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md**
- Performance optimization review template
- Focus: Bundle size, Render performance, Database queries, Memory
- Performance metrics integration
- Benchmark comparison format

**4. docs/templates/MULTI_AI_REFACTOR_PLAN_TEMPLATE.md**
- Large-scale refactoring plan template
- Focus: God objects, Duplicate clusters, SOLID violations, Architecture
- Phased approach like EIGHT_PHASE_REFACTOR_PLAN.md
- Dependency management between refactor phases

**5. docs/MULTI_AI_REVIEW_COORDINATOR.md**
- Master index of all reviews
- Progress tracking toward triggers
- Review history
- Next review scheduling

### 📋 Individual Review Prompts (Embedded in Templates)

Each template will include:

**Phase 1: Repository Access Validation**
```markdown
### CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"

If repo_checkout=no OR browse_files=no:
- Run in "NO-REPO MODE": Cannot complete this review without repo access
- Stop immediately and report limitation
```

**Phase 2: Repository Overview**
- Systematic file enumeration
- Tech stack validation
- Configuration review
- Phase completion marker

**Phase 3: Systematic Category Review**
- Category-specific focus (varies by template type)
- Running count of issues as discovered
- Code snippets with file paths
- Category completion markers

**Phase 4: Draft Findings**
- Numbered sequential findings
- File path + line numbers
- Code quotes
- Severity assessment with justification
- Preliminary recommendations
- Phase completion count

**Phase 5: Pattern Identification**
- Recurring issues across files
- Architectural concerns
- Systemic problems
- Pattern numbering and counting

**Phase 6: Summary Preparation**
- Statistics by severity
- Executive summary drafting
- Priority recommendations
- Readiness marker

### 📋 Output Format (All Templates)

**1. FINDINGS_JSONL**
```json
{
  "category": "Hygiene/Duplication|Types/Correctness|Next/React Boundaries|Security|Testing",
  "title": "short, specific",
  "fingerprint": "<category>::<primary_file>::<primary_symbol>::<problem_slug>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path1", "path2"],
  "symbols": ["SymbolA", "SymbolB"],
  "duplication_cluster": {
    "is_cluster": true/false,
    "cluster_summary": "if true, describe the repeated pattern",
    "instances": [{"file":"...","symbol":"..."}, ...]
  },
  "why_it_matters": "1-3 sentences",
  "suggested_fix": "concrete refactor direction (no rewrite)",
  "acceptance_tests": ["what to run/verify after change"],
  "pr_bucket_suggestion": "firebase-access|ui-primitives|hooks-standardization|types-domain|boundaries|security-hardening|tests-hardening|misc",
  "dependencies": ["fingerprint it depends on", "..."],
  "evidence": ["optional: short grep output or tool output summary"],
  "notes": "optional"
}
```

**2. SUSPECTED_FINDINGS_JSONL**
- Same schema, confidence <= 40
- Evidence missing file+symbol OR claim is broad

**3. HUMAN_SUMMARY**
- Top duplication clusters (5-10 bullets)
- Top 5 high-risk items (S0/S1)
- "Do next" shortlist (<= 10 items)

### 📋 Aggregation Process (Embedded in Coordinator)

**1. Normalization**
- Validate JSONL format
- Normalize categories to standard set
- Validate severity/effort scales

**2. Deduplication Rules**
```markdown
1) Primary merge key: fingerprint (exact match)
2) Secondary merge (if fingerprints differ): merge if ALL true:
   - same category
   - overlap: >=1 shared file OR >=1 shared symbol
   - titles + suggested_fix describe same refactor direction
3) Duplication clusters:
   - Merge by union of instances (unique by file+symbol)
   - May add more instances only if same pattern clearly present
4) Never merge purely "similar vibes" without evidence overlap
```

**3. Consensus Scoring**
```markdown
For each canonical finding, compute:
- sources: contributing model names
- confirmations: count of sources in FINDINGS_JSONL
- suspects: count of sources in SUSPECTED_FINDINGS_JSONL
- tool_confirmed_sources: sources with run_commands=yes AND evidence[]
- consensus_score (0-5):
  +2 if >=2 confirmed sources
  +1 if >=3 total sources mention
  +1 if any tool_confirmed_sources >=1
  +1 if shared evidence overlap across sources
- final_confidence:
  Start with max(confidence) among contributing lines, then adjust:
  - if only 1 source and no tool confirmation: cap at 60
  - if all mentions are suspected: cap at 40
  - if >=2 confirmed + evidence overlap: floor at 70
- cross_cutting_bonus: +1 if duplication_cluster.instances >= 3
```

**4. Ranking**
```markdown
Rank canonical findings by:
1) severity (S0 highest)
2) consensus_score (higher first)
3) final_confidence (higher first)
4) effort (lower first if ties)
5) cross_cutting_bonus (higher first if ties)
```

**5. PR Planning**
```json
{
  "prs": [
    {
      "pr_id": "PR1",
      "title": "...",
      "goal": "...",
      "bucket": "...",
      "included_canonical_ids": ["CANON-0007","CANON-0012"],
      "staging": ["PR1a","PR1b"],
      "risk_level": "low|medium|high",
      "estimated_effort": "E0|E1|E2|E3",
      "acceptance_tests": ["npm run lint", "npm run typecheck", "npm test"],
      "notes": "review guidance + pitfalls"
    }
  ]
}
```

### 📋 MULTI_AI_REVIEW_COORDINATOR.md Structure

```markdown
# 🔍 Multi-AI Review Coordinator

**Last Updated:** 2025-12-31
**Document Version:** 1.0

## 📊 Review Progress Dashboard

**Last Review:** 2025-12-30 (Code Quality → EIGHT_PHASE_REFACTOR_PLAN.md)
**Lines Since:** 0 / 5,000
**Files Since:** 0 / 50
**New Components Since:** 0 / 10
**ESLint Warnings:** baseline (track increases)
**Test Coverage:** 97.8% (watch for drops below 90%)

**Next Review Due:** After M1.6 completion OR trigger threshold

## 🗂️ Review History

| Date | Type | Trigger | AI Models Used | Canonical Findings | Plan Created |
|------|------|---------|----------------|-------------------|--------------|
| 2025-12-30 | Code Quality | Manual | ChatGPT-4o, Claude Opus 4, Gemini 2.0 Flash Thinking | 47 CANON items | EIGHT_PHASE_REFACTOR_PLAN.md |

## 📋 Review Templates

1. **Code Quality Review**: Use when general quality check needed
2. **Security Audit**: Use when security changes made or quarterly
3. **Performance Audit**: Use when performance issues suspected or bi-annually
4. **Refactoring Plan**: Use when Code Quality review finds >30 issues

## 🎯 Progress-Based Triggers

**Automatic triggers - run review when ANY of:**
- ✅ 5,000+ lines changed since last review
- ✅ 50+ files modified since last review
- ✅ 20+ new files added since last review
- ✅ 10+ new components created since last review

**Milestone-based triggers:**
- ✅ Major milestone complete (M1, M2, M3, etc.)
- ✅ Before starting new major initiative
- ✅ After completing 3+ features in same area

**Risk-based triggers:**
- ✅ 5+ new Cloud Functions added
- ✅ 3+ new Firestore collections created
- ✅ Major security changes (auth, rules, App Check)
- ✅ Test coverage drops below 90%
- ✅ ESLint warnings increase by 20+
- ✅ Build time increases by >30%

## 📝 How to Run a Review

1. **Detect Trigger**: Run `npm run review:check` or manual assessment
2. **Select Review Type**: Based on trigger and recent changes
3. **Prepare Context**: Update repo URL, branch, recent changes summary
4. **Run Multi-AI Review**: Use 4-6 AI models with selected template
5. **Collect Outputs**: Save each model's FINDINGS_JSONL + SUSPECTED_FINDINGS_JSONL
6. **Run Aggregation**: Use aggregator prompt to deduplicate and rank
7. **Create Review Doc**: docs/reviews/REVIEW_NAME_YYYY_QX.md
8. **Generate PR Plan**: Create phased implementation plan
9. **Link to ROADMAP**: Add as milestone if actionable
10. **Archive When Complete**: Move to docs/archive/reviews/

## 🤖 AI Instructions

When starting a review:
1. Check this coordinator for last review date and current progress
2. Determine if trigger threshold reached
3. Select appropriate review template
4. Follow template's 6-phase structure precisely
5. Output in exact JSONL format specified
6. Update this coordinator after review completes
```

### 📋 Tasks

- [ ] **Task 1.5.1**: Create MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md (2.5 hours)
  - Embed 6-phase prompt from "GitHub Code Analysis and Review Prompt.txt"
  - Adapt categories to: Hygiene/Duplication, Types/Correctness, Next/React Boundaries, Security, Testing
  - Include JSONL schema
  - Add tool evidence checklist

- [ ] **Task 1.5.2**: Create MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md (2 hours)
  - Adapt Phase 3 categories to security focus
  - Firebase-specific checks (Auth, Rules, App Check)
  - Trust boundary analysis
  - Rate limiting verification

- [ ] **Task 1.5.3**: Create MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md (2 hours)
  - Performance-specific categories
  - Bundle analysis integration
  - Render performance checks
  - Database query optimization
  - Memory leak detection

- [ ] **Task 1.5.4**: Create MULTI_AI_REFACTOR_PLAN_TEMPLATE.md (2 hours)
  - Large-scale refactoring focus
  - SOLID principles analysis
  - Architectural pattern detection
  - Phased plan generation format
  - Follow EIGHT_PHASE_REFACTOR_PLAN.md structure

- [ ] **Task 1.5.5**: Create MULTI_AI_REVIEW_COORDINATOR.md (1.5 hours)
  - Progress tracking dashboard
  - Review history table
  - Trigger threshold monitoring
  - Review workflow procedures
  - AI instructions for when/how to run reviews

- [ ] **Task 1.5.6**: Update MULTI_AI_REVIEW_COORDINATOR.md with baseline (0.5 hours)
  - Record 2025-12-30 Code Quality review
  - Set baseline metrics (lines, files, components)
  - Establish next review triggers

### ✅ Acceptance Criteria

- [ ] All 5 documents created and committed
- [ ] Each template includes complete 6-phase prompt
- [ ] JSONL schemas are valid and complete
- [ ] Aggregation procedures are detailed and actionable
- [ ] Coordinator includes all review history
- [ ] Progress tracking metrics are defined
- [ ] Templates tested with sample review (optional: run mini-review on docs/ folder)

### 🤖 AI Instructions

When implementing this phase:
1. Read all 5 source docs from docs/ folder first:
   - "GitHub Code Analysis and Review Prompt.txt"
   - "code refactor multi AI prompt.md"
   - "code refactor aggregator prompt.md"
   - "ChatGPT Multi_AI Refactoring Plan Chat.txt"
   - "Refactoring PR Plan.txt"
2. Extract and adapt prompts for each specialized template
3. Maintain strict JSONL output format across all templates
4. Test aggregation logic with sample data
5. Commit each template individually
6. Update Phase 1.5 completion after each task

---

## 📋 PHASE 2: BUILD AUTOMATION SCRIPTS

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 6-8 hours
**Dependencies:** Phase 1 (templates exist for validation)
**Risk Level:** Low

### 🎯 Phase Objectives

Create automation scripts for documentation maintenance, validation, and review trigger detection to reduce manual overhead and ensure consistency.

### 📝 Deliverables

**1. scripts/update-readme-status.js**
- Extracts status from ROADMAP.md
- Updates README.md status dashboard
- Calculates overall completion percentage
- Preserves manual README content

**2. scripts/check-docs-light.js**
- Light linting for documentation
- Checks for required sections by tier
- Validates "Last Updated" dates are recent
- Checks version numbers increment correctly
- Validates cross-references exist

**3. scripts/archive-doc.js**
- Moves doc to docs/archive/
- Adds frontmatter with archive metadata
- Preserves all content
- Updates cross-references

**4. scripts/check-review-needed.js**
- Tracks lines changed since last review
- Counts files modified, new files, new components
- Checks ESLint warning delta
- Checks test coverage
- Outputs trigger status
- Updates MULTI_AI_REVIEW_COORDINATOR.md

**5. .github/workflows/docs-lint.yml**
- Runs check-docs-light.js on every PR
- Fails if required sections missing
- Warns if "Last Updated" is stale
- Comments on PR with validation results

**6. package.json scripts**
- `npm run docs:update-readme` → runs update-readme-status.js
- `npm run docs:check` → runs check-docs-light.js
- `npm run docs:archive <file>` → runs archive-doc.js
- `npm run review:check` → runs check-review-needed.js

### 📋 Script Specifications

#### scripts/update-readme-status.js

```javascript
/**
 * Update README.md status dashboard from ROADMAP.md
 *
 * Reads:
 * - ROADMAP.md status dashboard
 * - Individual milestone completion percentages
 *
 * Writes:
 * - README.md "Project Status" section
 * - Overall completion percentage
 * - Current milestone
 * - Recent completions
 *
 * Preserves:
 * - All other README.md content
 */

// Implementation requirements:
// 1. Parse ROADMAP.md status table
// 2. Calculate weighted completion (by milestone size)
// 3. Find current active milestone
// 4. Find recently completed milestones (last 30 days)
// 5. Update README.md preserving structure
// 6. Exit 0 if success, 1 if error
```

#### scripts/check-docs-light.js

```javascript
/**
 * Light documentation linting
 *
 * Checks:
 * - Required sections present (by tier)
 * - "Last Updated" dates within reasonable range (< 90 days for active docs)
 * - Version numbers follow X.Y format
 * - Cross-references point to existing files
 *
 * Outputs:
 * - List of validation errors
 * - List of warnings
 * - Exit 0 if pass, 1 if errors (warnings don't fail)
 */

// Implementation requirements:
// 1. Determine doc tier from filename/path
// 2. Check for required sections per tier
// 3. Parse "Last Updated" dates, calculate age
// 4. Validate version number format
// 5. Extract markdown links, verify targets exist
// 6. Output formatted report
```

#### scripts/archive-doc.js

```javascript
/**
 * Archive a document with full metadata preservation
 *
 * Usage: npm run docs:archive -- FILENAME.md
 *
 * Process:
 * 1. Read source document
 * 2. Add YAML frontmatter:
 *    - archived_date
 *    - original_path
 *    - last_updated (from doc)
 *    - archive_reason
 * 3. Move to docs/archive/
 * 4. Update any cross-references in other docs
 * 5. Add note to ROADMAP_LOG.md if applicable
 */

// Implementation requirements:
// 1. CLI argument parsing
// 2. YAML frontmatter generation
// 3. File move operation
// 4. Cross-reference scanning and updating
// 5. Optional ROADMAP_LOG.md update
```

#### scripts/check-review-needed.js

```javascript
/**
 * Check if code review trigger thresholds reached
 *
 * Reads:
 * - MULTI_AI_REVIEW_COORDINATOR.md (last review date/baseline)
 * - git log since last review
 * - ESLint current warnings
 * - Test coverage report
 *
 * Checks:
 * - Lines changed (git diff --stat)
 * - Files modified count
 * - New files count (*.tsx, *.ts, *.jsx, *.js)
 * - New components (files in components/)
 * - ESLint warning delta
 * - Test coverage percentage
 *
 * Outputs:
 * - Trigger status (reached/not reached)
 * - Current metrics vs thresholds
 * - Recommendation (which review type to run)
 *
 * Updates:
 * - MULTI_AI_REVIEW_COORDINATOR.md progress dashboard
 */

// Implementation requirements:
// 1. Parse MULTI_AI_REVIEW_COORDINATOR.md for last review commit
// 2. Run git diff --stat since last review
// 3. Count new files by extension and path
// 4. Run npm run lint -- --format json to get current warnings
// 5. Read coverage report (coverage/coverage-summary.json)
// 6. Compare against thresholds
// 7. Update coordinator with current metrics
// 8. Output recommendation
```

### 📋 Tasks

- [ ] **Task 2.1**: Create update-readme-status.js (2 hours)
  - ROADMAP.md parsing
  - Completion calculation
  - README.md update (preserving content)
  - Test with current ROADMAP.md

- [ ] **Task 2.2**: Create check-docs-light.js (2 hours)
  - Tier detection logic
  - Required section validation
  - Date age checking
  - Cross-reference validation
  - Test against all existing docs

- [ ] **Task 2.3**: Create archive-doc.js (1.5 hours)
  - YAML frontmatter generation
  - File move logic
  - Cross-reference updating
  - Test with a sample doc

- [ ] **Task 2.4**: Create check-review-needed.js (2.5 hours)
  - Git stats parsing
  - ESLint JSON parsing
  - Coverage report reading
  - Threshold comparison
  - Coordinator update
  - Test with current repo state

- [ ] **Task 2.5**: Create docs-lint.yml workflow (1 hour)
  - Run check-docs-light.js on PR
  - Format output as PR comment
  - Configure failure conditions

- [ ] **Task 2.6**: Add npm scripts to package.json (0.5 hours)
  - All 4 script shortcuts
  - Test each script runs correctly

### ✅ Acceptance Criteria

- [ ] All 4 scripts created and executable
- [ ] All scripts have clear error messages
- [ ] Scripts exit with correct codes (0 success, 1 error)
- [ ] npm scripts added and tested
- [ ] docs-lint.yml workflow runs on PR
- [ ] Scripts tested with current repository state
- [ ] README.md status successfully updated from ROADMAP.md
- [ ] check-review-needed.js correctly identifies current baseline

### 🤖 AI Instructions

When implementing this phase:
1. Use Node.js for all scripts (consistency with package.json)
2. Add proper error handling and user-friendly messages
3. Include usage instructions in script headers
4. Test each script individually before moving to next
5. Verify GitHub Actions workflow syntax before committing
6. Run `npm run docs:update-readme` after completing scripts
7. Run `npm run review:check` to establish baseline
8. Update Phase 2 completion after each task

---

## 📋 PHASE 3: MIGRATE TIER 1-2 DOCS

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 5-7 hours
**Dependencies:** Phase 1 (templates), Phase 2 (scripts for validation)
**Risk Level:** Medium

### 🎯 Phase Objectives

Migrate all Tier 1 (Canonical Living) and Tier 2 (Foundation) documents to new standardized structure, ensuring highest-priority docs are consistent.

### 📝 Documents to Migrate

**Tier 1 (4 documents):**
1. README.md
2. ROADMAP.md
3. ROADMAP_LOG.md
4. EIGHT_PHASE_REFACTOR_PLAN.md (already compliant - verify only)

**Tier 2 (3 documents):**
5. ARCHITECTURE.md
6. SECURITY.md
7. DEVELOPMENT.md

### 📋 Migration Procedure (Per Document)

**Step 1: Read Current Document**
- Understand existing content and structure
- Identify what sections already exist
- Note what content is unique vs duplicate

**Step 2: Map to Template**
- Use CANONICAL_DOC_TEMPLATE.md (Tier 1) or FOUNDATION_DOC_TEMPLATE.md (Tier 2)
- Map existing sections to new structure
- Identify missing required sections
- Identify sections to remove/consolidate

**Step 3: Apply New Structure**
- Add missing required sections
- Reorganize existing content into new sections
- Add status dashboard (if missing)
- Add dependency graph (if applicable)
- Add AI instructions section
- Add update triggers section
- Add version history section

**Step 4: Retroactive Improvements**
- Add reasoning & decisions (from memory/context if available)
- Document known gaps (technical debt)
- Add blockers (current state)
- **Limitation Note**: For ROADMAP_LOG.md, add note about pre-standardization entries having limited metadata

**Step 5: Validate**
- Run `npm run docs:check` on updated doc
- Verify all required sections present
- Check cross-references are valid
- Verify formatting is correct

**Step 6: Update Metadata**
- Set "Last Updated" to current date
- Set version to 2.0 (major restructure)
- Add version history entry

### 📋 Tasks

- [ ] **Task 3.1**: Migrate README.md (1.5 hours)
  - Add status dashboard (auto-scripted from ROADMAP.md)
  - Add project overview refinement
  - Add links to all major docs
  - Add AI instructions section
  - Add version metadata
  - Run `npm run docs:update-readme` to test automation

- [ ] **Task 3.2**: Migrate ROADMAP.md (2 hours)
  - Ensure status dashboard matches template
  - Add dependency graphs for complex milestones
  - Add "What Was Accomplished" for completed items
  - Add "Reasoning & Decisions" for major decisions
  - Add AI instructions (when to update, how to use)
  - Add update triggers section
  - Add version history

- [ ] **Task 3.3**: Migrate ROADMAP_LOG.md (1.5 hours)
  - Standardize entry format for completed items
  - Add frontmatter with archive guidelines
  - Add note about pre-standardization limited metadata
  - Ensure each entry has: completion date, deliverables, team notes
  - Retroactively add reasoning/blockers where memory allows
  - Add AI instructions for archival procedure

- [ ] **Task 3.4**: Verify EIGHT_PHASE_REFACTOR_PLAN.md (0.5 hours)
  - Confirm it already matches CANONICAL_DOC_TEMPLATE.md
  - Add any missing minor sections if needed
  - Update version metadata if changes made
  - Use as reference for other migrations

- [ ] **Task 3.5**: Migrate ARCHITECTURE.md (1.5 hours)
  - Add component health dashboard
  - Add known gaps section (architectural debt)
  - Add reasoning & decisions (ADR format)
  - Add technical dependency map
  - Document Next.js 16, React 19, Firebase stack decisions
  - Add AI instructions
  - Add update triggers

- [ ] **Task 3.6**: Migrate SECURITY.md (1.5 hours)
  - Add security posture dashboard
  - Add known gaps section (security debt)
  - Document Firebase Auth, App Check, Rules decisions
  - Add trust boundary documentation
  - Add rate limiting strategy
  - Add AI instructions
  - Add update triggers

- [ ] **Task 3.7**: Migrate DEVELOPMENT.md (1.5 hours)
  - Add development workflow overview
  - Add setup instructions validation
  - Add testing strategy documentation
  - Add deployment procedures
  - Add known gaps (dev workflow improvements)
  - Add AI instructions
  - Add update triggers

### ✅ Acceptance Criteria

- [ ] All 7 documents migrated to new structure
- [ ] All required sections present per tier
- [ ] All documents pass `npm run docs:check`
- [ ] Status dashboards functional and accurate
- [ ] Dependency graphs included where applicable
- [ ] AI instructions clear and actionable
- [ ] Update triggers defined
- [ ] Version metadata added (all at 2.0 due to restructure)
- [ ] Cross-references between docs verified
- [ ] README.md auto-update from ROADMAP.md tested and working

### 🤖 AI Instructions

When implementing this phase:
1. Work in order (Task 3.1 → 3.7) as some docs reference others
2. Read the template BEFORE editing each doc
3. Preserve ALL existing content (add, don't delete)
4. Use EIGHT_PHASE_REFACTOR_PLAN.md as quality reference
5. Run `npm run docs:check` after each migration
6. Commit each doc individually with descriptive message
7. Update Phase 3 completion after each task
8. If retroactive info unavailable, note it in doc (don't fabricate)

---

## 📋 PHASE 4: MIGRATE TIER 3-4 DOCS

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 6-8 hours
**Dependencies:** Phase 1 (templates), Phase 2 (scripts for validation)
**Risk Level:** Low

### 🎯 Phase Objectives

Migrate all Tier 3 (Planning) and Tier 4 (Reference) documents to standardized structure, ensuring planning docs support active work and reference docs provide clear guidance.

### 📝 Documents to Migrate

**Tier 3 (6 documents):**
1. M1.6_SUPPORT_TAB_PLAN.md (NEW - will be created)
2. LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md
3. ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md
4. MONETIZATION_RESEARCH.md
5. POST_PHASE_8_BACKLOG.md
6. docs/reviews/* (future review results - template only)

**Tier 4 (3 documents - already created or migrated in Phase 1):**
7. AI_WORKFLOW.md (created in Phase 1)
8. SESSION_CONTEXT.md (created in Phase 1)
9. claude.md
10. IMPLEMENTATION_PROMPTS.md
11. PR_WORKFLOW_CHECKLIST.md

### 📋 Migration Procedure (Per Document)

Same as Phase 3, but using PLANNING_DOC_TEMPLATE.md (Tier 3) or REFERENCE_DOC_TEMPLATE.md (Tier 4).

### 📋 Tasks

**Tier 3 Planning Documents:**

- [ ] **Task 4.1**: Create M1.6_SUPPORT_TAB_PLAN.md (2 hours)
  - NEW document for Support Tab Foundation
  - Use PLANNING_DOC_TEMPLATE.md
  - Status dashboard for phases
  - Objectives: Base support tab UI, contact storage, Firebase backend
  - Dependencies on Phase 1 refactoring completion
  - Task breakdown for all sub-features
  - Acceptance criteria
  - Include dependency graph showing: Phase 0 → Onboarding → Sponsor → Quick Actions

- [ ] **Task 4.2**: Migrate LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md (1 hour)
  - Add status dashboard
  - Add dependencies section
  - Add tasks & progress tracking
  - Add blockers section (if any)
  - Add AI instructions

- [ ] **Task 4.3**: Migrate ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md (1 hour)
  - Add status dashboard
  - Add objectives & scope
  - Add dependencies
  - Add acceptance criteria
  - Add AI instructions

- [ ] **Task 4.4**: Migrate MONETIZATION_RESEARCH.md (1 hour)
  - Add status dashboard (research progress)
  - Add objectives & scope
  - Add findings summary
  - Add next steps
  - Add AI instructions

- [ ] **Task 4.5**: Migrate POST_PHASE_8_BACKLOG.md (0.5 hours)
  - Add status dashboard
  - Add prioritization criteria
  - Add AI instructions (how to add items)

**Tier 4 Reference Documents:**

- [ ] **Task 4.6**: Migrate claude.md (0.5 hours)
  - Add "Last Updated" date
  - Add purpose & scope section
  - Verify stack versions current
  - Add AI instructions (when to update)

- [ ] **Task 4.7**: Migrate IMPLEMENTATION_PROMPTS.md (0.5 hours)
  - Add "Last Updated" date
  - Add purpose & scope
  - Add AI instructions (when to use each prompt)

- [ ] **Task 4.8**: Migrate PR_WORKFLOW_CHECKLIST.md (0.5 hours)
  - Add "Last Updated" date
  - Add purpose & scope
  - Ensure checklist complete
  - Add AI instructions (mandatory pre-PR checks)

### ✅ Acceptance Criteria

- [ ] All Tier 3 planning docs have status dashboards
- [ ] All Tier 3 docs have clear acceptance criteria
- [ ] M1.6_SUPPORT_TAB_PLAN.md created with full specification
- [ ] All Tier 4 docs have "Last Updated" dates
- [ ] All docs pass `npm run docs:check`
- [ ] AI instructions clear in all docs
- [ ] Cross-references validated
- [ ] Version metadata added

### 🤖 AI Instructions

When implementing this phase:
1. Start with Tier 3 docs (more complex)
2. Use PLANNING_DOC_TEMPLATE.md and REFERENCE_DOC_TEMPLATE.md as guides
3. For M1.6_SUPPORT_TAB_PLAN.md, reference ROADMAP.md for context
4. Preserve all existing content
5. Run `npm run docs:check` after each migration
6. Commit each doc individually
7. Update Phase 4 completion after each task

---

## 📋 PHASE 5: MIGRATE TIER 5 DOCS

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 4-5 hours
**Dependencies:** Phase 1 (templates), Phase 2 (scripts for validation)
**Risk Level:** Low

### 🎯 Phase Objectives

Migrate all Tier 5 (Guide) documents to standardized how-to format with clear steps, prerequisites, and troubleshooting.

### 📝 Documents to Migrate

**Tier 5 (6 documents):**
1. SENTRY_INTEGRATION_GUIDE.md
2. APPCHECK_SETUP.md (merge APPCHECK_FRESH_SETUP.md into this)
3. INCIDENT_RESPONSE.md
4. recaptcha_removal_guide.md
5. ANTIGRAVITY_GUIDE.md
6. TESTING_PLAN.md (merge TESTING_CHECKLIST.md into this)

### 📋 Migration Procedure (Per Document)

Use GUIDE_TEMPLATE.md for all migrations.

**Required Sections:**
- 📋 Purpose
- 🗓️ Last Updated
- 📝 Prerequisites
- 📝 Step-by-Step Instructions
- ✅ Verification Steps
- 🚨 Troubleshooting

### 📋 Tasks

- [ ] **Task 5.1**: Migrate SENTRY_INTEGRATION_GUIDE.md (1 hour)
  - Add purpose section
  - Verify prerequisites are clear
  - Ensure step-by-step instructions are numbered
  - Add verification steps (how to confirm working)
  - Add troubleshooting section
  - Add "Last Updated" date

- [ ] **Task 5.2**: Merge and migrate App Check guides (1.5 hours)
  - Merge APPCHECK_FRESH_SETUP.md into APPCHECK_SETUP.md
  - Reconcile any differences
  - Add purpose section
  - Add prerequisites
  - Add step-by-step instructions
  - Add verification steps
  - Add troubleshooting
  - Archive APPCHECK_FRESH_SETUP.md (mark for Phase 6)

- [ ] **Task 5.3**: Migrate INCIDENT_RESPONSE.md (1 hour)
  - Add purpose section
  - Ensure incident types are clear
  - Add step-by-step response procedures
  - Add escalation paths
  - Add post-incident checklist
  - Add "Last Updated" date

- [ ] **Task 5.4**: Migrate recaptcha_removal_guide.md (0.5 hours)
  - Add purpose section
  - Verify prerequisites
  - Ensure removal steps are clear
  - Add verification steps
  - Add troubleshooting

- [ ] **Task 5.5**: Migrate ANTIGRAVITY_GUIDE.md (0.5 hours)
  - Add purpose section
  - Add prerequisites
  - Ensure feature explanation clear
  - Add usage instructions
  - Add verification steps

- [ ] **Task 5.6**: Merge and migrate testing guides (1.5 hours)
  - Merge TESTING_CHECKLIST.md into TESTING_PLAN.md
  - Reconcile checklist items with strategy
  - Add purpose section
  - Add prerequisites (dev environment setup)
  - Add step-by-step testing procedures
  - Add verification steps (coverage thresholds)
  - Add troubleshooting (common test failures)
  - Archive TESTING_CHECKLIST.md (mark for Phase 6)

### ✅ Acceptance Criteria

- [ ] All 6 Tier 5 docs migrated to GUIDE_TEMPLATE.md format
- [ ] All guides have clear step-by-step instructions
- [ ] All guides have verification steps
- [ ] All guides have troubleshooting sections
- [ ] APPCHECK_FRESH_SETUP.md content merged into APPCHECK_SETUP.md
- [ ] TESTING_CHECKLIST.md content merged into TESTING_PLAN.md
- [ ] All docs pass `npm run docs:check`
- [ ] "Last Updated" dates added
- [ ] Version metadata added

### 🤖 AI Instructions

When implementing this phase:
1. Use GUIDE_TEMPLATE.md for all migrations
2. When merging docs, preserve ALL unique content
3. Number all steps clearly (1, 2, 3...)
4. Make verification steps testable (specific commands or checks)
5. Include common errors in troubleshooting
6. Run `npm run docs:check` after each migration
7. Commit each doc individually
8. Mark merged source docs for archival (handle in Phase 6)
9. Update Phase 5 completion after each task

---

## 📋 PHASE 6: ARCHIVE & CLEANUP

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 3-4 hours
**Dependencies:** Phase 3, 4, 5 (all migrations complete)
**Risk Level:** Low

### 🎯 Phase Objectives

Archive outdated and duplicate documents, clean up repository structure, and verify all documentation is standardized and validated.

### 📝 Documents to Archive

**Duplicate Documents (merged in Phase 5):**
1. APPCHECK_FRESH_SETUP.md (merged into APPCHECK_SETUP.md)
2. TESTING_CHECKLIST.md (merged into TESTING_PLAN.md)

**Outdated Documents (no longer relevant):**
3. RECAPTCHA_PROBLEM_SUMMARY.md (historical, reCAPTCHA removed)
4. SUPABASE_MIGRATION_ANALYSIS.md (decided against Supabase)
5. docs/local-resources-review.md (incorporated into LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md)
6. docs/firestore-rules.md (incorporated into SECURITY.md)

**Historical Documents (for reference only):**
7. AI_HANDOFF.md (replaced by SESSION_CONTEXT.md - archive unique content)

### 📋 Archive Procedure (Per Document)

Use `npm run docs:archive -- <filename>` which:
1. Adds YAML frontmatter with metadata:
   ```yaml
   ---
   archived_date: 2025-01-XX
   original_path: <path>
   last_updated: <date from doc>
   archive_reason: <duplicate|outdated|superseded>
   superseded_by: <new doc if applicable>
   ---
   ```
2. Moves to docs/archive/
3. Updates cross-references in other docs
4. Preserves ALL content

### 📋 Tasks

- [ ] **Task 6.1**: Archive duplicate documents (1 hour)
  - Run `npm run docs:archive -- APPCHECK_FRESH_SETUP.md`
    - Reason: "duplicate - merged into APPCHECK_SETUP.md"
    - Superseded by: APPCHECK_SETUP.md
  - Run `npm run docs:archive -- TESTING_CHECKLIST.md`
    - Reason: "duplicate - merged into TESTING_PLAN.md"
    - Superseded by: TESTING_PLAN.md
  - Verify content was merged completely before archiving

- [ ] **Task 6.2**: Archive outdated documents (1 hour)
  - Run `npm run docs:archive -- RECAPTCHA_PROBLEM_SUMMARY.md`
    - Reason: "outdated - reCAPTCHA replaced with App Check"
  - Run `npm run docs:archive -- SUPABASE_MIGRATION_ANALYSIS.md`
    - Reason: "outdated - decided to stay with Firebase"
  - Run `npm run docs:archive -- docs/local-resources-review.md`
    - Reason: "superseded by LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md"
  - Run `npm run docs:archive -- docs/firestore-rules.md`
    - Reason: "superseded by SECURITY.md"

- [ ] **Task 6.3**: Archive AI_HANDOFF.md (0.5 hours)
  - Verify unique content migrated to SESSION_CONTEXT.md
  - Run `npm run docs:archive -- AI_HANDOFF.md`
    - Reason: "superseded by SESSION_CONTEXT.md + standardized docs"
    - Superseded by: SESSION_CONTEXT.md

- [ ] **Task 6.4**: Verify no broken cross-references (0.5 hours)
  - Run `npm run docs:check` on entire repo
  - Fix any broken links found
  - Ensure archived docs referenced correctly (if at all)

- [ ] **Task 6.5**: Update README.md with doc inventory (0.5 hours)
  - Add "Documentation" section listing all major docs
  - Organize by tier
  - Link to AI_WORKFLOW.md as navigation guide

- [ ] **Task 6.6**: Final validation (1 hour)
  - Run `npm run docs:check` on all docs
  - Verify all templates are in place
  - Verify all scripts functional
  - Run `npm run docs:update-readme`
  - Run `npm run review:check` (should show baseline)
  - Verify GitHub Actions workflow works
  - Update DOCUMENTATION_STANDARDIZATION_PLAN.md to 100% complete

### ✅ Acceptance Criteria

- [ ] All 7 documents archived with complete metadata
- [ ] docs/archive/ folder properly organized
- [ ] No broken cross-references in active docs
- [ ] README.md includes documentation inventory
- [ ] All docs pass `npm run docs:check` with zero errors
- [ ] All npm scripts working correctly
- [ ] GitHub Actions docs-lint.yml workflow passing
- [ ] MULTI_AI_REVIEW_COORDINATOR.md has baseline metrics
- [ ] DOCUMENTATION_STANDARDIZATION_PLAN.md marked 100% complete

### 🤖 AI Instructions

When implementing this phase:
1. Use `npm run docs:archive` script for all archival
2. Verify content merged BEFORE archiving source docs
3. Update cross-references carefully (use find/replace)
4. Run full validation before marking phase complete
5. Test all npm scripts one final time
6. Update this plan's status to COMPLETE when done
7. Commit all changes with message: "docs: Complete documentation standardization (Phase 6)"

---

## 🎯 OVERALL ACCEPTANCE CRITERIA

**Documentation Structure:**
- [ ] All 22 active docs follow tier-appropriate templates
- [ ] 5 templates created and tested
- [ ] 4 multi-AI review templates created
- [ ] 1 review coordinator established
- [ ] Clear hierarchy: README → AI_WORKFLOW → specific docs

**Automation & Enforcement:**
- [ ] All 4 automation scripts functional
- [ ] npm scripts added and tested
- [ ] GitHub Actions workflow passing
- [ ] Review trigger detection working

**Content Quality:**
- [ ] All Tier 1-2 docs have status dashboards
- [ ] All Tier 1-3 docs have AI instructions
- [ ] All docs have "Last Updated" dates
- [ ] All docs have version metadata
- [ ] Dependency graphs where applicable

**AI Navigation:**
- [ ] AI_WORKFLOW.md provides clear navigation
- [ ] SESSION_CONTEXT.md enables session handoff
- [ ] Every doc answers "when to update me" and "how to use me"
- [ ] Any AI can pick up any doc and know exactly how to act

**Archive & Cleanup:**
- [ ] 7 docs archived with full metadata
- [ ] Zero broken cross-references
- [ ] No duplicate content across active docs

**Multi-AI Review System:**
- [ ] 4 specialized review templates operational
- [ ] Progress-based triggers defined and tracked
- [ ] Baseline metrics established
- [ ] Review workflow documented

---

## 🔗 DEPENDENCIES TO OTHER WORK

**This Plan Blocks:**
- M1.6 Support Tab Foundation
- M1.5 Quick Wins (remaining items)
- M1.7 Admin Panel (renumbered from M1.6)
- Any new feature development
- Any major refactoring initiatives

**This Plan Requires:**
- Current ROADMAP.md structure (complete)
- EIGHT_PHASE_REFACTOR_PLAN.md as model (complete)
- Multi-AI review source documents (complete - in docs/)
- Phase 1 refactoring NOT required (can proceed independently)

**Integration Points:**
- README.md status auto-updates from ROADMAP.md
- ROADMAP.md triggers code reviews at milestones
- MULTI_AI_REVIEW_COORDINATOR.md tracks progress toward review triggers
- SESSION_CONTEXT.md updated after every session
- AI_WORKFLOW.md guides all AI agent navigation

---

## 📝 UPDATE TRIGGERS

**Update this plan when:**
- ✅ Phase status changes (pending → in_progress → complete)
- ✅ Task completion percentage changes
- ✅ New blocker discovered
- ✅ Timeline adjusted
- ✅ Template specifications refined
- ✅ Script specifications updated

**Do NOT update for:**
- ❌ Minor wording clarifications
- ❌ Typo fixes
- ❌ Formatting improvements

**Major version (2.0) when:**
- Plan structure changes
- New phases added
- Major scope change

**Minor version (1.X) when:**
- Task added/removed
- Script specification refined
- Template specification updated

---

## 🗓️ VERSION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-31 | Initial plan created with all 6 phases + Phase 1.5 | Claude Code |

---

## 🤖 AI INSTRUCTIONS

**When picking up this plan:**

1. **Check Phase Status**: Read the status dashboard to see current phase
2. **Read Current Phase**: Review objectives, deliverables, tasks for active phase
3. **Check Dependencies**: Verify all dependencies are COMPLETE before starting phase
4. **Follow Task Order**: Execute tasks in sequence (dependencies within phases)
5. **Validate as You Go**: Run `npm run docs:check` after each doc migration
6. **Update Progress**: Mark tasks complete, update percentages
7. **Update Status**: Change phase status when starting/completing
8. **Commit Frequently**: Individual commits per doc/script for easier review

**When this plan is complete:**
1. Verify all acceptance criteria met
2. Run full validation suite
3. Update overall completion to 100%
4. Update document version to 2.0 (major milestone)
5. Move to docs/archive/ (use `npm run docs:archive`)
6. Create DOCUMENTATION_STANDARDS_MAINTENANCE_PLAN.md for ongoing governance

**Emergency Stop:**
- If any phase completely blocked, document in "Current Blockers" section
- Do NOT proceed to next phase if dependencies incomplete
- If scripts fail, fix before continuing (automation is critical)

---

## 🚀 NEXT STEPS

**Immediate (Phase 1):**
1. Create all 8 templates (estimated 8 hours)
2. Test templates by creating sample docs
3. Commit templates individually

**Week 1.5 (Phase 1.5):**
1. Create 4 specialized review templates (estimated 8 hours)
2. Create review coordinator
3. Establish baseline metrics

**Week 2 (Phase 2-3):**
1. Build automation scripts (estimated 8 hours)
2. Migrate Tier 1-2 docs (estimated 7 hours)
3. Verify automation working

**Week 3-4 (Phase 4-5):**
1. Migrate Tier 3-4 docs (estimated 8 hours)
2. Migrate Tier 5 docs (estimated 5 hours)
3. Continuous validation

**Week 5 (Phase 6):**
1. Archive outdated docs (estimated 4 hours)
2. Final validation
3. Mark complete
4. Resume M1.6 work

---

**END OF DOCUMENTATION_STANDARDIZATION_PLAN.md**

This plan is now **READY FOR IMPLEMENTATION**. No further project work should begin until this plan reaches 100% completion.