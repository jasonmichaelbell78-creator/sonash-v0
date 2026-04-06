# Findings: `/chrome` Built-In Claude Code Command as Website Content Extraction Tool

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-06
**Sub-Question IDs:** SQ-chrome-1 through SQ-chrome-8

---

## Key Findings

### 1. Extraction Capabilities: What `/chrome` Can Return [CONFIDENCE: HIGH]

The Claude in Chrome integration exposes **16 tools** via the `claude-in-chrome`
MCP server. The extraction-relevant tools confirmed by community analysis and
the official docs include:

| Tool                                   | Function                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `read_page`                            | Read visible text and page structure                                              |
| `get_page_text`                        | Extract text content from a page                                                  |
| `javascript_tool`                      | Execute arbitrary JavaScript, enabling DOM queries and structured data extraction |
| `read_console_messages`                | Read browser console output                                                       |
| `read_network_requests`                | Intercept XHR/fetch/RSC responses (survives page navigation)                      |
| `tabs_context_mcp`                     | List current open tabs with metadata                                              |
| `find`                                 | Find elements on the page                                                         |
| `shortcuts_list` / `shortcuts_execute` | Execute predefined task shortcuts                                                 |
| `gif_creator`                          | Record browser interactions as GIF                                                |
| `resize_window`                        | Control viewport                                                                  |

**What it can extract:**

- Visible text content from rendered pages (including JavaScript-rendered
  content)
- Full DOM state via `javascript_tool` — can query `document.querySelector`,
  `document.head`, etc.
- JSON-LD structured data via `javascript_tool` targeting
  `script[type="application/ld+json"]` tags
- OpenGraph metadata via `javascript_tool` querying `meta[property^="og:"]`
- Network request payloads (XHR/fetch responses) — useful for API-driven sites
- Console errors and warnings
- Screenshots of the rendered page

**What it cannot natively return as a direct tool output:**

- Raw page HTML as a string (no `get_html` tool exists; must be done via
  `javascript_tool` executing `document.documentElement.outerHTML`)
- Accessibility tree in bulk form (that is Playwright MCP's approach; `/chrome`
  takes a visual/targeted approach)

**Notable:** Structured data extraction (JSON-LD, OpenGraph) is documented as a
working pattern. Community sources confirm `javascript_tool` can target
`script[type="application/ld+json"]` blocks and `meta` tags directly [1][2].

---

### 2. Comparison with Playwright MCP for Content Extraction [CONFIDENCE: HIGH]

The tools operate on fundamentally different architectures:

| Dimension            | Claude in Chrome                                  | Playwright MCP                                  |
| -------------------- | ------------------------------------------------- | ----------------------------------------------- |
| **Approach**         | Visual/targeted, uses real user browser           | Accessibility tree, headless Chromium           |
| **HTML/DOM access**  | Via `javascript_tool` (targeted)                  | Full accessibility tree per action              |
| **Text extraction**  | Visible text on screen                            | Complete page content via accessibility tree    |
| **Tokens per page**  | ~15,400 tokens (7.7% of 200k context) [3]         | Potentially 50,000+ tokens on complex pages [4] |
| **Token efficiency** | Moderate                                          | Poor on complex pages                           |
| **Authentication**   | Shares real browser session cookies automatically | Requires programmatic re-authentication         |
| **Headless mode**    | NOT available — requires visible Chrome window    | Native headless, CI/CD ready                    |
| **Multi-browser**    | Chrome and Edge only                              | Chromium, Firefox, WebKit                       |
| **Startup latency**  | Fast (connects to running browser)                | Slower (spins up new instance)                  |
| **Tools count**      | 16                                                | 33+                                             |
| **Cost**             | Requires paid Anthropic plan                      | Free and open-source                            |

**For website-analysis specifically:** Playwright MCP's accessibility tree
approach provides more deterministic, structured content per page, but at much
higher token cost. Claude in Chrome's `javascript_tool` can match Playwright's
structured data extraction when targeted correctly, at lower token cost, but
requires the visible Chrome window to remain open.

---

### 3. Limitations [CONFIDENCE: HIGH]

**Hard platform limitations:**

