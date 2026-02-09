<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Stage 1C: Claude Skills and Commands Inventory

**Audit Date:** 2026-02-09 **Target:** `/home/user/sonash-v0/.claude/skills/`
and `/home/user/sonash-v0/.claude/commands/` **Total Skills Found:** 36 **Total
Commands Found:** 0 (deprecated)

---

## Executive Summary

This inventory documents all Claude Code skills in the SoNash-v0 codebase. The
`.claude/commands/` directory has been deprecated (Session #120, 2026-01-31) and
all functionality migrated to the skills system.

Skills follow a progressive disclosure pattern:

- YAML frontmatter metadata (name, description)
- SKILL.md body with usage instructions
- Bundled resources (scripts/, references/, assets/)

---

## Skills Inventory

### 1. code-reviewer

**Description:** Agent-based code review system with standardized scoring rubric
and detailed technical feedback.

**Scripts:**

- `scripts/agents/code-reviewer/run.sh`

**Dependencies:**

- Agent framework
- Review rubric in references/
- Technical Debt Management System (TDMS)

**Key Features:**

- 11-category scoring rubric (security, testing, error handling, documentation,
  etc.)
- JSON output with line-specific findings
- Severity-based aggregation
- Integration with code-review-dispatcher

---

### 2. consolidate-learning

**Description:** Consolidate learning entries from daily learning logs into
permanent knowledge base.

**Scripts:**

- `npm run lessons:consolidate`

**Dependencies:**

- `docs/learning/YYYY-MM-DD.md` daily logs
- `docs/learning/CONSOLIDATED_LEARNINGS.md` permanent storage

**Key Features:**

- Extracts distinct insights from daily logs
- Prevents duplication
- Maintains chronological order
- Automatic git commit

---

### 3. daily-standup

**Description:** Daily standup meeting preparation and note-taking tool.

**Scripts:**

- None (interactive skill)

**Dependencies:**

- Session context
- ROADMAP.md
- Technical debt tracker

**Key Features:**

- Yesterday/Today/Blockers format
- Auto-generates from recent commits
- Links to roadmap milestones

---

### 4. decision-log

**Description:** Log architectural and technical decisions with context and
rationale.

**Scripts:**

- None (documentation skill)

**Dependencies:**

- `docs/decisions/` directory
- ADR (Architecture Decision Record) template

**Key Features:**

- Timestamped entries
- Context, decision, consequences structure
- Cross-references to affected code
- Status tracking (proposed, accepted, superseded)

---

### 5. deep-code-search

**Description:** Advanced code search using structured patterns and multiple
search strategies.

**Scripts:**

- Leverages Grep and Glob tools

**Dependencies:**

- ripgrep backend
- File system access

**Key Features:**

- Regex pattern matching
- Multi-file search with context
- File type filtering
- Case-insensitive mode

---

### 6. docs-sync

**Description:** Document template-instance synchronization validator.

**Scripts:**

- `npm run docs:sync-check`
- `scripts/docs/sync-check.js`

**Dependencies:**

- `docs/DOCUMENT_DEPENDENCIES.md`
- Template-instance pairs

**Key Features:**

- Detects 7 placeholder patterns ([e.g., ...], [X], [Project Name], etc.)
- Validates relative links
- Checks sync dates (<90 days)
- Exit codes: 0=synced, 1=issues, 2=error
- Flags: --verbose, --json

---

### 7. docs-update

**Description:** Automatically update documentation artifacts when markdown
files change.

**Scripts:**

- `npm run docs:index`

**Dependencies:**

- `DOCUMENTATION_INDEX.md`
- `docs/DOCUMENT_DEPENDENCIES.md`

**Key Features:**

- Regenerates documentation index
- Checks cross-document dependencies
- Verifies archive requirements
- Pre-commit hook integration (step 8)

---

### 8. excel-analysis

**Description:** Analyze Excel spreadsheets, create pivot tables, generate
charts, and perform data analysis.

**Scripts:**

- Python pandas scripts (inline examples)

**Dependencies:**

- pandas
- openpyxl
- xlrd
- xlsxwriter
- matplotlib

**Key Features:**

- Read/write .xlsx files
- Pivot table creation
- Chart generation
- Data cleaning and merging
- Conditional formatting

---

### 9. expansion-evaluation

**Description:** Manage the SoNash expansion evaluation process for ~280 feature
and technical ideas across 21 modules (12 feature + 9 technical).

**Scripts:**

- None (process skill)

**Dependencies:**

- `docs/EXPANSION_EVALUATION_TRACKER.md`
- `docs/archive/expansion-ideation/` (F1-F12, T1-T9 modules)
- `ROADMAP.md`

**Key Features:**

- Commands: begin, evaluate, status, decide, questions, push-to-roadmap, end
- Decision actions: accept, defer, reject, merge, discuss
- Staged ROADMAP integration (prevents churn)
- 7-phase dependency-grouped flow
- Placement metadata (milestone, feature group, insert after, relationship)
- Foundational decisions resolved 2026-01-21

**Evaluation Criteria:**

- ROADMAP overlap check
- Offline need assessment
- Encryption requirements
- Feasibility with current stack
- Dependencies
- User benefit
- Effort estimate (S/M/L/XL)
- Placement recommendation

---

### 10. find-skills

**Description:** Discover and install agent skills from skills.sh ecosystem and
Claude Code plugin marketplaces.

**Scripts:**

- `node scripts/search-capabilities.js [query]`
- `npx skills find [query]`
- `npx skills add <owner/repo@skill> -g -y`
- `claude plugin install <name>@<marketplace>`

**Dependencies:**

- skills.sh ecosystem
- 6 marketplace registries

**Key Features:**

- Unified search across marketplaces and skills.sh
- Results grouped: INSTALLED, AVAILABLE IN MARKETPLACES, AVAILABLE ON SKILLS.SH
- Category-based search (Web Dev, Testing, DevOps, Documentation, etc.)
- Global installation flag (-g)
- Auto-confirm flag (-y)

---

### 11. frontend-design

**Description:** Frontend design and development skill with React, Next.js,
TailwindCSS expertise.

**Scripts:**

- `scripts/frontend_analyzer.py`
- `scripts/component_scaffolder.py`
- `scripts/accessibility_checker.py`

**Dependencies:**

- Reference docs: `design_system.md`, `component_patterns.md`,
  `accessibility_guidelines.md`, `responsive_design.md`

**Key Features:**

- Component scaffolding
- Design system integration
- Accessibility validation
- Responsive design patterns

---

### 12. git-ops

**Description:** Git workflow automation and repository management.

**Scripts:**

- Various git commands wrapped in skill

**Dependencies:**

- Git
- GitHub CLI (gh)

**Key Features:**

- Branch management
- Commit message templates
- PR creation and management
- Merge conflict resolution
- Git history analysis

---

### 13. mcp-diagnostic

**Description:** MCP (Model Context Protocol) server diagnostics and
troubleshooting.

**Scripts:**

- `node scripts/mcp/test-connection.js`
- `node scripts/mcp/list-tools.js`

**Dependencies:**

- MCP server configuration
- `.claude/mcp-config.json`

**Key Features:**

- Server connectivity testing
- Tool enumeration
- Configuration validation
- Error diagnostics
- Performance monitoring

---

### 14. meeting-protocols

**Description:** Structured protocols for different types of meetings (standup,
planning, retrospective).

**Scripts:**

- None (documentation skill)

**Dependencies:**

- Meeting templates in references/

**Key Features:**

- Standup protocol (3-minute updates)
- Planning protocol (story estimation)
- Retrospective protocol (what went well/improve/action items)
- Meeting notes templates

---

### 15. multi-ai-audit

**Description:** Orchestrate multiple AI agents for comprehensive code audits
with consensus-based findings.

**Scripts:**

- `scripts/multi-ai-audit.js`
- `scripts/auditors/*.js` (individual auditor implementations)

**Dependencies:**

- Multiple LLM APIs (Claude, GPT-4, etc.)
- Audit templates
- Consensus algorithm

**Key Features:**

- Parallel auditor execution
- Finding aggregation
- Consensus scoring (3+ auditors agree)
- JSONL output format
- Severity classification
- False positive reduction

---

### 16. performance-optimization

**Description:** Web performance analysis and optimization recommendations.

**Scripts:**

- `scripts/performance_analyzer.py`

**Dependencies:**

- Lighthouse
- WebPageTest API
- Chrome DevTools Protocol

**Key Features:**

- Bundle size analysis
- Render performance metrics
- Network waterfall analysis
- Core Web Vitals tracking
- Optimization recommendations

---

### 17. pr-review

**Description:** GitHub Pull Request review automation with checklist
validation.

**Scripts:**

- `gh pr view`
- `gh pr review`
- `gh pr checks`

**Dependencies:**

- GitHub CLI (gh)
- Code review rubric

**Key Features:**

- Automated checklist verification
- Code quality scoring
- Test coverage analysis
- Security scanning
- Breaking change detection
- Review comment templates

---

### 18. productivity-log

**Description:** Track development productivity metrics and generate insights.

**Scripts:**

- `scripts/productivity/log-entry.js`
- `scripts/productivity/generate-report.js`

**Dependencies:**

- `docs/productivity/YYYY-MM-DD.json` daily logs
- Git commit history

**Key Features:**

- Time tracking
- Task completion metrics
- Focus session logging
- Distraction tracking
- Weekly/monthly reports

---

### 19. review-dispatcher

**Description:** Intelligent dispatch system for code review requests based on
file type and complexity.

**Scripts:**

- `scripts/review-dispatcher.js`

**Dependencies:**

- code-reviewer agent
- security-auditor agent
- frontend-design skill

**Key Features:**

- File type detection
- Complexity analysis
- Reviewer assignment
- Parallel review orchestration
- Result aggregation

---

### 20. security-auditor

**Description:** Agent-based security audit system for code and configuration
files.

**Scripts:**

- `scripts/agents/security-auditor/run.sh`

**Dependencies:**

- Security audit rubric
- Known vulnerability database
- OWASP guidelines

**Key Features:**

- Authentication/authorization checks
- Input validation review
- Secrets detection
- Dependency vulnerability scanning
- Security header validation
- OWASP Top 10 coverage
- Severity-based scoring

---

### 21. senior-backend

**Description:** Backend development skill with Node.js, Express, databases, and
API design.

**Scripts:**

- `scripts/backend_scaffolder.py`
- `scripts/api_validator.py`
- `scripts/db_migration_helper.py`

**Dependencies:**

- Reference docs: `api_design_patterns.md`, `database_optimization.md`,
  `security_best_practices.md`

**Key Features:**

- RESTful API scaffolding
- GraphQL schema generation
- Database migration management
- API endpoint validation
- Performance optimization

---

### 22. senior-frontend

**Description:** Frontend development skill with React, TypeScript, state
management, and modern tooling.

**Scripts:**

- `scripts/frontend_scaffolder.py`
- `scripts/component_analyzer.py`

**Dependencies:**

- Reference docs: `react_patterns.md`, `state_management.md`,
  `typescript_guidelines.md`

**Key Features:**

- Component scaffolding
- State management setup
- TypeScript configuration
- Build optimization
- Performance profiling

---

### 23. senior-fullstack

**Description:** Full-stack development skill covering frontend (React, Next.js)
and backend (Node.js, GraphQL, PostgreSQL).

**Scripts:**

- `scripts/fullstack_scaffolder.py`
- `scripts/project_scaffolder.py`
- `scripts/code_quality_analyzer.py`

**Dependencies:**

- Reference docs: `tech_stack_guide.md`, `architecture_patterns.md`,
  `development_workflows.md`

**Key Features:**

- End-to-end project scaffolding
- Tech stack integration
- Architecture pattern implementation
- Code quality analysis
- Development workflow automation

---

### 24. senior-qa

**Description:** QA and testing skill for ReactJS, NextJS, NodeJS with
comprehensive testing strategies.

**Scripts:**

- `scripts/test_suite_generator.py`
- `scripts/coverage_analyzer.py`
- `scripts/e2e_test_scaffolder.py`

**Dependencies:**

- Reference docs: `testing_strategies.md`, `test_automation_patterns.md`,
  `qa_best_practices.md`

**Key Features:**

- Test suite generation (unit, integration, e2e)
- Coverage analysis and reporting
- E2E test scaffolding
- Test automation patterns
- QA best practices enforcement

---

### 25. session-begin

**Description:** Complete verification checklist before starting work sessions.

**Scripts:**

- `npm run patterns:check`
- `npm run review:check`
- `npm run lessons:surface`
- `npm run session:gaps`

**Dependencies:**

- SESSION_CONTEXT.md
- ROADMAP.md
- Episodic memory system
- Technical debt tracker

**Key Features:**

- Secrets decryption check
- Cross-session validation (warns if <1h since last session without session-end)
- Episodic memory search (recent issues, patterns, decisions)
- Context loading (blockers, in-progress tasks, recent decisions)
- Stale documentation check
- Consolidation status review
- Skill selection decision tree
- Hook health validation

**Checklist:**

1. Read SESSION_CONTEXT.md
2. Increment session counter
3. Check ROADMAP.md priorities
4. Review skill availability
5. Check active blockers

---

### 26. session-end

**Description:** Verification steps and documentation updates before ending
session.

**Scripts:**

- `npm run hooks:health -- --end`
- `node scripts/debt/generate-metrics.js`
- `npm run session:end`

**Dependencies:**

- SESSION_CONTEXT.md
- ROADMAP.md
- Technical Debt Management System
- Learning consolidation system

**Key Features:**

- Roadmap progress check
- Learning consolidation trigger
- Commit summary generation
- Agent compliance review
- TDMS metrics update (total items, S0 critical, S1 high counts)
- Session context update
- Hook health validation

---

### 27. skill-creator

**Description:** Guide for creating effective Claude Code skills with best
practices.

**Scripts:**

- `scripts/init_skill.py`
- `scripts/package_skill.py`

**Dependencies:**

- Skill template structure
- YAML frontmatter schema

**Key Features:**

- 6-step creation process:
  1. Understanding with examples
  2. Planning contents
  3. Initializing structure
  4. Editing SKILL.md
  5. Packaging resources
  6. Iteration and testing
- Anatomy: SKILL.md (required) + bundled resources (scripts/, references/,
  assets/)
- Progressive disclosure pattern
- Best practices enforcement
- Versioning guidance

---

### 28. sonarcloud

**Description:** Unified SonarCloud integration for Technical Debt Management
System (TDMS).

**Scripts:**

- `scripts/debt/sync-sonarcloud.js`
- `scripts/generate-detailed-sonar-report.js`
- `scripts/debt/verify-sonar-phase.js`

**Dependencies:**

- SonarCloud API
- TDMS JSONL files
- sonarcloud-scanner

**Key Features:**

- Modes: sync (default), resolve, full, report, status, sprint
- Post-sync placement analysis with severity-weighted summary (S0=10, S1=5,
  S2=2, S3=1)
- Issue synchronization from SonarCloud
- Resolution workflows
- Sprint planning support
- Detailed reporting
- Phase verification

**Workflow:**

1. Run SonarCloud scanner
2. Fetch issues via API
3. Sync to TDMS JSONL
4. Generate views (NEW, OPEN, RESOLVED)
5. Placement analysis by directory

---

### 29. systematic-debugging

**Description:** Five-phase debugging process with root cause investigation
emphasis.

**Scripts:**

- Various diagnostic scripts depending on phase

**Dependencies:**

- Error logs
- Stack traces
- System state snapshots
- Anti-pattern database

**Key Features:**

- **Phase 0: Memory Check** - Search episodic memory for similar issues
  (required first step)
- **Phase 1: Root Cause Investigation** - Gather evidence before fixes (IRON
  LAW)
- **Phase 2: Pattern Analysis** - Identify anti-patterns and common causes
- **Phase 3: Hypothesis and Testing** - Formulate and test theories
- **Phase 4: Implementation** - Apply fixes with verification

**Iron Law:** "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"

**Key Principles:**

- Multi-component system diagnostic instrumentation pattern
- 3+ failed fixes = question architecture, not just symptoms
- Always check memory first (may already be solved)
- Document root cause before implementing solution
- Verify fix resolves issue and doesn't introduce new problems

---

### 30. test-suite

**Description:** Multi-phase UI testing orchestration for SoNash web
application.

**Scripts:**

- Test protocol files in `tests/protocols/`
- Playwright MCP integration scripts

**Dependencies:**

- Playwright MCP server
- Test protocol definitions
- Local development server

**Key Features:**

- **Phase 1: SMOKE** - Health check (homepage load, critical routes accessible)
- **Phase 2: FEATURE PROTOCOLS** - Protocol-driven feature testing
- **Phase 3: SECURITY** - Auth flows, PII handling, security headers
- **Phase 4: PERFORMANCE** - Load time, network requests, bundle weight
- **Phase 5: REPORT** - JSONL + markdown report generation

**Playwright MCP Integration:**

- `mcp__playwright__browser_navigate` - Navigate to URLs
- `mcp__playwright__browser_snapshot` - Capture accessibility tree
- `mcp__playwright__browser_click` - Interact with elements
- `mcp__playwright__browser_type` - Input text
- `mcp__playwright__browser_wait_for` - Wait for conditions

**Protocol File Format:**

```yaml
protocol: feature-name
steps:
  - action: navigate
    target: /route
  - action: snapshot
  - action: click
    element: button[data-testid="submit"]
assertions:
  - type: element-present
    selector: .success-message
error_scenarios:
  - condition: auth-failure
    expected: redirect /login
```

---

### 31. ui-design-system

**Description:** Design token generation, component documentation, and
responsive design patterns.

**Scripts:**

- `scripts/design_token_generator.py`

**Dependencies:**

- Design token schema
- Component library

**Key Features:**

- Design token generation (colors, typography, spacing, shadows)
- Component documentation
- Responsive design utilities
- Design system consistency checks
- Token versioning

---

### 32. using-superpowers

**Description:** Core rule enforcement: Check for skills BEFORE ANY RESPONSE,
including clarifying questions.

**Scripts:**

- None (meta-skill)

**Dependencies:**

- Skills directory listing
- Skill decision tree

**Key Features:**

- **Core Rule:** Check `ls .claude/skills/` before responding
- Decision flow diagram
- Red flags for rationalization:
  - "This is just a simple question"
  - "I need more context first"
  - "Let me clarify before..."
  - "This doesn't need a skill"
- Skill priority: Process skills first (brainstorming, debugging), then
  implementation skills
- No excuses policy

---

### 33. ux-researcher-designer

**Description:** UX research and design toolkit with persona generation.

**Scripts:**

- `scripts/persona_generator.py`

**Dependencies:**

- UX research templates
- Persona data models

**Key Features:**

- Data-driven persona generation
- User research documentation
- Journey mapping
- Usability testing protocols
- Design critique frameworks

---

### 34. validate-claude-folder

**Description:** Validation checks for `.claude` folder structure and
configuration.

**Scripts:**

- Various validation scripts

**Dependencies:**

- `.claude/` directory structure
- MCP configuration
- Hook files
- Skill/agent definitions

**Key Features:**

- MCP server consistency check
- Hook file validation (existence, executability, syntax)
- Skill/command alignment verification
- Documentation freshness checks
- Secrets configuration validation
- Agent file validation (schema, references)

**Checks:**

1. MCP servers configured and accessible
2. Hook files present and executable
3. Skills have valid SKILL.md files
4. Documentation up-to-date
5. Secrets properly configured
6. Agent definitions valid

---

### 35. verify-technical-debt

**Description:** Verify items in NEW status queue from TDMS (Technical Debt
Management System).

**Scripts:**

- `node scripts/debt/resolve-item.js`
- `node scripts/debt/generate-views.js`

**Dependencies:**

- TDMS JSONL files
- Debt item schema

**Key Features:**

- Classifications: VERIFIED, FALSE_POSITIVE, DUPLICATE, RESOLVED, SKIP
- Bulk verification workflows
- View generation (NEW, OPEN, RESOLVED)
- Priority sorting
- Resolution tracking

**Workflow:**

1. Read items with status=NEW
2. Present item details (file, line, severity, message)
3. Agent classifies item
4. Update status in JSONL
5. Regenerate views
6. Update metrics

---

### 36. webapp-testing

**Description:** Playwright toolkit for local web app testing with server
lifecycle management.

**Scripts:**

- `scripts/with_server.py`

**Dependencies:**

- Playwright
- Local development server
- Test specifications

**Key Features:**

- Helper script for server lifecycle (start → test → stop)
- Reconnaissance-then-action pattern:
  1. Navigate to page
  2. Wait for networkidle
  3. Inspect accessibility tree
  4. Act on elements
- Screenshot capture
- Network request monitoring
- Console log collection
- Error detection

---

## Commands Status

**Location:** `/home/user/sonash-v0/.claude/commands/`

**Status:** DEPRECATED (cleaned up Session #120, 2026-01-31)

All command functionality has been migrated to the `.claude/skills/` folder. The
commands directory now contains only a README.md explaining the migration.

**Migration Mapping:**

- Commands were 1:1 migrated to skills with same names
- Skill format provides richer documentation and bundled resources
- No loss of functionality during migration

---

## Analysis and Patterns

### Skill Categories

1. **Development Skills** (11): senior-backend, senior-frontend,
   senior-fullstack, senior-qa, frontend-design, performance-optimization,
   ui-design-system, ux-researcher-designer, git-ops, deep-code-search,
   skill-creator

2. **Quality Assurance** (7): code-reviewer, security-auditor,
   systematic-debugging, test-suite, webapp-testing, verify-technical-debt,
   sonarcloud

3. **Documentation** (5): docs-sync, docs-update, decision-log,
   meeting-protocols, daily-standup

4. **Workflow Automation** (5): session-begin, session-end, review-dispatcher,
   multi-ai-audit, pr-review

5. **Knowledge Management** (3): consolidate-learning, productivity-log,
   expansion-evaluation

6. **Infrastructure** (3): mcp-diagnostic, validate-claude-folder, find-skills

7. **Data Analysis** (1): excel-analysis

8. **Meta-Skills** (1): using-superpowers

### Common Script Patterns

1. **Python Scripts** - Most development skills use Python scripts in `scripts/`
   directory
   - Naming: `{domain}_{action}.py` (e.g., `test_suite_generator.py`)
   - Location: `scripts/` or `.claude/skills/{skill-name}/scripts/`

2. **npm Scripts** - Process and validation skills use npm run commands
   - Format: `npm run {category}:{action}` (e.g., `npm run docs:sync-check`)
   - Defined in package.json scripts section

3. **Node.js Scripts** - Infrastructure and automation skills use Node.js
   - Location: `scripts/{category}/*.js`
   - Examples: `scripts/debt/sync-sonarcloud.js`, `scripts/multi-ai-audit.js`

### Reference Documentation

Many skills include bundled reference documentation:

- Location: `.claude/skills/{skill-name}/references/`
- Format: Markdown files with domain knowledge
- Examples: `tech_stack_guide.md`, `testing_strategies.md`,
  `api_design_patterns.md`

### Integration Points

1. **TDMS (Technical Debt Management System)**
   - Skills: sonarcloud, verify-technical-debt, code-reviewer, security-auditor
   - Format: JSONL files with debt items
   - Views: NEW, OPEN, RESOLVED

2. **Session Management**
   - Skills: session-begin, session-end
   - Hooks: SessionStart, SessionEnd
   - Context: SESSION_CONTEXT.md

3. **MCP (Model Context Protocol)**
   - Skills: mcp-diagnostic, test-suite, webapp-testing
   - Servers: filesystem, playwright, memory, git, sonarcloud
   - Tools: 50+ MCP tools available

4. **Git Hooks**
   - Pre-commit validation (8 steps)
   - Post-commit documentation updates
   - Integration with session management

### Progressive Disclosure Pattern

All skills follow this structure:

1. **Metadata** - YAML frontmatter (name, description)
2. **SKILL.md** - Usage instructions, commands, examples
3. **Bundled Resources** - scripts/, references/, assets/

This allows quick discovery (metadata) → detailed learning (SKILL.md) → deep
expertise (bundled resources).

---

## Recommendations

1. **Documentation:** All skills are well-documented with clear usage
   instructions.

2. **Consistency:** Skills follow consistent naming and structure patterns.

3. **Integration:** Strong integration between skills via TDMS, session
   management, and MCP.

4. **Coverage:** Comprehensive coverage of development lifecycle (code, test,
   review, deploy, monitor).

5. **Maintenance:** Commands deprecation shows active maintenance and
   modernization.

---

**Inventory Completed:** 2026-02-09 **Total Skills:** 36 **Total Commands:** 0
(deprecated) **Data Collection Method:** Direct read of all SKILL.md files and
commands/README.md
