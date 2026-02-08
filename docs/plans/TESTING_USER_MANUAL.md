# SoNash Testing User Manual

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

## Quick Start

Run your first test in under a minute:

```bash
# Quick health check — all pages load?
/test-suite --smoke

# Test a specific feature
/test-suite --protocol=homepage

# Full test run (all phases)
/test-suite --full
```

---

## What You Can Do

### At Any Time

| Command                         | What It Does                                           | Duration   |
| ------------------------------- | ------------------------------------------------------ | ---------- |
| `/test-suite --smoke`           | Health check — verifies all pages load                 | ~1 min     |
| `/test-suite --smoke --url=URL` | Health check against specific deployment               | ~1 min     |
| `/test-suite --protocol=NAME`   | Test one specific feature                              | ~30s       |
| `/test-suite --feature`         | Run all feature protocols                              | ~5-10 min  |
| `/test-suite --security`        | Security-focused checks only                           | ~2 min     |
| `/test-suite --performance`     | Performance checks only                                | ~2 min     |
| `/test-suite --full`            | Everything (smoke + features + security + performance) | ~10-15 min |

### During PR Review

Preview URLs are auto-detected from the current branch:

```bash
# Claude auto-detects preview URL via `gh pr view`
/test-suite --feature

# Or specify explicitly
/test-suite --feature --url=https://sonash-app--pr-42-abc123.web.app
```

Preview channels deploy **hosting only** (not Cloud Functions or Firestore
rules). Protocols with `skip_on_preview: true` will be automatically skipped.

### After Deployment

```bash
# Quick production smoke test after merging
/test-suite --post-deploy
```

### During Feature Development

When Claude builds a new UI feature, it auto-generates a `.protocol.json` file
alongside the component. You can immediately test it:

```bash
/test-suite --protocol=new-feature-name
```

Iterate on the protocol until the feature passes all assertions.

---

## Understanding Results

### Where Results Live

| Type                  | Location                                        |
| --------------------- | ----------------------------------------------- |
| Machine-readable      | `.claude/test-results/{date}-{scope}.jsonl`     |
| Human-readable report | `.claude/test-results/{date}-{scope}-report.md` |
| Screenshots           | `.claude/test-results/screenshots/`             |

Results are gitignored — they're ephemeral per-session artifacts.

### Reading the Report

Every test run generates a markdown report with:

1. **Summary table** — pass/fail/skip counts per phase
2. **Failures section** — each failure with screenshot + suggested fix
3. **Skipped tests** — explains why each was skipped
4. **All passed tests** — collapsed list for reference

### What Failures Mean

| Phase       | Failure Severity | What It Means                        |
| ----------- | ---------------- | ------------------------------------ |
| SMOKE       | Critical         | Site is broken — pages don't load    |
| FEATURE     | Medium           | Specific feature regression detected |
| SECURITY    | High             | Potential vulnerability found        |
| PERFORMANCE | Low-Medium       | Degraded user experience             |

**Smoke failures abort the entire run** — if pages don't load, there's no point
testing features.

---

## Managing Test Protocols

### Viewing All Protocols

```bash
ls .claude/test-protocols/
```

Each `.protocol.json` file covers one feature area. The `_base.protocol.json`
defines common assertions applied to all protocols.

### Protocol Priority Levels

| Priority    | What's Included                             | When It Runs                     |
| ----------- | ------------------------------------------- | -------------------------------- |
| `core`      | Homepage, auth, notebook, journal, meetings | `--smoke`, `--feature`, `--full` |
| `admin`     | Admin panel features (14 tabs)              | `--feature`, `--full`            |
| `secondary` | Settings, growth, library, resources        | `--full`                         |
| `edge`      | Celebrations, responsive layout             | `--full`                         |

### Current Protocol Inventory

| Priority  | Count  | Protocols                                                                                                                                                                                            |
| --------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core      | 13     | homepage, auth-anonymous, auth-email, auth-google, notebook-shell, today-page, journal-hub, journal-mood, journal-gratitude, journal-inventory, journal-freewrite, journal-dailylog, meetings-finder |
| Admin     | 8      | admin-dashboard, admin-users, admin-privileges, admin-jobs, admin-errors, admin-logs, admin-analytics, admin-content                                                                                 |
| Secondary | 4      | growth-page, library-page, resources-page, settings-page                                                                                                                                             |
| Edge      | 2      | celebrations, responsive-layout                                                                                                                                                                      |
| **Total** | **27** |                                                                                                                                                                                                      |