- **No headless mode** — Chrome must be running visibly. Confirmed by the
  official docs and the Claude-in-Chrome vs Chrome DevTools MCP comparison
  report [3][5].
- **Service worker idle timeout** — Chrome Manifest V3 kills the extension's
  service worker after **30 seconds of inactivity**. The connection drops
  silently. Manual `/chrome → Reconnect extension` is required to resume [6][7].
- **No WSL support** — Windows Subsystem for Linux is explicitly unsupported
  [1].
- **Browser support** — Chrome and Edge only; Brave, Arc, and other Chromium
  variants are not supported [1].
- **CAPTCHA / login walls** — Extension pauses and requires manual user
  intervention; cannot autonomously bypass [1].
- **Page size limits** — Not explicitly documented, but the targeted extraction
  approach avoids the 50,000+ token problem of Playwright's full accessibility
  tree dumps. Large pages are managed by targeted queries.
- **Rate limits** — No documented per-request rate limit, but each
  `javascript_tool` call is synchronous within the browser context.

**Authentication note:** While the extension shares the user's existing browser
session (cookies, local storage), it does NOT handle fresh auth flows
autonomously. CAPTCHAs and login pages require manual intervention.

---

### 4. Website Analysis Use Case Fit [CONFIDENCE: MEDIUM]

| Use Case                        | Feasibility                                | Notes                                                                                                             |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **robots.txt reading**          | YES — via navigate + read_page             | Navigate to `domain.com/robots.txt`, read content. No specialized tool needed.                                    |
| **OpenGraph metadata**          | YES — via `javascript_tool`                | Query `document.querySelectorAll('meta[property^="og:"]')`                                                        |
| **JSON-LD structured data**     | YES — confirmed pattern [2]                | Query `script[type="application/ld+json"]` — cleanest extraction path                                             |
| **Page title, description**     | YES — via `read_page` or `javascript_tool` | Standard DOM access                                                                                               |
| **Link extraction**             | YES — via `javascript_tool`                | `document.querySelectorAll('a[href]')`                                                                            |
| **JavaScript-rendered content** | YES                                        | Renders in real Chrome — no JS execution gap                                                                      |
| **Authenticated pages**         | YES — using real session                   | Best-in-class for auth-gated sites                                                                                |
| **Following links (crawl)**     | PARTIAL                                    | Multi-page navigation works but service worker timeout (30s idle) is a blocking risk for 15+ page Expedition Mode |
| **Page structure analysis**     | PARTIAL                                    | Accessible via `javascript_tool`, but no structured hierarchical output like Playwright's accessibility tree      |
| **Raw HTML dump**               | YES — via `javascript_tool`                | Must execute `document.documentElement.outerHTML` — not a native tool output                                      |
| **Network request inspection**  | YES — `read_network_requests`              | Intercepts XHR/fetch; useful for SPA-heavy sites                                                                  |

---

### 5. Autonomous vs. User-Interactive Operation [CONFIDENCE: HIGH]

Claude in Chrome is **NOT suitable for headless/unattended operation.** Key
constraints:

- Chrome must be running as a visible window. There is no headless flag.
- The 30-second service worker idle timeout breaks autonomous long-running
  workflows [6][7]. If processing pauses (waiting for a tool response, executing
  code, etc.) for >30s with no browser tool call, the connection drops.
- CAPTCHAs and login walls require manual user intervention.
- The official docs explicitly acknowledge the service worker idle issue: "If
  browser tools stop working after a period of inactivity, run `/chrome` and
  select 'Reconnect extension'." [1]

**Contrast:** Playwright MCP runs fully headless and is CI/CD-ready. For the
`/website-analysis` skill's Expedition Mode (15+ pages), this is a critical
difference.

---

### 6. Latency Profile and Multi-Page Suitability [CONFIDENCE: MEDIUM]

**Token cost per page:** ~15,400 tokens (from the Claude in Chrome vs Chrome
DevTools MCP comparison report [3]). This is moderate — better than Chrome
DevTools MCP (~19,000 tokens) but much worse than PinchTab (~800 tokens) [8].

**Multi-page viability for Expedition Mode (15+ pages):**

