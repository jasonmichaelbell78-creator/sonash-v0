---
name: test-suite
description:
  Multi-phase UI testing orchestration for SoNash using Playwright MCP or Chrome
  Extension
---

# /test-suite — Unified Testing Suite

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## When to Use

- Tasks related to test-suite
- User explicitly invokes `/test-suite`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Purpose

Multi-phase UI testing orchestration for SoNash. Runs smoke tests, feature
protocol tests, security checks, and performance checks against any deployment
URL using Playwright MCP or Chrome Extension.

## AI Instructions

### Invocation

```
/test-suite [scope] [--url=<target>] [--protocol=<name>] [--chrome]
```

### Scopes

| Flag              | Description                         | Duration   |
| ----------------- | ----------------------------------- | ---------- |
| `--smoke`         | Quick health check (all pages load) | ~1 min     |
| `--feature`       | Run all feature protocols           | ~5-10 min  |
| `--security`      | Security-focused checks             | ~2 min     |
| `--performance`   | Performance checks                  | ~2 min     |
| `--full`          | All phases                          | ~10-15 min |
| `--protocol=NAME` | Run single protocol by name         | ~30s       |
| `--post-deploy`   | Production smoke after merge        | ~1 min     |

### URL Resolution (in order)

1. `--url=URL` flag (explicit)
2. PR preview URL via `gh pr view --json url` (auto-detect)
3. `https://sonash-app.web.app` (production fallback)

### Browser Selection

| Condition                        | Tool                                  |
| -------------------------------- | ------------------------------------- |
| Default                          | Playwright MCP (`mcp__playwright__*`) |
| Step has `"auth_required": true` | Chrome Extension                      |
| Step has `"tool": "chrome"`      | Chrome Extension                      |
| User passes `--chrome`           | Chrome Extension for all steps        |

---

## Execution Pipeline

### Phase 1: SMOKE

Navigate to target URL and verify app loads on key routes.

**Steps:**

1. `mcp__playwright__browser_navigate` to target URL
2. Verify page loads (check for app shell elements)
3. Navigate to each route: `/`, `/notebook`, `/admin`, `/journal`,
   `/meetings/all`
4. On each page:
   - `mcp__playwright__browser_snapshot` — check for page content
   - `mcp__playwright__browser_console_messages` — check for errors
   - `mcp__playwright__browser_take_screenshot` — save to
     `.claude/test-results/screenshots/`
5. **GATE:** If ANY page fails to load → ABORT entire test run

**Record each step as JSONL:**

```json
{
  "test_id": "SMOKE-01",
  "protocol": "smoke",
  "phase": "smoke",
  "name": "Homepage loads",
  "status": "pass",
  "duration_ms": 850,
  "assertions": [{ "type": "text_visible", "value": "SoNash", "passed": true }],
  "screenshot": ".claude/test-results/screenshots/SMOKE-01.png",
  "error_message": null,
  "timestamp": "2026-02-07T12:00:00Z",
  "target_url": "https://sonash-app.web.app"
}
```

### Phase 2: FEATURE PROTOCOLS

Execute feature test protocols from `.claude/test-protocols/`.

**Steps:**

1. Scan `.claude/test-protocols/*.protocol.json` (exclude `_base.protocol.json`)
2. Sort by priority: `core` → `admin` → `secondary` → `edge`
3. For `--smoke` scope: skip this phase
4. For `--feature` scope: run all protocols matching priority filter
5. For `--protocol=NAME` scope: run only the named protocol
6. For each protocol file: a. Read the JSON file b. Check prerequisites (auth
   level, skip_on_preview) c. Execute each step sequentially:
   - For `navigate` action: resolve `step.value` against the target URL origin
     (if it starts with `/`, build `${new URL(target_url).origin}${step.value}`)
     then call `mcp__playwright__browser_navigate`
   - For `click` action: `mcp__playwright__browser_click` with selector
   - For `type` action: `mcp__playwright__browser_type` with selector + value
   - For `select` action: `mcp__playwright__browser_select_option`
   - For `snapshot` action: `mcp__playwright__browser_snapshot`
   - For `evaluate` action: `mcp__playwright__browser_evaluate` d. After each
     step, check assertions:
   - `text_visible`: snapshot contains expected text
   - `text_not_visible`: snapshot does NOT contain text
   - `element_exists`: snapshot contains matching selector
   - `element_count`: evaluate `document.querySelectorAll(selector).length`
   - `no_console_errors`: `mcp__playwright__browser_console_messages` has no
     errors
   - `network_no_pii`: `mcp__playwright__browser_network_requests` has no
     emails/userIds
   - `url_contains`: current URL includes string
   - `url_redirected`: navigation redirected to expected URL
   - `page_load_under`: evaluate page load duration via Navigation Timing API:
     `(() => { const nav = performance.getEntriesByType('navigation')[0]; return nav ? nav.duration : null; })()`
     and assert result is non-null and < threshold (ms)
   - `evaluate_truthy`: evaluate the JavaScript expression and assert it returns
     truthy e. If `screenshot: true`, take screenshot f. If step has
     `browser_resize` property (`{ "width": N, "height": N }`), call
     `mcp__playwright__browser_resize` before executing the step g. Record
     result as JSONL line
7. **Continue on failure** — collect all results, do not abort

### Phase 3: SECURITY

Security-focused checks.

**Steps:**

1. Navigate to `/admin` without auth → verify redirect to login
2. Scan network requests for PII:
   - `mcp__playwright__browser_network_requests`
   - Check no email addresses or raw user IDs in request URLs/bodies
