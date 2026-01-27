# Testing Infrastructure Plan

**Document Version:** 1.1 **Created:** 2026-01-27 (Session #103) **Status:**
ACTIVE **Priority:** P1 **Related:** [TESTING_PLAN.md](../TESTING_PLAN.md),
[ROADMAP.md](../../ROADMAP.md) (Track T)

> **Integrated:** This plan is now **Track T** in the Active Sprint. See
> [ROADMAP.md#track-t](../../ROADMAP.md#track-t---testing-infrastructure-new---session-103)
> for task tracking.

---

## Purpose

This document outlines a comprehensive testing infrastructure for SoNash that:

1. **Automates repetitive testing** - Components, buttons, clicks, functions
2. **Leverages browser automation** - Playwright with Chrome extension support
3. **Integrates with admin/dev panels** - Dashboard visibility into test status
4. **Supports both environments** - Web (remote) and CLI (local with Chrome
   extension)
5. **Builds for the future** - Sustainable infrastructure for ongoing
   development

---

## Current State Assessment

### What We Have

| Category           | Status      | Details                                      |
| ------------------ | ----------- | -------------------------------------------- |
| Unit Tests         | ✅ Strong   | 293+ tests, Vitest, 98.9% pass rate          |
| Manual Checklists  | ✅ Good     | TESTING_PLAN.md with phase-specific guidance |
| Track A Tests      | ✅ Complete | 131 tests across 8 categories                |
| CI Integration     | ✅ Basic    | Pre-push test run, pattern compliance        |
| Coverage Reporting | ⚠️ Planned  | AUTO-004 in backlog                          |
| E2E Tests          | ❌ Missing  | Only D5.5 golden-path planned                |
| Visual Regression  | ❌ Missing  | No infrastructure                            |
| Component Testing  | ❌ Missing  | No isolated component tests                  |
| Load Testing       | ❌ Missing  | No infrastructure                            |

### Key Gaps

1. **No E2E test suite** - Can't automatically verify user journeys
2. **No component isolation tests** - UI components untested in isolation
3. **No visual regression** - UI changes go undetected
4. **No browser automation** - All UI testing is manual
5. **No test data factories** - Manual test setup is time-consuming
6. **No dashboard visibility** - Can't see test health at a glance

---

## Proposed Testing Stack

### Browser Automation: Playwright

**Why Playwright:**

- Native Chrome extension support (CLI environment)
- Cross-browser testing (Chromium, Firefox, WebKit)
- Built-in screenshot/video capture
- Native TypeScript support
- MCP server already available (`mcp__playwright__*`)

**Environment Support:**

| Environment  | Browser                | Extension Support | Notes                       |
| ------------ | ---------------------- | ----------------- | --------------------------- |
| Web (Remote) | Headless Chromium      | Limited           | CI/CD, automated runs       |
| CLI (Local)  | Chrome with extensions | Full              | `/chrome` extension enabled |
| Emulator     | Firebase Emulator UI   | N/A               | Backend testing             |

### Test Pyramid Strategy

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← 10-15 critical journeys
                    │   (Playwright)  │     User-facing flows
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Integration    │  ← 50-100 tests
                    │  Tests (Vitest) │     API + Component combos
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │       Unit Tests            │  ← 300+ tests (existing)
              │       (Vitest)              │     Functions, utilities
              └─────────────────────────────┘
```

---

## Track T - Testing Infrastructure

> **Effort Estimate:** ~45 hours total **Dependencies:** Track B (Dev Dashboard
> for visibility) **Owner:** Claude

### Phase 1: Playwright Foundation (8hr)

| Task     | Effort | Description                                          |
| -------- | ------ | ---------------------------------------------------- |
| **T1.1** | 2hr    | Install and configure Playwright                     |
| **T1.2** | 2hr    | Create test fixtures (auth, emulator, test users)    |
| **T1.3** | 2hr    | Create base page objects (HomePage, AdminPage, etc.) |
| **T1.4** | 2hr    | Configure CI integration (GitHub Actions)            |

**Deliverables:**

- `playwright.config.ts` with environment-specific settings
- `tests/e2e/fixtures/` directory with shared test setup
- `tests/e2e/pages/` with Page Object Models
- `.github/workflows/e2e.yml` for CI runs

### Phase 2: Golden Path E2E Tests (10hr)

> Implements D5.5 and expands to critical user journeys

| Task     | Effort | Journey                                           |
| -------- | ------ | ------------------------------------------------- |
| **T2.1** | 2hr    | **Auth Flow** - Sign in, anonymous auth, sign out |
| **T2.2** | 2hr    | **Onboarding** - Clean date, fellowship, nickname |
| **T2.3** | 2hr    | **Daily Journal** - Mood, gratitude, free-write   |
| **T2.4** | 2hr    | **Meeting Finder** - Search, filter, pagination   |
| **T2.5** | 2hr    | **Admin CRUD** - Meetings/Quotes/Users operations |

**Test File Structure:**

```
tests/e2e/
├── fixtures/
│   ├── auth.fixture.ts       # Auth helpers
│   ├── emulator.fixture.ts   # Firebase emulator setup
│   └── test-data.fixture.ts  # Test data factories
├── pages/
│   ├── home.page.ts
│   ├── journal.page.ts
│   ├── today.page.ts
│   ├── resources.page.ts
│   └── admin.page.ts
├── journeys/
│   ├── auth.spec.ts
│   ├── onboarding.spec.ts
│   ├── daily-journal.spec.ts
│   ├── meeting-finder.spec.ts
│   └── admin-crud.spec.ts
└── playwright.config.ts
```

### Phase 3: Component Testing (10hr)

> Test UI components in isolation using Playwright component testing

| Task     | Effort | Component Area                                        |
| -------- | ------ | ----------------------------------------------------- |
| **T3.1** | 2hr    | **Form Components** - Input validation, submit states |
| **T3.2** | 2hr    | **Modal/Dialog** - Open, close, interactions          |
| **T3.3** | 2hr    | **Navigation** - Tabs, ribbon, breadcrumbs            |
| **T3.4** | 2hr    | **Data Display** - Cards, lists, pagination           |
| **T3.5** | 2hr    | **Admin Components** - CRUD forms, data tables        |

**Priority Components:**

1. `MoodSelector` - Critical daily input
2. `MeetingCard` - Primary data display
3. `JournalEntryForm` - Complex form logic
4. `AdminTabContent` - CRUD operations
5. `PaginatedList` - Reusable pattern

### Phase 4: Visual Regression (6hr)

> Detect unintended UI changes automatically

| Task     | Effort | Description                                  |
| -------- | ------ | -------------------------------------------- |
| **T4.1** | 2hr    | Configure Playwright visual comparison       |
| **T4.2** | 2hr    | Create baseline screenshots (key pages)      |
| **T4.3** | 2hr    | Integrate with CI (fail on diff > threshold) |

**Pages to Capture:**

- Home page (notebook view)
- Journal page (timeline)
- Today page (all sections)
- Meeting finder (list + map views)
- Admin panel (each tab)

### Phase 5: Dev Dashboard Integration (5hr)

> Surface test health in the Dev Dashboard (Track B)

| Task     | Effort | Description                                          |
| -------- | ------ | ---------------------------------------------------- |
| **T5.1** | 2hr    | **Test Results Tab** - Show pass/fail summary        |
| **T5.2** | 2hr    | **Coverage Display** - File/component breakdown      |
| **T5.3** | 1hr    | **Run Tests Button** - Trigger test suite from panel |

**Dashboard Features:**

- Real-time test status (last run timestamp)
- Trend graph (pass rate over time)
- Coverage heatmap by directory
- Quick-run buttons for specific test suites
- Links to test reports/screenshots

### Phase 6: Test Data Management (6hr)

| Task     | Effort | Description                                                |
| -------- | ------ | ---------------------------------------------------------- |
| **T6.1** | 2hr    | **Test Data Factories** - User, Meeting, Journal factories |
| **T6.2** | 2hr    | **Seed Scripts** - Populate emulator with realistic data   |
| **T6.3** | 2hr    | **Cleanup Utilities** - Reset state between tests          |

**Factory Pattern:**

```typescript
// tests/factories/user.factory.ts
// Use counter instead of Date.now() to avoid race conditions in parallel tests
let userCounter = 0;
export const createTestUser = (overrides?: Partial<User>): User => {
  userCounter++;
  return {
    id: `test-user-${userCounter}`,
    email: `test-${userCounter}@example.com`,
    cleanDate: new Date(),
    fellowship: "AA",
    ...overrides,
  };
};

// tests/factories/meeting.factory.ts
let meetingCounter = 0;
export const createTestMeeting = (overrides?: Partial<Meeting>): Meeting => {
  meetingCounter++;
  return {
    id: `test-meeting-${meetingCounter}`,
    name: "Test Meeting",
    type: "AA",
    day: "Monday",
    time: "19:00",
    ...overrides,
  };
};
```

---

## CLI-Specific Features (Chrome Extension Support)

When running locally with the CLI and `/chrome` extension:

### Enhanced Capabilities

1. **Live Browser Debugging**
   - Watch tests run in real Chrome
   - Pause on failure, inspect DOM
   - Use Chrome DevTools during test

2. **Extension-Enabled Testing**
   - Test with real browser extensions loaded
   - Useful for PWA testing, push notifications

3. **Local-Only Tests**
   - Tests that require Chrome-specific features
   - Tests that need local storage inspection

### Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: "chromium-headless",
      use: { ...devices["Desktop Chrome"], headless: true },
    },
    {
      name: "chrome-extension",
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        channel: "chrome", // Use real Chrome
        launchOptions: {
          args: ["--load-extension=/path/to/extension"],
        },
      },
    },
  ],
});
```

### Running Modes

```bash
# CI/Remote (headless, no extensions)
npm run test:e2e

# CLI/Local (headed, with Chrome extensions)
npm run test:e2e:local

# Component tests only
npm run test:components

# Visual regression
npm run test:visual

# Full suite with coverage
npm run test:full
```

---

## Admin/Dev Panel Integration

### Test Management Tab (proposed for Dev Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│  Test Suite Health                               [Run All]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Unit Tests      ████████████████████ 293/295 (99.3%)      │
│  E2E Tests       ██████████████░░░░░░  12/15  (80.0%)      │
│  Components      ████████████████░░░░  45/50  (90.0%)      │
│  Visual          ████████████████████  10/10  (100%)       │
│                                                             │
│  Last Run: 2026-01-27 14:32:15 (5 min ago)                 │
│  Coverage: 67% → 72% (+5% this week)                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Recent Failures                                            │
│  • auth.spec.ts:42 - Expected redirect to /app              │
│  • meeting-finder.spec.ts:87 - Timeout waiting for list     │
│                                               [View Report] │
└─────────────────────────────────────────────────────────────┘
```

### Quick Actions from Dev Panel

- **Run Unit Tests** - `npm test`
- **Run E2E Tests** - `npm run test:e2e`
- **Update Visual Baselines** - `npm run test:visual:update`
- **View Coverage Report** - Opens HTML coverage report
- **View Last Report** - Opens Playwright HTML report

---

## Implementation Roadmap

### Sprint Integration

| When     | Phase                          | Effort | Blocked By |
| -------- | ------------------------------ | ------ | ---------- |
| Week 1   | Phase 1: Playwright Foundation | 8hr    | None       |
| Week 1-2 | Phase 2: Golden Path E2E       | 10hr   | Phase 1    |
| Week 2-3 | Phase 3: Component Testing     | 10hr   | Phase 1    |
| Week 3   | Phase 4: Visual Regression     | 6hr    | Phase 2    |
| Week 4   | Phase 5: Dashboard Integration | 5hr    | Track B    |
| Week 4   | Phase 6: Test Data Management  | 6hr    | Phase 1    |

**Total:** ~45 hours over 4 weeks (parallel with other work)

### Quick Wins (Can Start Immediately)

1. **T1.1** - Install Playwright (30 min)
2. **T2.1** - Auth flow E2E test (2hr)
3. **T6.1** - Test data factories (2hr)

These can be done without waiting for full infrastructure.

---

## Success Criteria

### Phase 1 Complete When:

- [ ] Playwright installed and configured
- [ ] At least 1 E2E test runs in CI
- [ ] Test fixtures work with Firebase emulator

### Phase 2 Complete When:

- [ ] 5 golden path journeys have E2E coverage
- [ ] Tests run reliably in CI (no flakiness)
- [ ] Test reports generated automatically

### Phase 3 Complete When:

- [ ] 20+ component tests written
- [ ] Critical form components covered
- [ ] Component tests run in <30 seconds

### Phase 4 Complete When:

- [ ] Visual baselines captured for key pages
- [ ] CI fails on visual regressions >5%
- [ ] Easy process to update baselines

### Phase 5 Complete When:

- [ ] Test status visible in Dev Dashboard
- [ ] Can trigger tests from Dashboard
- [ ] Coverage trends tracked over time

### Phase 6 Complete When:

- [ ] Test factories exist for all major entities
- [ ] Seed script can populate emulator
- [ ] Tests clean up after themselves

---

## Maintenance Strategy

### Ongoing Tasks

1. **Add tests with new features** - Every feature gets E2E coverage
2. **Update visual baselines** - When intentional UI changes merge
3. **Monitor flaky tests** - Address tests that fail intermittently
4. **Review coverage trends** - Weekly check in Dev Dashboard

### Test Ownership

- **Unit tests**: Developer who writes the code
- **E2E tests**: Added with feature implementation
- **Visual tests**: Updated when UI intentionally changes
- **Component tests**: When components are created/modified

---

## AI Instructions

When working with testing:

1. **New Feature** → Add E2E test for the user journey
2. **Bug Fix** → Add regression test that would have caught it
3. **UI Change** → Update visual baselines if intentional
4. **Component Change** → Update component tests
5. **Running Tests** → Use `npm run test:e2e:local` for headed mode

**Test File Naming:**

- E2E journeys: `*.spec.ts` in `tests/e2e/journeys/`
- Components: `*.component.ts` in `tests/e2e/components/`
- Visual: `*.visual.ts` in `tests/e2e/visual/`

---

## Version History

| Version | Date       | Changes                                              |
| ------- | ---------- | ---------------------------------------------------- |
| 1.1     | 2026-01-27 | Integrated into ROADMAP.md as Track T - Session #103 |
| 1.0     | 2026-01-27 | Initial draft - Session #103                         |

---

**END OF DOCUMENT**