- **Service worker idle timeout is the primary blocker.** Any gap in browser
  tool calls exceeding ~30 seconds drops the connection [6][7].
- Multi-tab support exists but is described as functional for interactive use,
  not autonomous crawling.
- No documented hard limit on pages per session, but the timeout means
  sequential analysis of 15+ pages requires continuous browser activity with no
  gaps > 30 seconds.
- Multi-agent parallelism (spawning multiple Claude instances) could
  theoretically parallelize page analysis, but each instance needs its own
  Chrome session or tab — adding coordination complexity.
- Community testing shows sequential multi-page workflows work when interactions
  are continuous, but "fire and forget" 10-minute autonomous loops consistently
  fail [7].

**Verdict for Expedition Mode:** HIGH RISK. The service worker timeout is an
architectural constraint (Chrome MV3) with no Anthropic-provided fix as of March
2026 [7].

---

### 7. Stability / Beta Status and Windows Issues [CONFIDENCE: HIGH]

**Beta status:**

- Officially designated **beta** as of the official docs publication (2026) [1].
- Extension version must be 1.0.36 or higher; Claude Code must be 2.0.73 or
  higher.
- Community testing found the extension "unstable in beta (v1.0.54),
  experiencing random disconnections" [8].

**Known Windows-specific bugs:**

- **EADDRINUSE named pipe conflict (Critical):** Affects Claude Code v2.1.21,
  v2.1.22, v2.1.25, v2.1.27. Both the MCP server (`--claude-in-chrome-mcp`) and
  the native messaging host (`--chrome-native-host`) attempt to listen on the
  same named pipe `\\.\pipe\claude-mcp-browser-bridge-{username}`, causing a
  crash. Issue #21512 was closed as "not planned" — no fix committed.
  Workaround: downgrade to v2.1.19 [9].
- **Multiple duplicate reports:** Issues #21363, #21420, #21337, #21791, #21825,
  #22304, #22651, #22683, #22877 all report the same EADDRINUSE failure [9].
- **Native messaging host startup crashes** — documented as Windows-specific;
  reinstalling Claude Code sometimes resolves.
- **Multi-device cross-wiring** — Cloud routing (`bridge.claudeusercontent.com`)
  can misdirect browser commands between machines on the same account [7].

**Critical for this project (Windows 11):** The EADDRINUSE bug affects recent
Claude Code versions on Windows. With Issue #21512 closed as "not planned,"
users on current versions may need to stay on v2.1.19 or watch for a future fix.
This is a **blocking reliability issue** for a `/website-analysis` skill on this
platform.

---

### 8. Bot Protection Handling (Cloudflare) [CONFIDENCE: MEDIUM]

**The core advantage:** Claude in Chrome uses a real Chrome browser with the
user's actual cookies, IP address, and browser fingerprint. It is NOT headless,
which means:

- Standard Cloudflare Bot Management (detecting `navigator.webdriver`, headless
  browser fingerprints) does not apply [10].
- The TurnStyle/CAPTCHA challenges that block Playwright headless are less
  likely to trigger when using real Chrome with a signed-in session.

**Confirmed real-world use:** Simon Willison successfully used Claude in Chrome
to navigate the Cloudflare dashboard (an authenticated Cloudflare product)
without any bot challenges [11].

**The detection paradox:** The extension IS detectable as non-human via:

- DOM fingerprint: Injects `claude-agent-stop-container` element and
  `claude-agent-animation-styles` styling block into the page DOM during active
  operation [12].
- Extension fingerprint: Sites can detect the extension by probing Web
  Accessible Resources at
  `chrome-extension://fcoeoabgfenejglbffodgkkbkcdhcgfn/assets/accessibility-tree.js`
  [12].
- A `MutationObserver` on the DOM can detect exactly when Claude takes and
  releases control [12].

**Bottom line:** Claude in Chrome bypasses _headless detection_ (the primary
Cloudflare defense) because it uses a real Chrome instance. However,
sophisticated sites implementing extension detection or DOM mutation monitoring
can identify it as automated. For most website analysis targets (public
marketing sites, documentation, blogs), Cloudflare interstitials are unlikely to
trigger at all.

---

## Sources

