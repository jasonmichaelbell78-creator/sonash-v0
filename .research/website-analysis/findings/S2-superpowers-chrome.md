# Findings: superpowers-chrome Plugin Viability for /website-analysis Skill

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-06
**Sub-Question IDs:** SQ-S2 (superpowers-chrome evaluation)

---

## Key Findings

### 1. What superpowers-chrome is and what it exposes [CONFIDENCE: HIGH]

`superpowers-chrome` (GitHub:
[obra/superpowers-chrome](https://github.com/obra/superpowers-chrome)) is a
Claude Code plugin providing direct Chrome DevTools Protocol (CDP) browser
control with zero external dependencies (uses Node.js built-in WebSocket). It is
authored by Jesse Vincent (jesse@fsck.com / @obra) under MIT license.

It operates in two distinct modes:

**Skill Mode (CLI):** 17 discrete `chrome-ws` commands available to Claude Code
agents. Requires explicit invocation for each capture. Content extraction
commands:

- `extract <tab> <selector>` — get element text content
- `html <tab> [selector]` — get full page HTML or element HTML (rendered DOM,
  not source)
- `markdown <tab> <filename.md>` — export page as Markdown file
- `eval <tab> <js-expression>` — execute arbitrary JavaScript (full scripting
  access)
- `attr <tab> <selector> <attribute>` — retrieve element attributes
- `screenshot <tab> <filename.png>` — visual capture

**MCP Mode:** Single `use_browser` tool with 13 actions (superset of
Playwright-style API) consumed by Claude Desktop or any MCP client. Auto-capture
is **enabled by default** — every DOM-modifying action (navigate, click, type,
select, eval) automatically saves four artifacts:

- `page.html` — full rendered post-JS DOM
- `page.md` — structured markdown extraction
- `screenshot.png` — viewport visual capture
- `console-log.txt` — browser console messages

Current installed version is v1.6.1 (December 2025). Latest published version is
v1.8.0 (February 2026). The plugin in this project is **currently disabled**.

---

### 2. How it differs from the built-in `/chrome` command [CONFIDENCE: HIGH]

The built-in `/chrome` command in Claude Code is a basic browser opener — it
navigates to a URL but does not expose CDP access, content extraction APIs, or
structured output. `superpowers-chrome` wraps the full Chrome DevTools Protocol
to give programmatic control: it can extract rendered DOM, execute arbitrary JS,
manage multiple tabs, capture screenshots, and export content as Markdown. The
built-in `/chrome` has none of these programmatic extraction capabilities.
[1][3]

---

### 3. CDP usage and content extraction depth [CONFIDENCE: HIGH]

Yes, it uses CDP directly. The MCP server imports `chrome-ws-lib.js` and calls
CDP functions via WebSocket without subprocess overhead. The `raw` command in
Skill Mode sends raw JSON-RPC CDP commands for full protocol access — this means
any CDP domain is theoretically accessible (Network, Performance, Accessibility,
DOM, Runtime, Page, etc.).

Confirmed extraction capabilities:

- **Rendered DOM** (`html` action): Post-JavaScript execution HTML state [1][4]
- **Markdown conversion** (`extract`/`markdown` actions): Converts page content
  to structured Markdown [1][4]
- **JavaScript eval** (`eval`): Can access `document.title`, computed styles,
  `performance.getEntries()`, DOM measurements, link enumeration, or any
  JS-accessible browser data [4]
- **Console output** (MCP auto-capture): Browser console messages saved
  automatically [2]
- **Visual state** (screenshot): Viewport or full-page (v1.8.0+) PNG [2]

**Not directly exposed as first-class commands:**

- Network request capture (HAR) — achievable via `eval` +
  `PerformanceResourceTiming` or raw CDP Network domain, but not a built-in
  command
- Performance metrics (Core Web Vitals) — achievable via `eval` + `performance`
  API, not built-in
- Accessibility tree — not a dedicated command; achievable via `raw` CDP
  Accessibility domain

---

### 4. Requires a running Chrome instance? [CONFIDENCE: HIGH]

No. The plugin auto-starts Chrome when needed. Key behavior:

- `chrome-ws start` launches Chrome with remote debugging enabled
- Auto-detects platform (macOS, Linux, Windows) for correct executable path
- Headless by default (v1.6.0+), falling back to headed on request
- Container-aware: v1.6.1 auto-detects `DISPLAY`/`WAYLAND_DISPLAY` on Linux and
  `TERM_PROGRAM` on macOS to choose headless vs headed automatically
- Port allocation: dynamic (9222–12111 range, v1.7.0+), persisted per-profile in
  `~/.cache/superpowers/browser-profiles/{name}.meta.json`
- Persistent profiles: preserves cookies, localStorage, extensions, auth
  sessions across invocations [2]

---

### 5. GitHub repo status and version 1.6.1 specifics [CONFIDENCE: HIGH]

Repository: https://github.com/obra/superpowers-chrome Current
marketplace-listed version (claudemarketplaces.com): v1.5.0 (catalog lag
expected) Actual latest: v1.8.0 (February 25, 2026) Stars: 49 (community
adoption metric) Releases: Published via CHANGELOG.md and git tags; no GitHub
Releases page entries (the /releases page was empty — tags are the versioning
mechanism)

**v1.6.1 (2025-12-15) — Installed version in this project:**

- Auto-detects display availability in containers (Linux:
  DISPLAY/WAYLAND_DISPLAY; macOS: TERM_PROGRAM; Windows: always assumes display
  available)
- Added `--headed` flag to complement `--headless`
- Improved startup logging indicating mode and reason
- Fixed Chrome crashes in CI/container environments

**Version trajectory after v1.6.1:**

- v1.7.0 (2026-02-08): Dynamic port allocation, multi-instance support,
  per-profile metadata
- v1.8.0 (2026-02-25): Viewport emulation, full-page screenshots, HiDPI fixes,
  `pid`/`info` commands, cookie clearing, path traversal security fix

---

### 6. Comparison to Playwright MCP for content extraction [CONFIDENCE: MEDIUM-HIGH]

| Dimension               | superpowers-chrome (MCP mode)            | Playwright MCP                           |
| ----------------------- | ---------------------------------------- | ---------------------------------------- |
| **Fresh sessions**      | No — persistent profiles by default      | Yes — clean context per session          |
| **Rendered HTML**       | Auto-captured on every DOM action        | Available via `snapshot` tool            |
| **Markdown extraction** | Yes, built-in auto-capture               | Not built-in; requires custom processing |
| **Console logs**        | Auto-captured                            | Available but not automatic              |
| **Screenshots**         | Auto-captured                            | On demand                                |
| **Accessibility tree**  | Not a direct command; via raw CDP        | Yes — primary navigation mode            |
| **Zero dependencies**   | Yes (built-in WebSocket)                 | No (requires playwright npm package)     |
| **Multi-instance**      | Yes, port ranges + profiles (v1.7.0+)    | Depends on configuration                 |
| **Auth persistence**    | Yes — profile-based                      | Requires explicit cookie/storage setup   |
| **Full CDP access**     | Yes via `raw` command                    | No, constrained to Playwright API        |
| **Context footprint**   | Single `use_browser` tool (13 actions)   | Multiple tools (25+ actions)             |
| **Target user**         | Claude Code agents (skill) + MCP clients | MCP clients, browser automation          |

**Key differentiator:** Playwright MCP uses the page accessibility tree as its
primary data representation (structured roles/text), while superpowers-chrome
uses the rendered HTML/Markdown as its primary output. For website _analysis_
(content, links, structure), the Markdown-first approach of superpowers-chrome
aligns better. For form interaction and element targeting, both are comparable.
[5][6]

---

### 7. Computed styles, DOM snapshots, console output [CONFIDENCE: HIGH]

- **DOM snapshots:** Yes — `html` action returns full rendered post-JS DOM; MCP
  auto-capture saves `page.html` on every DOM action [2]
- **Console output:** Yes — MCP auto-capture saves `console-log.txt` on every
  DOM action [2]
- **Computed styles:** Not a direct command, but achievable via `eval`:
  `window.getComputedStyle(document.querySelector('selector'))` [4]
- **Full-page screenshots:** Added in v1.8.0 (`fullpage: true` parameter) — not
  available in installed v1.6.1 [2]

---

### 8. Unique capabilities vs built-in `/chrome` and Playwright MCP [CONFIDENCE: MEDIUM-HIGH]

**Unique vs built-in `/chrome`:** Everything. Built-in `/chrome` is a navigation
opener, not a programmatic extraction tool.

**Unique vs Playwright MCP:**

1. **Persistent authenticated sessions**: Profile-based cookie/localStorage
   persistence means the plugin can analyze sites requiring authentication
   without re-login on each run. Playwright starts fresh.

2. **Multi-instance parallel analysis**: Dynamic port allocation (v1.7.0)
   enables running multiple Chrome instances simultaneously on different ports —
   useful for comparing multiple URLs in parallel.

3. **Auto-captured Markdown**: Every navigation automatically produces a
   structured Markdown representation of the page without explicit extraction
   calls. This is directly usable as analysis input with zero post-processing.

4. **Full CDP via `raw`**: The `raw` command enables direct JSON-RPC CDP calls —
   this means network HAR capture, performance timeline, coverage reports,
   security info, and any CDP domain not wrapped by Playwright's API. Playwright
   deliberately constrains to its own API surface.

5. **Dual-mode operation**: Same plugin works as both CLI skill (for Claude Code
   agents in shell workflows) and MCP server (for any MCP client), making it
   composable with other tool stacks.

6. **Zero npm dependencies**: Runs on any Node.js without `npm install`.
   Playwright requires the npm package plus browser downloads.

---

### 9. Maintenance status and release cadence [CONFIDENCE: HIGH]

Active and well-maintained. Release cadence in 2026: v1.7.0 (Feb 8) and v1.8.0
(Feb 25), so approximately every 2-3 weeks. The project has 79 commits, 79 tags,
and regular PR merges. The author (Jesse Vincent / @obra) is the primary driver
of both the superpowers ecosystem and this plugin. [1][3]

The installed version (v1.6.1) is 2 minor versions behind current (v1.8.0). The
gap includes meaningful additions: dynamic port allocation and full-page
screenshots. Upgrading would be straightforward given the plugin system.

---

## Sources

| #   | URL                                                                           | Title                            | Type               | Trust  | CRAAP | Date    |
| --- | ----------------------------------------------------------------------------- | -------------------------------- | ------------------ | ------ | ----- | ------- |
| 1   | https://github.com/obra/superpowers-chrome                                    | obra/superpowers-chrome README   | Official repo      | HIGH   | 4.4   | 2026-02 |
| 2   | https://github.com/obra/superpowers-chrome/blob/main/mcp/README.md            | MCP Server README                | Official docs      | HIGH   | 4.6   | 2026-02 |
| 3   | https://claudemarketplaces.com/plugins/obra-superpowers-chrome                | Plugin marketplace listing       | Community          | MEDIUM | 3.2   | 2025    |
| 4   | https://deepwiki.com/obra/superpowers-chrome/2.2-skill-mode-setup             | Skill Mode Setup (DeepWiki)      | Community analysis | MEDIUM | 3.8   | 2026    |
| 5   | https://www.scrapeless.com/en/blog/mcp-integration-guide                      | CDP vs Playwright MCP comparison | Community          | MEDIUM | 3.4   | 2026    |
| 6   | https://playwright.dev/docs/getting-started-mcp                               | Playwright MCP official docs     | Official docs      | HIGH   | 4.8   | 2026    |
| 7   | https://github.com/obra/superpowers-chrome/blob/main/CHANGELOG.md             | Full CHANGELOG                   | Official repo      | HIGH   | 4.8   | 2026-02 |
| 8   | https://github.com/obra/superpowers-chrome/blob/main/skills/browsing/SKILL.md | Browsing Skill SKILL.md          | Official docs      | HIGH   | 4.8   | 2026-02 |

---

## Contradictions

**Version discrepancy:** The plugin is listed as v1.5.0 on
`claudemarketplaces.com` [3] but the CHANGELOG clearly shows v1.6.1 (Dec 2025)
and v1.8.0 (Feb 2026). The marketplace catalog lags behind the actual GitHub
releases. The version installed in this project (`v1.6.1`) is from the Claude
Code plugin system's own versioning, which may be tracking tags differently from
the marketplace listing. No functional contradiction — the CHANGELOG is ground
truth.

**MCP action count discrepancy:** The MCP README [2] describes 13 actions while
the DeepWiki skill mode comparison [4] references "22 actions" in MCP mode and
the browsing SKILL.md lists additional actions (`show_browser`, `hide_browser`,
`browser_mode`, `set_profile`, `get_profile`). The core content extraction
actions (navigate, extract, html, eval, screenshot) are consistent across all
sources. The discrepancy is likely documentation lag: v1.8.0 added
`set_viewport`, `clear_cookies`, `pid`, `info` which may not be reflected in
older docs.

---

## Gaps

1. **Network request / HAR capture:** No dedicated command confirmed. The `raw`
   CDP command theoretically enables this (via `Network.enable` +
   `Network.responseReceived`), but no documentation or examples found. For a
   `/website-analysis` skill that needs HTTP header inspection or redirect
   chains, this would require custom `raw` CDP commands — not turnkey.

2. **Accessibility tree as structured data:** No dedicated accessibility command
   documented. Achievable via `raw` CDP Accessibility domain, but this adds
   complexity vs Playwright MCP which exposes it natively.

3. **Robots.txt / sitemap.xml handling:** Not addressed by superpowers-chrome.
   These require HTTP requests to specific paths, best handled by WebFetch or
   curl at the skill level.

4. **Performance metrics (Core Web Vitals):** No dedicated command. Achievable
   via `eval` + `PerformanceObserver` or `raw` CDP, but requires JS knowledge
   from the calling agent.

5. **v1.6.1 vs v1.8.0 gap impact:** Full-page screenshots require v1.8.0.
   Multi-instance parallel analysis requires v1.7.0. The current installed
   version lacks both. Upgrading would unlock these for the skill.

6. **Console log format:** Not verified — the auto-capture produces
   `console-log.txt` but the structure (plain text vs structured JSON) is not
   documented in sources reviewed.

---

## Serendipity

**Auto-capture is the killer feature for analysis:** The MCP mode's automatic
artifact capture on every DOM action (html + md + screenshot + console) means
that a single `navigate` call to a URL produces four analysis artifacts with no
additional tool calls. This is architecturally different from Playwright MCP
which requires explicit snapshot requests. For a `/website-analysis` skill
making a one-time visit to analyze a page, this reduces tool call overhead
significantly.

**Profile persistence enables authenticated site analysis:** The persistent
profile system (v1.6.0+) means the plugin can maintain logged-in sessions across
skill invocations. A `/website-analysis` skill that pre-authenticates once can
then analyze private/authenticated content on subsequent runs — a capability no
static extractor (trafilatura, Readability, Jina Reader) can match.

**`raw` CDP command is a long-tail superpower:** The `raw` command effectively
makes superpowers-chrome a general-purpose CDP client. Any CDP domain (Audits,
CSS, Fetch, Network, Performance, Security, Storage) is accessible. This gives
the skill escape-hatch access to capabilities that would otherwise require a
dedicated tool (e.g., Lighthouse-style audits, network waterfall, security
info).

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM-HIGH claims: 2
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All claims are backed by official GitHub repository documentation (README,
CHANGELOG, SKILL.md, mcp/README.md) fetched directly. The single area of lower
confidence (MEDIUM-HIGH) is the Playwright MCP comparison, which relied partly
on third-party comparison articles.