### Adding New Protocols

Claude auto-creates protocols when building features. To add one manually:

1. Copy an existing protocol file
2. Modify the feature name, route, steps, and assertions
3. Validate: `/test-suite --protocol=new-name`

### Disabling a Protocol

Rename the file to disable it:

```bash
# Disable
mv feature.protocol.json feature.protocol.json.disabled

# Re-enable
mv feature.protocol.json.disabled feature.protocol.json
```

---

## Browser Modes

### Playwright MCP (Default)

- Headless browser controlled by Claude
- Works against any URL (preview, production, localhost)
- No login state — tests unauthenticated flows
- Best for: smoke tests, public pages, security checks

**Setup:** `npx playwright install` (one-time)

### Chrome Extension

- Controls your real Chrome browser
- Uses your real Firebase Auth login session
- Best for: admin panel, authenticated features, journal entries
- Enable with `--chrome` flag or automatically via `"auth_required": true`

**Usage:**

```bash
# Force Chrome Extension for all steps
/test-suite --feature --chrome

# Auto-select: auth_required steps use Chrome, others use Playwright
/test-suite --full
```

---

## Troubleshooting

| Problem                         | Solution                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| "Browser not available"         | Run `npx playwright install` or ensure Chrome is running            |
| "Auth required"                 | Log into the app in Chrome first, then use `--chrome`               |
| "Preview URL not found"         | Pass `--url=URL` explicitly                                         |
| "Assertion failed"              | Check the screenshot, update selector if UI changed                 |
| "Timeout" waiting for element   | Element may have changed — update the protocol's selector           |
| "skip_on_preview" tests skipped | Expected — these test backend integration, not available on preview |
| Console errors on page load     | May indicate a real bug — check the error message in the report     |

---

## Protocol File Format Reference

Each protocol is a JSON file with this structure:

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
    "description": "Human-readable prerequisite"
  },
  "steps": [
    {
      "id": "FEAT-01",
      "name": "Step description",
      "action": "navigate|click|type|select|snapshot|evaluate",
      "selector": "CSS selector or text=Label",
      "value": "input value (for type action)",
      "wait_for": "text=Expected or network_idle",
      "screenshot": true,
      "auth_required": false,
      "skip_on_preview": false,
      "assertions": [
        { "type": "text_visible", "value": "Expected text" },
        { "type": "element_exists", "selector": "[data-testid='x']" }
      ]
    }
  ],
  "error_scenarios": [
    {
      "id": "FEAT-E1",
      "name": "Edge case",
      "description": "What to verify",
      "manual_only": true,
      "expected": "Expected behavior"
    }
  ]
}
```

### Assertion Types

| Type                  | Description                               |
| --------------------- | ----------------------------------------- |
| `text_visible`        | Text appears on the page                  |
| `text_not_visible`    | Text does NOT appear                      |
| `element_exists`      | CSS selector matches an element           |
| `element_count`       | Exactly N elements match selector         |
| `no_console_errors`   | No error-level console messages           |
| `network_no_pii`      | No PII in network requests                |
| `url_contains`        | Current URL contains string               |
| `url_redirected`      | Navigation redirected to expected URL     |
| `screenshot_baseline` | Visual comparison with saved baseline     |
| `response_status`     | Network response has expected status code |
| `page_load_under`     | Page loads in less than N milliseconds    |

### Selector Best Practices

Use `data-testid` attributes for stable selectors:

```
data-testid="{feature}-{element}"
```

Examples:

- `data-testid="analytics-dau-card"`
- `data-testid="journal-mood-selector"`
- `data-testid="admin-users-search"`

Fall back to `text=Label` selectors for buttons and links.

---

## Architecture

```
.claude/
  test-protocols/           # Committed — part of feature spec
    _base.protocol.json     # Common assertions for all protocols
    homepage.protocol.json  # One file per feature
    admin-users.protocol.json
    ...
  test-results/             # Gitignored — ephemeral per-session
    2026-02-07-full.jsonl   # Machine-readable results
    2026-02-07-full-report.md  # Human-readable report
    screenshots/            # Failure + step screenshots
      SMOKE-01.png
      TODAY-03.png
      ...
  skills/
    test-suite/
      SKILL.md              # The skill definition
```

---

## Version History

| Version | Date       | Changes                                                        |
| ------- | ---------- | -------------------------------------------------------------- |
| 1.0     | 2026-02-07 | Initial release — 27 protocols, 5 phases, dual browser support |