| #   | URL                                                                                                                                 | Title                                                   | Type              | Trust       | CRAAP Avg | Date     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------- | ----------- | --------- | -------- |
| 1   | https://code.claude.com/docs/en/chrome                                                                                              | Use Claude Code with Chrome (beta)                      | Official docs     | HIGH        | 4.8       | 2026     |
| 2   | Search results synthesis                                                                                                            | "claude in chrome" javascript_tool JSON-LD extraction   | Web search        | MEDIUM      | 3.2       | 2026     |
| 3   | https://github.com/shanraisshan/claude-code-best-practice/blob/main/reports/claude-in-chrome-v-chrome-devtools-mcp.md               | Claude in Chrome vs Chrome DevTools MCP                 | Community report  | MEDIUM      | 3.8       | 2026     |
| 4   | https://lalatenduswain.medium.com/playwright-mcp-vs-claude-in-chrome-which-browser-testing-tool-should-you-use-in-2026-e502bee0067a | Playwright MCP vs Claude in Chrome (2026)               | Community/Medium  | MEDIUM      | 3.5       | Mar 2026 |
| 5   | Search results synthesis                                                                                                            | Claude in Chrome headless mode availability             | Web search        | MEDIUM      | 3.0       | 2026     |
| 6   | https://github.com/anthropics/claude-code/issues/15239                                                                              | Service worker idle timeout breaks autonomous workflows | GitHub issue      | HIGH        | 4.5       | Dec 2025 |
| 7   | https://www.dassi.ai/blog/why-claude-code-chrome-extension-keeps-disconnecting/                                                     | Why Claude Code Chrome Extension Keeps Disconnecting    | Community blog    | MEDIUM      | 3.6       | Mar 2026 |
| 8   | https://dev.to/minatoplanb/i-tested-every-browser-automation-tool-for-claude-code-heres-my-final-verdict-3hb7                       | I Tested Every Browser Automation Tool for Claude Code  | Community/DEV     | MEDIUM      | 3.7       | 2026     |
| 9   | https://github.com/anthropics/claude-code/issues/21512                                                                              | BUG: Windows named pipe EADDRINUSE conflict             | GitHub issue      | HIGH        | 4.6       | 2026     |
| 10  | https://www.cheq.ai/blog/the-cyborg-session-reversing-detecting-claude-ai-agent-chrome-extension/                                   | Reversing & Detecting Claude AI Agent Chrome Extension  | Security research | MEDIUM      | 3.9       | 2026     |
| 11  | https://simonwillison.net/2025/Dec/22/claude-chrome-cloudflare/                                                                     | Using Claude in Chrome to navigate Cloudflare dashboard | Primary report    | MEDIUM-HIGH | 4.0       | Dec 2025 |
| 12  | Source [10]                                                                                                                         | DOM injection fingerprinting details                    | Security analysis | MEDIUM      | 3.9       | 2026     |

---

## Contradictions

**Headless capability:** Some search result snippets (from general browser
automation guides) suggest headless operation is possible for Claude Code
browser automation. This refers to Playwright MCP, NOT Claude in Chrome. The
official docs and multiple community sources confirm unambiguously that Claude
in Chrome requires a visible Chrome window — no headless mode exists [1][3][4].

**Service worker timeout fix:** Issue #15239 was closed as a duplicate of
#14590, but the root fix status is unclear. The dassi.ai blog (March 2026)
states "No permanent fix from Anthropic exists" while the GitHub issue thread
was locked after 7 days without a confirmed resolution. The official docs
acknowledge the workaround (`/chrome → Reconnect extension`) but do not state
the underlying bug is fixed.

**Windows EADDRINUSE:** Issue #21512 was closed as "not planned" but the thread
contains no acknowledgment that the bug was actually resolved — only that it was
triaged out. It is unclear whether newer Claude Code versions (post-2.1.27) have
fixed this or if it persists.

---

## Gaps

1. **Complete tool return value schemas** — The 16 tools are confirmed by name,
   but the exact return format (e.g., whether `read_page` returns raw HTML,
   accessibility tree JSON, or plain text) is not documented publicly. The
   official docs only show natural language usage examples, not structured API
   schemas. To confirm return formats, the
   `packages/@ant/claude-for-chrome-mcp/src/index.ts` source file would need to
   be inspected.

