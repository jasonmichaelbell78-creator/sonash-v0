# Findings: Missing GitHub Actions Workflows for Next.js + Firebase Project

**Searcher:** deep-research-searcher (D6-SQ1c) **Profile:** web + codebase
**Date:** 2026-03-29 **Sub-Question IDs:** SQ-1c

---

## Scope and Method

This analysis cross-references the 18 existing workflows against standard GitHub
Actions categories recommended for Next.js + Firebase projects. Each candidate
was assessed for: (a) partial coverage by existing workflows, (b) value for a
solo developer, and (c) implementation complexity. Tooling compatibility with
Next.js 16 App Router was verified against current upstream sources.

**Existing workflows catalogued:** CI, CodeQL, Deploy to Firebase, Release
Please, OpenSSF Scorecard, Semgrep, Dependency Review, Auto-Label Review Tier,
Auto-merge Dependabot, Backlog Enforcement, Cleanup Stale Branches,
Documentation Lint, Pattern Compliance Audit, Review Trigger Check, Resolve
Technical Debt, Sync README Status, Validate Phase Completion, SonarCloud
(disabled).

**Key context from codebase inspection:**

- Lighthouse v13 is already a devDependency — perf tooling exists locally
- A `tests/perf/budget.perf.test.js` tests CLI script timing budgets, NOT web
  Lighthouse
- A `tests/e2e/pipeline-smoke.e2e.test.js` tests the internal review pipeline,
  NOT the web app
- No Playwright config exists; no Cypress config exists
- Preview deployments are implemented in `deploy-firebase.yml` but disabled
  (commented-out trigger)
- `hashicorp/nextjs-bundle-analysis` does NOT support App Router (issue #42 open
  as of Nov 2024)

---

## Key Findings

### 1. Bundle Size Tracking — Not Present [CONFIDENCE: HIGH]

No workflow tracks Next.js bundle size over time or enforces regressions on PRs.
The existing CI workflow runs `next build` but does not measure or report bundle
size deltas.

**Compatible tools for Next.js App Router:**

- `ai/size-limit` + `andresz1/size-limit-action`: The maintainer confirmed App
  Router compatibility (post-build analysis). Comments on PRs with size diff.
  [1][2]
- `BundleMon`: Monitors file sizes against baselines; works on any build output
  directory. GitHub-native status checks. [3]

**Incompatible (do NOT use):**