3. Check security headers (via `mcp__playwright__browser_network_requests`):
   - Locate the document response for the target route
   - Assert headers include: `Content-Security-Policy`, `X-Frame-Options` (or
     `frame-ancestors` via CSP), `Strict-Transport-Security`
   - If headers unavailable in tool output → record as **skipped**
     (`reason: "headers_unavailable_in_tool"`)
4. Check console for exposed secrets:
   - No API keys, tokens, or credentials in console output

### Phase 4: PERFORMANCE

Performance checks.

**Steps:**

1. Navigate to homepage, measure load time:
   - `mcp__playwright__browser_evaluate`:
     `(() => { const nav = performance.getEntriesByType('navigation')[0]; return nav ? nav.duration : null; })()`
   - Threshold: < 3000ms (skip if `null`)
2. Count network requests:
   - `mcp__playwright__browser_network_requests`
   - Flag if > 50 requests
3. Check total page weight:
   - Sum transfer sizes from network requests
   - Flag if > 5MB
4. Take screenshot for visual baseline comparison

### Phase 5: REPORT

Generate results files.

**Steps:**

1. Collect all JSONL lines from phases 1-4
2. Write to `.claude/test-results/{YYYY-MM-DD}-{scope}.jsonl`
3. Generate markdown report at
   `.claude/test-results/{YYYY-MM-DD}-{scope}-report.md`:

```markdown
# Test Suite Report — {date} ({scope} scope)

**Target:** {url} **Duration:** {total_duration} **Result:**
{pass_count}/{total} passed, {fail_count} failed, {skip_count} skipped

## Summary

| Phase       | Pass | Fail | Skip | Total |
| ----------- | ---- | ---- | ---- | ----- |
| Smoke       | ...  | ...  | ...  | ...   |
| Feature     | ...  | ...  | ...  | ...   |
| Security    | ...  | ...  | ...  | ...   |
| Performance | ...  | ...  | ...  | ...   |

## Failures

### {test_id}: {name}

- **Protocol:** {protocol}
- **Assertion:** {failed_assertion}
- **Screenshot:** {screenshot_path}
- **Suggested Fix:** {suggestion}

## Skipped Tests

| Test | Reason                                        |
| ---- | --------------------------------------------- |
| ...  | manual_only / skip_on_preview / auth_required |

## All Passed Tests

<details><summary>Click to expand ({count} tests)</summary>

| Test ID | Protocol | Name | Duration |
| ------- | -------- | ---- | -------- |
| ...     | ...      | ...  | ...      |

</details>
```

4. Print summary to conversation:
   - Total pass/fail/skip counts
   - List of failures with one-line descriptions
   - Path to full report

---

## Protocol File Format

Protocol files live at `.claude/test-protocols/{feature-name}.protocol.json`.

```json
{
  "protocol_version": "1.0",
  "feature": "Feature Name",
  "created": "2026-02-07",
  "created_session": 141,
  "priority": "core|admin|secondary|edge",
  "target_route": "/route",
  "prerequisites": {
    "auth": "none|user|admin",
    "description": "Human-readable prereq"
  },
  "steps": [
    {
      "id": "FEAT-01",
      "name": "Step description",
      "action": "navigate|click|type|select|snapshot|evaluate",
      "selector": "text=Button or [data-testid='x']",
      "value": "text to type (for type action)",
      "wait_for": "text=Expected or network_idle",
      "screenshot": true,
      "auth_required": false,
      "skip_on_preview": false,
      "assertions": [
        { "type": "text_visible", "value": "Expected text" },
        { "type": "element_exists", "selector": "[data-testid='x']" },
        { "type": "no_console_errors" }
      ]
    }
  ],
  "error_scenarios": [
    {
      "id": "FEAT-E1",
      "name": "Edge case name",
      "description": "What to verify",
      "manual_only": true,
      "expected": "Expected behavior"
    }
  ]
}
```

## Assertion Types Reference

| Type                  | Description                     | MCP Tool                   |
| --------------------- | ------------------------------- | -------------------------- |
| `text_visible`        | Text appears on page            | `browser_snapshot`         |
| `text_not_visible`    | Text does NOT appear            | `browser_snapshot`         |
| `element_exists`      | CSS selector matches            | `browser_snapshot`         |
| `element_count`       | N elements match selector       | `browser_evaluate`         |
| `no_console_errors`   | No error-level console messages | `browser_console_messages` |
| `network_no_pii`      | No PII in network requests      | `browser_network_requests` |
| `url_contains`        | URL contains string             | `browser_snapshot`         |
| `url_redirected`      | Redirected to expected URL      | `browser_navigate`         |
| `screenshot_baseline` | Visual comparison               | `browser_take_screenshot`  |
| `response_status`     | Network response code           | `browser_network_requests` |
| `page_load_under`     | Load time less than N ms        | `browser_evaluate`         |

## Results Location

- **JSONL:** `.claude/test-results/{YYYY-MM-DD}-{scope}.jsonl`
- **Report:** `.claude/test-results/{YYYY-MM-DD}-{scope}-report.md`
- **Screenshots:** `.claude/test-results/screenshots/{test_id}.png`

## Notes

- Preview channels deploy hosting only — protocols with `skip_on_preview: true`
  test backend integration and should be skipped on preview URLs
- Steps with `auth_required: true` need Chrome Extension (real login state) or
  should be skipped
- The `_base.protocol.json` defines common assertions applied to all protocols
- Always install Playwright first: `npx playwright install` (if browser_navigate
  fails)

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