2. **Current EADDRINUSE status** — Issue #21512 was closed as "not planned" in
   early 2026. It is unknown whether Claude Code versions newer than 2.1.27 have
   resolved this silently.

3. **robots.txt compliance behavior** — Whether `read_page` on
   `domain.com/robots.txt` triggers any compliance checking, or simply returns
   the raw content as text, is not documented.

4. **Explicit page size limits** — No documentation or benchmarks exist for
   maximum page size (DOM node count, HTML size) that the extension can handle
   without degradation.

5. **Parallel tab operation** — Whether a single Claude Code instance can
   process multiple tabs simultaneously via `claude-in-chrome` tools (rather
   than sequentially) is not confirmed. Multi-agent parallelism (multiple Claude
   instances) appears to be the documented parallel approach.

6. **Connection reliability improvements post-v2.1.19** — Exact version where
   Windows EADDRINUSE was patched (if ever) is unconfirmed.

---

## Serendipity

1. **PinchTab as an alternative** — Community testing identified PinchTab (a
   Chrome extension that serves the accessibility tree via an HTTP server on
   port 9867) as achieving ~800 tokens per page vs ~15,400 for Claude in Chrome
   — a 19x efficiency advantage. It avoids the service worker timeout entirely
   by using a persistent background daemon. This was not in the original
   research scope but may be highly relevant for the Expedition Mode 15+ page
   requirement [8].

2. **DOM injection detectability** — The Claude in Chrome extension injects
   `claude-agent-stop-container` and `claude-agent-animation-styles` into every
   page during active operation. For a website-analysis skill that visits public
   sites, this leaves a forensic trail that sophisticated anti-bot systems could
   detect and log. Websites could theoretically identify that they're being
   analyzed by Claude Code [12].

3. **`read_network_requests` for SPA sites** — This tool intercepts XHR/fetch
   responses before they're rendered, which is particularly valuable for Single
   Page Applications that load content dynamically. It "survives page
   navigations unlike JS-based interceptors" and could extract structured API
   data that neither Playwright MCP nor static extractors like trafilatura can
   access. This is potentially the strongest differentiator of Claude in Chrome
   for website analysis.

4. **`bridge.claudeusercontent.com` relay** — Browser commands route through
   Anthropic's cloud relay, not directly. This means browser tool calls require
   internet connectivity even for localhost analysis, and introduces
   Anthropic-side latency for every browser interaction.

---

## Confidence Assessment

- **HIGH claims:** 5 (official docs, GitHub issues with confirmed reproduction
  steps)
- **MEDIUM claims:** 3 (community comparisons, search synthesis, bot detection
  analysis)
- **LOW claims:** 0
- **UNVERIFIED claims:** 0
- **Overall confidence:** MEDIUM-HIGH

The extraction capabilities, architecture, Windows bugs, and service worker
timeout are all well-documented by primary sources (official docs + GitHub
issues). The Cloudflare bypass advantage is plausible and supported by one
primary experiment plus security research, but no systematic benchmarks exist.
The "complete tool return format" gap prevents HIGH confidence on the exact data
structures the skill would receive.

---

## Summary Recommendation for `/website-analysis` Skill

**Claude in Chrome is a POOR primary extraction tool for a `/website-analysis`
skill** given:

- No headless mode (requires open Chrome window — skill cannot run autonomously)
- Service worker 30s idle timeout (critical blocker for Expedition Mode 15+
  pages)
- Windows EADDRINUSE bug on current versions (blocking on this project's
  platform)
- Beta stability (random disconnections documented by community)

**It excels in one specific scenario:** Analyzing **authenticated** or
**Cloudflare-protected** sites where other tools fail, because it reuses the
user's real browser session. This could be offered as an optional "authenticated
mode" fallback.

**Better-fit alternatives** (already evaluated in the parallel research):

- **Playwright MCP** — headless, CI-ready, 33+ tools, but high token cost
- **WebFetch** — zero setup, works for static sites
- **PinchTab** (serendipitous find) — 800 tokens/page via Chrome accessibility
  tree HTTP server, avoids service worker timeout