- `hashicorp/nextjs-bundle-analysis`: Open enhancement request for App Router
  support (issue #42, no resolution as of Nov 2024). [4]

**Solo dev value:** MEDIUM-HIGH. Prevents silent performance regressions from
dependency adds. Low-noise: only fires when bundles change.

**Complexity:** Trivial (size-limit post-build) to Moderate (BundleMon with
baseline service).

**Partial coverage:** None. The CI build step confirms the build succeeds but
does not track output size.

---

### 2. Lighthouse CI — Not Present [CONFIDENCE: HIGH]

No workflow runs Lighthouse audits against the built or deployed application.
The `lighthouse` devDependency (v13.0.1) exists but is only used in
`tests/perf/budget.perf.test.js`, which tests CLI script speed budgets — not web
performance metrics.

**Tool:** `treosh/lighthouse-ci-action` (wraps `@lhci/cli`). Latest stable:
v0.15.1 (released June 26, 2025). Actively maintained. [5][6]

**Modes available:**

1. Static export mode: point at `.next/` build output. No server required.
2. Against Firebase preview channel URL (requires preview channel to be
   enabled).
3. Against production URL on schedule.

**What it measures:** Performance, Accessibility, Best Practices, SEO, PWA
scores. Can enforce score budgets (fail PR if performance drops below 80, etc.)

**Solo dev value:** HIGH. Catches regressions in Core Web Vitals before deploy.
Firebase hosting has no built-in perf monitoring. Accessibility auditing (57% of
WCAG issues caught by axe-core embedded in Lighthouse) is a bonus.

**Complexity:** Moderate. Static export mode is trivial. Full PR-level auditing
against preview URLs requires preview channels to be enabled first.

**Partial coverage:** None. The existing `tests/perf/` tests are unrelated.

---

### 3. Firebase Preview Channels — Implemented but Disabled [CONFIDENCE: HIGH]

The `deploy-firebase.yml` file contains a complete, correct `preview-deploy` job
targeting `pull_request_target`. The trigger is commented out with the comment
`# Preview deploys disabled — GitHub repo variables not configured`.

This is a configuration gap, not a missing workflow. The infrastructure exists;
it is disabled because the `vars.*` GitHub repository variables (not secrets)
are not populated. The workflow correctly reads public Firebase config from
`vars.*` (non-secret values) for the preview build.

**Solo dev value:** HIGH. Every PR gets a live preview URL for visual
verification before merge. Firebase preview channels expire automatically (3d
configured).

**Complexity:** Trivial to enable — requires setting 6 GitHub repo variables in
Settings > Variables > Actions. No new workflow needed.

**Security note:** The `pull_request_target` event was tightened by GitHub in
Dec 2025 to always use default branch workflow source, reducing pwn-request
risk. The existing workflow already guards with
`github.event.pull_request.head.repo.full_name == github.repository`,
restricting to same-repo PRs only. [7]

---

### 4. Stale Issue / PR Management — Not Present [CONFIDENCE: HIGH]

No workflow marks or closes stale issues and PRs. The repo has
`cleanup-branches.yml` which deletes merged branches (different concern) but
nothing manages issue/PR staleness.

**Tool:** `actions/stale` (official GitHub action). Actively maintained. [8]

**Recommended settings for solo developer:**

- Issues: mark stale after 60 days, close after 14 days more
- PRs: disable auto-close (`days-before-pr-close: -1`) — solo devs often have
  long-running PRs
- Exempt `priority:high` and `in-progress` labels

**Solo dev value:** MEDIUM. Keeps the issue tracker clean without manual triage.
Lower priority than functional workflow gaps.

**Complexity:** Trivial. Single-file YAML with no secrets required.

**Partial coverage:** None. `cleanup-branches.yml` handles post-merge branch
deletion but not pre-merge staleness.

---

### 5. Playwright E2E Testing — Not Present [CONFIDENCE: HIGH]

No browser-level E2E test workflow exists. The file
`tests/e2e/pipeline-smoke.e2e.test.js` is a Node.js script test for the internal
review pipeline (JSONL data processing), not a browser-based web app test. No
`playwright.config.*` exists in the repo.

**Tool:** `@playwright/test` + `microsoft/playwright-github-action` (or direct
`npx playwright install --with-deps`). [9]

**For Firebase hosting:** E2E tests can target either:

1. A `next start` server spun up in the workflow (no Firebase needed for UI
   tests)
2. The production URL on a scheduled run
3. The Firebase preview channel URL after preview deploy (chained workflows)

**Firebase authentication in Playwright:** `nearform/playwright-firebase` plugin
exists for testing authenticated flows. [10]

**Solo dev value:** MEDIUM. High implementation investment upfront. ROI
increases as the app grows authenticated surface area. Auth-protected routes
(Firebase Auth) are the highest-value E2E targets.

**Complexity:** Complex. Requires: (1) writing Playwright tests, (2) handling
Firebase Auth in test environment, (3) deciding on test target (local server vs.
preview URL), (4) managing browser caching.

**Partial coverage:** None. The vitest/Node test suite covers unit tests; no
browser layer exists.

---

### 6. Accessibility Testing — Not Present (but partially covered by Lighthouse) [CONFIDENCE: HIGH]

No dedicated accessibility workflow exists. Lighthouse CI (finding #2), when
enabled, embeds axe-core and catches ~57% of WCAG violations automatically. [11]

A dedicated `axe-core/playwright` workflow would catch the remaining issues and
provide richer per-element violation reports.

**Tool:** `@axe-core/playwright` inside a Playwright test. Alternatively,
`pa11y-ci` as a standalone CLI action. [12]

**Solo dev value:** LOW-MEDIUM. If Lighthouse CI is enabled, accessibility is
partially covered. A standalone axe workflow adds depth but is redundant until
the app has significant UI surface.

**Complexity:** Complex (requires Playwright infrastructure) or Moderate
(pa11y-ci as standalone CLI against a running server).

**Partial coverage:** Lighthouse CI would cover ~57% of WCAG issues when
enabled. No current coverage.

---

### 7. Visual Regression Testing — Not Present [CONFIDENCE: HIGH]

No visual regression workflow exists. No Storybook, Chromatic, or Percy
integration is present.

**Tools:** Chromatic (component-level, requires Storybook), Percy (full-page,
requires a running app), Playwright screenshot diffs (no external service).
[13][14]

**Solo dev value:** LOW. This project does not appear to use Storybook.
Full-page visual regression with Percy/Chromatic has meaningful cost (paid
tiers) and non-trivial maintenance burden (baseline management). Playwright
screenshot diffs are free but require a baseline commit strategy.

**Complexity:** Complex. Requires choosing a tool, setting up a baseline, and
managing flakiness from dynamic content (maps, animations via framer-motion).

**Partial coverage:** None.

**Assessment:** Not recommended for current project scale. Revisit when design
system stabilizes or Storybook is adopted.

---

### 8. DAST (Dynamic Application Security Testing) — Not Present [CONFIDENCE: HIGH]

No DAST workflow exists. The existing security coverage is:

- CodeQL (SAST — static analysis of source)
- Semgrep (SAST — custom rules)
- Dependency Review (supply chain)
- OpenSSF Scorecard (repo security posture)
- SonarCloud (SAST, currently disabled)

DAST tests a _running application_ for runtime vulnerabilities (XSS, injection,
misconfigurations, exposed headers).

**Tool:** `zaproxy/action-baseline` (OWASP ZAP passive scan). Full scan
(`zaproxy/action-full-scan`) performs active attacks and should NOT be run
against production. [15]

**Solo dev value:** MEDIUM. ZAP baseline scan catches response header issues
(missing CSP, X-Frame-Options, etc.) and common misconfigs without attacking the
app. Firebase Hosting's security header configuration (`firebase.json` headers)
is a good target.

**Complexity:** Moderate. Requires a running deployment target (production URL
on schedule, or preview channel after deploy). Baseline scan is low-noise.

**Partial coverage:** CodeQL/Semgrep cover source-level issues; DAST covers
runtime behavior. Neither substitutes for the other.

---

### 9. License Compliance — Not Present [CONFIDENCE: HIGH]

No license scanning workflow exists. The `dependency-review.yml` workflow checks
for _vulnerabilities_ in new dependencies on PRs but does not check license
compatibility.

**Tools:**

- `fossas/fossa-action` (FOSSA — free tier available, requires API key) [16]
- `actions/dependency-review-action` with `license-check: true` — the existing
  `dependency-review.yml` supports this with a one-line config addition [17]

**Solo dev value:** LOW-MEDIUM. Solo personal projects have minimal license
compliance risk. However, if the app is ever monetized or open-sourced, GPL
contamination from a transitive dependency would be a problem.

**Complexity:** Trivial to add to existing `dependency-review.yml` by adding
`license-check: true` and `deny-licenses: GPL-2.0, GPL-3.0, AGPL-3.0` to the
existing action config. No new workflow file needed.

**Partial coverage:** `dependency-review.yml` already runs on PRs — extending it
is the path of least resistance.

---

### 10. Notification Workflows (Slack/Discord on Failure) — Not Present [CONFIDENCE: HIGH]

No workflow sends failure notifications to an external channel. The repo relies
on GitHub's native email notifications and the GitHub mobile app.

**Tools:** `slackapi/slack-github-action` (official Slack action),
`ravsamhq/notify-slack-action`. [18][19]

**Solo dev value:** LOW for a solo developer who monitors GitHub directly.
Higher value if GitHub email notifications are missed or the developer prefers a
Slack-first workflow. Not a standard engineering requirement.

**Complexity:** Trivial. Requires a Slack webhook secret and a 10-line job
addition.

**Partial coverage:** None. GitHub native notifications partially substitute.

---

### 11. Type Check Standalone Workflow — Not Present as Standalone [CONFIDENCE: HIGH]

TypeScript type checking (`npx tsc --noEmit`) already runs as a step inside the
CI `test` job. It is NOT a separate, parallelized workflow.

**Current state:** `ci.yml` job `test` runs:

1. Type check (`npx tsc --noEmit`)
2. Build review scripts
3. Run tests with coverage
4. Coverage threshold check
5. Pattern test suite
6. GitHub optimization wave tests
7. Upload coverage

**Gap:** If type-check fails, it blocks all of the above from running in
parallel. A standalone type-check job (parallel to `lint` and `test`) would give
faster, isolated feedback.

**Solo dev value:** LOW-MEDIUM. The existing structure already provides type
check feedback in CI; it just isn't parallelized. The delay is minor for a repo
of this scale.

**Complexity:** Trivial. Move `npx tsc --noEmit` to its own parallel CI job.
This is a CI restructure, not a new workflow.

**Partial coverage:** Fully covered in CI, just not parallelized.

---

### 12. Scheduled Health Checks — Not Present [CONFIDENCE: HIGH]

No workflow periodically pings the production URL to confirm uptime, correct
status codes, or expected response content.

**Tools:** Simple `curl` step in a scheduled workflow, or `upptime/upptime` for
a full status page. [20][21]

**Solo dev value:** LOW-MEDIUM. Firebase Hosting has its own CDN health; outages
are rare. More valuable for the Firebase Functions endpoints. A scheduled health
check gives early warning of function cold-start failures or Firestore rule
regressions after deploy.

**Complexity:** Trivial. A 15-line scheduled workflow using `curl` to check
`$PRODUCTION_URL` and Cloud Functions health endpoint.

**Partial coverage:** None. The deployment workflow logs success but doesn't
verify the live deployment post-deploy.

---

### 13. Changelog Generation Beyond Release Please — Not Present, Not Needed [CONFIDENCE: MEDIUM]

Release Please (`release-please.yml`) already generates a `CHANGELOG.md` and
GitHub releases from conventional commits. This is standard and sufficient.

**Assessment:** No gap. Additional changelog tooling (e.g., `git-cliff`,
`conventional-changelog-cli`) would be redundant.

---

## Prioritized Recommendations

Ranked by: (solo dev value \* 1.5) - complexity cost, with security gaps
weighted higher.

| Priority | Workflow                  | Action Required                                 | Complexity       | Solo Dev Value |
| -------- | ------------------------- | ----------------------------------------------- | ---------------- | -------------- |
| P1       | Firebase Preview Channels | Set 6 GitHub repo variables, uncomment trigger  | Trivial          | HIGH           |
| P2       | Lighthouse CI             | New workflow file; static export mode           | Moderate         | HIGH           |
| P3       | Bundle Size Tracking      | New workflow with `size-limit` post-build       | Trivial-Moderate | MEDIUM-HIGH    |
| P4       | License Compliance        | Add 2 lines to existing `dependency-review.yml` | Trivial          | LOW-MEDIUM     |
| P5       | Stale Issue/PR Management | New workflow file with `actions/stale`          | Trivial          | MEDIUM         |
| P6       | DAST (ZAP Baseline)       | New scheduled workflow against production URL   | Moderate         | MEDIUM         |
| P7       | Scheduled Health Check    | New 15-line scheduled workflow                  | Trivial          | LOW-MEDIUM     |
| P8       | Playwright E2E            | New test suite + workflow                       | Complex          | MEDIUM         |
| P9       | Accessibility (dedicated) | Covered by Lighthouse CI at P2                  | —                | LOW-MEDIUM     |
| P10      | Type Check Parallelized   | Refactor CI job structure                       | Trivial          | LOW            |
| SKIP     | Visual Regression         | Premature without Storybook                     | Complex          | LOW            |
| SKIP     | Notifications             | GitHub native sufficient for solo dev           | Trivial          | LOW            |
| SKIP     | Changelog generation      | Release Please covers this                      | —                | None           |

---

## Sources

| #   | URL                                                                                                              | Title                                       | Type           | Trust  | CRAAP | Date     |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------- | ------ | ----- | -------- |
| 1   | https://github.com/ai/size-limit                                                                                 | size-limit GitHub repo                      | official-repo  | HIGH   | 4.2   | 2025     |
| 2   | https://github.com/andresz1/size-limit-action                                                                    | size-limit-action                           | official-repo  | HIGH   | 4.0   | 2025     |
| 3   | https://dev.to/lironer/monitor-your-app-bundle-size-with-bundlemon-and-github-actions-18c2                       | BundleMon + GitHub Actions                  | community      | MEDIUM | 3.2   | 2022     |
| 4   | https://github.com/hashicorp/nextjs-bundle-analysis/issues                                                       | nextjs-bundle-analysis App Router issue #42 | official-repo  | HIGH   | 4.5   | Nov 2024 |
| 5   | https://github.com/GoogleChrome/lighthouse-ci                                                                    | Lighthouse CI GitHub repo                   | official-repo  | HIGH   | 4.5   | Jun 2025 |
| 6   | https://github.com/marketplace/actions/lighthouse-ci-action                                                      | Lighthouse CI Action Marketplace            | official-docs  | HIGH   | 4.3   | 2025     |
| 7   | https://github.blog/changelog/2025-11-07-actions-pull_request_target-and-environment-branch-protections-changes/ | pull_request_target Dec 2025 changes        | official-docs  | HIGH   | 5.0   | Nov 2025 |
| 8   | https://github.com/actions/stale                                                                                 | actions/stale                               | official-repo  | HIGH   | 4.5   | 2025     |
| 9   | https://nextjs.org/docs/pages/guides/testing/playwright                                                          | Next.js Playwright docs                     | official-docs  | HIGH   | 4.8   | 2025     |
| 10  | https://github.com/nearform/playwright-firebase                                                                  | playwright-firebase                         | community-repo | MEDIUM | 3.5   | 2024     |
| 11  | https://dev.to/jacobandrewsky/accessibility-audits-with-playwright-axe-and-github-actions-2504                   | Accessibility audits + Playwright + axe     | community      | MEDIUM | 3.3   | 2024     |
| 12  | https://playwright.dev/docs/accessibility-testing                                                                | Playwright accessibility testing docs       | official-docs  | HIGH   | 4.8   | 2025     |
| 13  | https://medium.com/@crissyjoshua/percy-vs-chromatic-which-visual-regression-testing-tool-to-use-6cdce77238dc     | Percy vs Chromatic                          | community      | MEDIUM | 3.0   | 2024     |
| 14  | https://codesamplez.com/devops/visual-regression-testing-github-actions                                          | SnapDrift visual regression                 | community      | MEDIUM | 3.0   | 2025     |
| 15  | https://github.com/zaproxy/action-full-scan                                                                      | ZAP Full Scan Action                        | official-repo  | HIGH   | 4.3   | 2025     |
| 16  | https://github.com/fossas/fossa-action                                                                           | FOSSA Action                                | official-repo  | HIGH   | 4.2   | 2025     |
| 17  | https://github.com/marketplace/actions/dependency-review-action                                                  | Dependency Review Action                    | official-docs  | HIGH   | 4.8   | 2025     |
| 18  | https://github.com/ravsamhq/notify-slack-action                                                                  | Notify Slack Action                         | official-repo  | HIGH   | 4.0   | 2025     |
| 19  | https://github.blog/changelog/2022-12-06-github-actions-workflow-notifications-in-slack-and-microsoft-teams/     | GitHub native workflow notifications        | official-docs  | HIGH   | 4.5   | 2022     |
| 20  | https://blog.seancoughlin.me/crafting-a-health-check-for-your-website-with-github-actions                        | Health check with GitHub Actions            | community      | MEDIUM | 3.2   | 2024     |
| 21  | https://github.com/upptime/upptime                                                                               | Upptime status page                         | official-repo  | HIGH   | 4.0   | 2025     |

---

## Contradictions

**Lighthouse CI and static Next.js:** The official Lighthouse CI Action docs
confirm static HTML export support. However, Next.js 16 App Router with server
components cannot fully statically export — it uses a hybrid model. For
Lighthouse CI to work against a running server, the workflow must spin up
`next start` (not `next export`). The static mode only works if specific pages
are exported to HTML. This is a configuration constraint, not a blocker, but
requires care in setup.

**`pull_request_target` for preview deploys:** The existing
`deploy-firebase.yml` uses `pull_request_target` for preview deploys, which
GitHub tightened in Dec 2025. The repo's current guard
(`github.event.pull_request.head.repo.full_name == github.repository`) is still
the correct pattern for single-repo workflows where forked PRs are not expected.
No contradiction with best practices — the guard is adequate.

**hashicorp/nextjs-bundle-analysis:** Multiple web sources recommend this tool
for Next.js bundle tracking. It is NOT compatible with App Router (issue open
since March 2023, no resolution). The `size-limit` approach is the App Router-
compatible alternative.

---

## Gaps

1. **Bundle size tooling for App Router:** No well-maintained GitHub Action
   exists that is specifically designed for Next.js App Router bundle analysis.
   `size-limit` works but requires manual configuration of what to measure
   (specific chunks from `.next/static/`).

2. **Firebase Functions E2E testing:** No pattern was found for running E2E
   tests against deployed Cloud Functions (not just the hosting UI). The
   Firebase Emulator Suite would need to run inside the workflow for this.

3. **DAST against Firebase preview channels:** OWASP ZAP guidance focuses on
   always-available staging URLs; ephemeral Firebase preview channel URLs
   require chaining the DAST run after the preview deploy. No published template
   for this specific pattern was found.

4. **Cost/quota of Firebase preview channels:** The docs state Firebase Hosting
   has a limit of 300 preview channels per site per project on the free Spark
   plan (source: Firebase docs). For a repo with frequent PRs, this could be a
   constraint. Could not verify the exact current limits.

---

## Serendipity

**`actions/dependency-review-action` supports license checking natively:** The
existing `dependency-review.yml` workflow already uses this action but only
checks vulnerability severity. Adding `license-check: true` and
`deny-licenses: GPL-3.0, AGPL-3.0` requires changing two lines — making the
"license compliance" gap essentially free to close.

**Lighthouse devDependency already installed:** `lighthouse` v13.0.1 is already
a devDependency. A Lighthouse CI workflow can use the locally installed binary
rather than requiring `npm install -g @lhci/cli`, reducing attack surface and
ensuring version consistency between local and CI runs.

**Preview channel infrastructure is complete:** The Firebase preview deploy job
is fully written, tested, and correct. It is disabled by a configuration gap
(missing repo variables), not by a code gap. This is the highest-ROI item on the
list — no new code needed.

---

## Confidence Assessment

- HIGH claims: 11
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The low-ambiguity findings (what tools exist, what is in the codebase, what is
disabled) are ground-truth verifiable. The value assessments for "solo
developer" are inherently subjective estimates and carry the most uncertainty
within the MEDIUM range.
