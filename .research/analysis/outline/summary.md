# Engineer View: Outline (outline/outline)

## Repository Profile

| Metric         | Value                          |
| -------------- | ------------------------------ |
| Stars          | 38,038                         |
| Forks          | 3,199                          |
| Open Issues    | 69                             |
| Contributors   | 30+ (page 1)                   |
| Language       | TypeScript                     |
| License        | BSL 1.1                        |
| Latest Release | v1.6.1 (2026-03-18)            |
| Last Push      | 2026-04-12 (today)             |
| Repo Age       | ~10 years (created 2016-05-22) |
| Files          | 2,394                          |
| Migrations     | 281                            |
| Dependencies   | 382 direct                     |

## Summary Bands

| Dimension       | Band    | Score | Key Evidence                                                                                                                                                              |
| --------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security        | B+ (78) | 78    | Strong auth/authz (85/A), good input validation (82/B+), mature secrets management (88/A). Dragged down by CSP wildcards (70/B-) and high dependency count (60/C).        |
| Reliability     | A- (84) | 84    | Mature architecture (82-90 across dimensions). Command pattern ensures business logic consistency. 4-shard CI. HocusPocus persistence with race condition handling.       |
| Maintainability | B+ (80) | 80    | Clean monorepo structure (88/A). Plugin system (90/A). But fat route files, query sprawl in routes, 35 ungrouped MobX stores, and dated build system (65/C) add friction. |
| Documentation   | C+ (52) | 52    | Strongest doc is AGENTS.md (78/B). Everything else is thin: README (55/C), ARCHITECTURE.md (65/C), API docs (30/D), plugin docs (25/D). External delegation pattern.      |
| Process         | A- (83) | 83    | 8 CI workflows. Path-filtered test execution. Oxlint + Prettier. Husky pre-commit. CodeQL scanning. Docker build checks. Bundle size tracking via RelativeCI.             |
| Velocity        | A (90)  | 90    | Pushed today. Release v1.6.1 less than a month old. 281 migrations over 10 years shows continuous evolution. 38K stars, 3.2K forks, active community.                     |

## Absence Pattern Analysis

| Pattern                     | Present?    | Evidence                                        |
| --------------------------- | ----------- | ----------------------------------------------- |
| CONTRIBUTING.md             | ABSENT      | No contribution guide in repo                   |
| Coverage thresholds         | ABSENT      | No coverage config in Jest, no coverage CI step |
| E2E tests                   | ABSENT      | No Playwright, no Cypress                       |
| Frontend tests              | NEAR-ABSENT | 7/723 files (0.97%)                             |
| API documentation (in-repo) | ABSENT      | Entirely delegated to external docs site        |
| Plugin documentation        | ABSENT      | No plugin READMEs, only plugin.json one-liners  |
| .env.example                | ABSENT      | No environment variable template                |
| Changelog                   | ABSENT      | No CHANGELOG.md, relies on GitHub releases      |
| Dependency scanning CI      | ABSENT      | No npm audit, Snyk, or Dependabot in CI         |
| Module boundary enforcement | ABSENT      | No workspaces, no internal-import lint rules    |

## Detailed Dimension Scores

### Security (all from security agent)

| Sub-dimension                  | Score | Band |
| ------------------------------ | ----- | ---- |
| Authentication & Authorization | 85    | A    |
| Input Validation               | 82    | B+   |
| Secrets Management             | 88    | A    |
| Dependency Security            | 60    | C    |
| Rate Limiting                  | 72    | B    |
| Infrastructure Security        | 70    | B-   |
| Data Protection                | 80    | B+   |

### Architecture (all from architecture agent)

| Sub-dimension           | Score | Band |
| ----------------------- | ----- | ---- |
| Monorepo Structure      | 88    | A    |
| Backend Architecture    | 82    | B    |
| Frontend Architecture   | 85    | A    |
| Database Layer          | 80    | B    |
| Plugin System           | 90    | A    |
| Real-time Collaboration | 87    | A    |
| Build System            | 65    | C    |

### Documentation (all from documentation agent)

| Sub-dimension         | Score | Band |
| --------------------- | ----- | ---- |
| README                | 55    | C    |
| Architecture docs     | 65    | C    |
| Internal docs         | 50    | C    |
| CLAUDE.md / AGENTS.md | 78    | B    |
| Code comments (JSDoc) | 60    | C    |
| API documentation     | 30    | D    |
| Plugin documentation  | 25    | D    |
| Deployment docs       | 55    | C    |

### Test Infrastructure (all from testing agent)

| Sub-dimension    | Score | Band |
| ---------------- | ----- | ---- |
| Framework Config | 82    | B    |
| Coverage         | 45    | D    |
| Test Patterns    | 78    | B+   |
| Mocking Strategy | 72    | B-   |
| Test Utilities   | 88    | A-   |
| CI Integration   | 85    | A-   |
| Test Quality     | 76    | B    |

## Dual-Lens Scoring

### Adoption Lens (primary for application repos)

| Factor               | Score     | Notes                                                                               |
| -------------------- | --------- | ----------------------------------------------------------------------------------- |
| Would I deploy this? | 75        | BSL 1.1 limits use. Strong architecture but CSP and dep count are concerns.         |
| Would I contribute?  | 60        | AI PRs discouraged. No CONTRIBUTING.md. External docs. High barrier.                |
| Would I fork this?   | 70        | Good monorepo structure. Plugin system is portable. But 382 deps is heavy.          |
| Overall Adoption     | **Trial** | Worth evaluating for self-hosted knowledge base. Architecture patterns extractable. |

### Creator Lens (primary for learning/extraction)

| Factor                       | Score       | Notes                                                                     |
| ---------------------------- | ----------- | ------------------------------------------------------------------------- |
| What does it teach?          | 88          | Command pattern, MCP integration, plugin architecture, real-time collab.  |
| How does it challenge me?    | 82          | Transport-agnostic business logic. Production MCP. Scope-filtered tools.  |
| What patterns can I extract? | 85          | 11 candidates (4 T1 high-relevance, 4 T2, 3 T3).                          |
| Overall Creator              | **Extract** | High extraction value. Multiple patterns directly applicable to JASON-OS. |

**Primary Lens:** Creator (Extract) -- this repo's value is in what it teaches,
not in adopting the product.

## Adoption Assessment: Extract

Outline is not a candidate for adoption (different product domain, BSL license).
Its value is as a **pattern source** for JASON-OS and SoNash architecture
decisions. The command pattern, MCP server implementation, and plugin system are
the highest-value extraction targets.
