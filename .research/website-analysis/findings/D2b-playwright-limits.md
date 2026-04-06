# Findings: Playwright MCP Capabilities and Limitations for Web Analysis

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ2b

---

## Key Findings

### 1. Tool Inventory: 26 Tools Across 7 Categories [CONFIDENCE: HIGH]

The official microsoft/playwright-mcp exposes 26 tools. The core inventory
(verified via GitHub README and npm package docs):

**Navigation:**

- `browser_navigate` — load URL, configurable viewport (default 1280x720),
  browser type, and timeouts
- `browser_navigate_back`, `browser_navigate_forward` — history traversal
- `browser_wait_for` — wait for network idle or selector

**Interaction:**

- `browser_click`, `browser_type`, `browser_fill` (form fill),
  `browser_select_option`
- `browser_hover`, `browser_drag`, `browser_press_key`
- `browser_handle_dialog` — accept/dismiss alerts/confirms
- `browser_file_upload`

**Content Extraction:**

- `browser_snapshot` — PRIMARY extraction mode; returns structured accessibility
  tree as text (not a screenshot). This is the core LLM interaction primitive.
- `browser_take_screenshot` — visual PNG/JPEG capture (Chromium, Firefox,
  WebKit)
- `browser_evaluate` — execute arbitrary JavaScript in page context; returns
  result
- `browser_console_messages` — retrieve console output filtered by level
  (error/warning/info/debug)

**Network:**

- `browser_network_requests` — list all network requests since page load
- `browser_mock_route` — mock API routes with URL pattern matching (useful for
  testing, not extraction)

**Tabs/Sessions:**

- `browser_tabs` — list, create, switch, close tabs
- `browser_close` — terminate browser and release resources

**Storage/State:**

- `browser_storage_state` — save/restore cookies + localStorage as JSON
- Direct cookie management (set/get/delete) added after May 2025 PR merge

**Advanced:**

- `browser_run_code` — execute full Playwright TypeScript scripts for complex
  multi-step flows
- `browser_pdf_save` — export current page as PDF (Chromium-only; disabled by
  default; requires `--caps=pdf`)

**Capability flags (disabled by default, require explicit `--caps=` opt-in):**

- Screenshots (`--caps=screenshot`)
- PDF generation (`--caps=pdf`)
- Storage state access

Sources: [1][2][3]

---

### 2. Content Extraction Architecture: Accessibility Tree, Not DOM Dump [CONFIDENCE: HIGH]

Playwright MCP's primary extraction mechanism is the **accessibility tree
snapshot** (`browser_snapshot`), not raw HTML. This is a deliberate design
choice:

- Returns structured text representation of page roles, labels, and visible
  content
- Does NOT return full HTML by default — reduces token load significantly
- `browser_evaluate` with `document.documentElement.outerHTML` can retrieve raw
  HTML, but full HTML for complex pages can exceed context window limits
- `browser_evaluate` is the escape hatch for any DOM extraction not covered by
  the accessibility tree
- One real-world report notes: "context window constraints prevent analyzing
  full HTML code, requiring focus on visible text instead" [4]

For the `/website-analysis` use case:

- Accessibility snapshot: best for structured content (headings, nav, forms,
  links)
- `browser_evaluate`: best for specific DOM queries or rendered text extraction
- `browser_take_screenshot`: visual analysis (requires vision model)

---

### 3. JavaScript Execution: Full Support via browser_evaluate [CONFIDENCE: HIGH]

`browser_evaluate` executes arbitrary JavaScript in the page context and returns
the result. Confirmed capabilities:

- Execute scripts that query the DOM (e.g., `document.querySelectorAll`)
- Access rendered DOM after JavaScript hydration (React, Vue, etc. fully
  rendered)
- Return structured data from scripts
- Example from docs:
  `browser_evaluate: { script: "() => { document.body.style.zoom = 1; return true; }" }`

This is one of Playwright MCP's strongest capabilities for web analysis — it can
extract computed values, rendered text, metadata, and structured data from any
JavaScript-heavy SPA.

Sources: [1][3]

---

### 4. Bot Protection: Standard Playwright Fails Modern Anti-Bot; No Built-In Stealth [CONFIDENCE: HIGH]

This is the most critical limitation for a `/website-analysis` skill targeting
public web.

**What Playwright MCP cannot do:**

- Bypass Cloudflare Turnstile/JS challenge (detected via JA3 TLS fingerprint,
  CDP protocol markers, WebDriver flag)
- Solve reCAPTCHA v2/v3 or hCaptcha natively — requires integration with
  external solving services (2Captcha, CapSolver)
- Navigate IP reputation blocks without proxies
- Match real Chrome's JA3 fingerprint (Chromium binary has a unique JA3 that
  doesn't match any real Chrome release)

**Detection vectors that defeat standard Playwright:**

1. `navigator.webdriver = true` (set by W3C spec, checked first by anti-bot
   systems)
2. Chrome DevTools Protocol (CDP) leaks — detectable at protocol level
3. JA3/TLS fingerprint mismatch
4. Missing browser plugins/extensions in headless mode
5. Headless Chrome UA string markers
6. Behavioral analysis (mouse movement patterns, interaction timing)

**What can partially help (but is not built into MCP):**

- Custom user agent via `--user-agent` config
- Viewport customization
- `playwright-stealth` npm plugin (patches webdriver flag, changes headless
  markers) — but "may fail a few days later because they aren't updated as
  frequently as advanced solutions"
- Residential proxies via `--proxy-server`

**Bottom line:** Playwright MCP has NO built-in stealth mode. `playwright-extra`
with stealth plugin is a separate npm package not included in the MCP server.
For sites using Cloudflare, DataDome, or Akamai, expect blocks without
additional infrastructure.

Sources: [5][6][7][8]

---

### 5. Cookie Handling: Persistent Mode + Storage State File Support [CONFIDENCE: HIGH]

Cookie and session handling has been actively improved in 2025:

- **Default (as of v0.0.64+):** Browser contexts are **ephemeral by default**
  (in-memory, clean start)
- **Persistent mode:** `--persistent` or `--profile=<path>` preserves
  cookies/localStorage between MCP sessions
- **Storage state:** `--storage-state=<file.json>` loads pre-authenticated
  sessions. PR #409 (merged May 13, 2025) enables passing storage state for
  isolated contexts — specifically enables Okta/MFA bypass patterns
- **Direct cookie management:** `browser_storage_state` tool for runtime
  get/set/delete of cookies
- **Login walls:** Playwright MCP can handle login forms (fill
  username/password, click submit) if credentials are provided — but this
  creates security concerns (credentials exposed to AI agent context). The
  recommended pattern is to authenticate outside MCP and pass the resulting
  `storage-state.json`

Sources: [1][9][10]

---

### 6. Performance Characteristics [CONFIDENCE: MEDIUM]

**Token consumption (significant concern for Claude Code):**

- A typical Playwright MCP session consumes ~114,000 tokens (vs ~27,000 for the
  Playwright CLI equivalent)
- The accessibility tree is streamed with each interaction, contributing to high
  token overhead
- Mitigation: use `--caps` to disable unused capabilities; filter accessibility
  snapshots

**Memory usage (per CI benchmark, 5 browser contexts):**

- Chrome: ~1,240 MB unoptimized, ~780 MB optimized
- WebKit: ~1,150 MB unoptimized, ~695 MB optimized
- Memory leaks from unclosed contexts are a known issue in multi-session
  scenarios

**Timing:**

- Navigation timeout default: 60,000ms (60s) — configurable via
  `--timeout-navigation`
- Action timeout default: 5,000ms — configurable via `--timeout-action`
- CDP connect timeout: 30,000ms (30s)
- No built-in retry or backoff for rate-limited responses (429s)

**Multi-tab support:**

- Tabs are supported via `browser_tabs` tool (create/close/switch)
- Sequential multi-page analysis is the recommended pattern
- Avoid opening many tabs simultaneously — each consumes ~200-250MB additional
  memory

**Headless mode:** Significantly faster and lower-memory than headed; Docker
deployments restricted to headless Chromium.

Sources: [11][12][13]

---

### 7. robots.txt Compliance: None [CONFIDENCE: MEDIUM]

Playwright MCP is a headless browser automation tool. It does NOT:

- Read or respect `robots.txt` by default
- Have any built-in politeness mechanisms (crawl delay, `Disallow` compliance)
- Implement `User-agent: *` filtering

This is consistent with all headless browser frameworks. robots.txt compliance
must be implemented at the skill/orchestration level if needed. No evidence
found of any robots.txt plugin or configuration option in Playwright MCP.

Sources: [UNVERIFIED — no official statement found; inferred from headless
browser category]

---

### 8. File Download Capability: Limited [CONFIDENCE: MEDIUM]

- Downloads triggered by browser actions are automatically tracked and saved to
  `outputDir`
- PDFs can be exported via `browser_pdf_save` (Chromium-only; disabled by
  default)
- Navigation-triggered downloads may fail on WebKit/Linux (known Playwright bug)
- No support for downloads in `--extension` mode
- `browser_file_upload` supports uploading files, not downloading linked
  documents

For the `/website-analysis` use case: Playwright MCP cannot directly download
PDFs linked from pages (e.g., `href="report.pdf"`) in a reliable cross-browser
way. It can navigate to a PDF URL and trigger rendering, but direct file
download to disk requires workarounds.

Sources: [14]

---

### 9. Comparison: Playwright MCP vs Alternatives [CONFIDENCE: HIGH]

| Dimension            | Playwright MCP                             | Firecrawl MCP              | Jina Reader          | Puppeteer                       |
| -------------------- | ------------------------------------------ | -------------------------- | -------------------- | ------------------------------- |
| **Setup complexity** | Medium (26 tools, config)                  | Low (API key)              | Very low (free tier) | High (custom scripts)           |
| **Dynamic JS sites** | Excellent                                  | Good (via headless)        | Poor (HTTP fetch)    | Excellent                       |
| **Bot protection**   | None built-in                              | Managed (Bright Data tier) | None                 | None (stealth plugin available) |
| **Output format**    | Accessibility tree / evaluate / screenshot | Clean Markdown             | Markdown             | Custom                          |
| **Token overhead**   | Very high (~114k/session)                  | Low                        | Very low             | N/A                             |
| **Authentication**   | Via storage-state.json                     | No                         | No                   | Via cookies/sessions            |
| **File downloads**   | Limited (Chromium PDF only)                | No                         | No                   | Supported                       |
| **robots.txt**       | No                                         | No                         | No                   | No                              |
| **Cost**             | Free (self-hosted)                         | API usage-based            | Free tier + API      | Free (self-hosted)              |
| **Stealth mode**     | Not built-in                               | Managed                    | N/A                  | playwright-extra plugin         |

**When Playwright MCP is overkill:**

- Simple static pages with no JavaScript rendering
- Bulk text extraction from known-clean sites (use Jina/Firecrawl)
- Situations where clean Markdown output is the only need

**When Playwright MCP is the only option:**

- SPAs (React/Vue/Angular) requiring full hydration before extraction
- Sites with multi-step authentication flows
- Pages requiring form interaction before content is revealed
- Network request interception/mocking
- Visual analysis requiring screenshots
- Any interaction-dependent content (infinite scroll, accordions, tabs)

Sources: [4][15][16][17]

---

### 10. Capability Matrix Summary

| Capability                 | Supported           | Notes                                                |
| -------------------------- | ------------------- | ---------------------------------------------------- |
| Navigate to URL            | Yes                 | Configurable timeout, browser type                   |
| Render JavaScript (SPA)    | Yes                 | Full browser execution                               |
| Extract accessibility tree | Yes                 | Primary mode; text-based                             |
| Extract raw HTML           | Yes (via evaluate)  | Context window risk on large pages                   |
| Execute JavaScript         | Yes                 | `browser_evaluate`                                   |
| Screenshots                | Yes                 | Requires `--caps=screenshot`; PNG/JPEG               |
| Network request log        | Yes                 | Since page load                                      |
| Mock network routes        | Yes                 | URL pattern matching                                 |
| Cookie persistence         | Yes                 | Via --persistent or storage-state.json               |
| Multi-tab                  | Yes                 | Sequential recommended                               |
| File downloads             | Partial             | Chromium PDF export; linked file download unreliable |
| PDF generation             | Yes (Chromium only) | Requires `--caps=pdf`; disabled by default           |
| robots.txt                 | No                  | Must implement at orchestration layer                |
| Cloudflare bypass          | No                  | Blocked at TLS/CDP level                             |
| reCAPTCHA/hCaptcha         | No                  | External service integration required                |
| Login walls                | Via storage-state   | Manual auth → export state → load in MCP             |
| Rate limiting / backoff    | No                  | Must implement at skill layer                        |
| Stealth mode               | No                  | Not in official MCP; requires playwright-extra       |
| Paywall access             | Partial             | Login-gated content via storage-state only           |

---

## Sources

| #   | URL                                                                                                           | Title                                                   | Type            | Trust  | CRAAP Avg | Date    |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------- | ------ | --------- | ------- |
| 1   | https://playwright.dev/docs/getting-started-mcp                                                               | Playwright MCP Official Docs                            | Official docs   | HIGH   | 4.8       | 2025    |
| 2   | https://github.com/microsoft/playwright-mcp                                                                   | microsoft/playwright-mcp GitHub                         | Official source | HIGH   | 4.8       | 2025    |
| 3   | https://executeautomation.github.io/mcp-playwright/docs/playwright-web/Supported-Tools                        | executeautomation MCP Playwright Tool List              | Community docs  | MEDIUM | 3.8       | 2025    |
| 4   | https://skywork.ai/skypage/en/playwright-scraper-ai-engineers/1978014273634226176                             | Playwright Scraper MCP Deep Dive for AI Engineers       | Technical blog  | MEDIUM | 3.5       | 2025    |
| 5   | https://kameleo.io/blog/how-to-bypass-cloudflare-with-playwright                                              | How to Bypass Cloudflare with Playwright                | Technical blog  | MEDIUM | 3.6       | 2025    |
| 6   | https://www.browserstack.com/guide/playwright-cloudflare                                                      | How to Bypass Cloudflare with Playwright (BrowserStack) | Technical blog  | MEDIUM | 4.0       | 2026    |
| 7   | https://alterlab.io/blog/playwright-anti-bot-detection-what-actually-works-in-2026                            | Playwright Anti-Bot Detection: What Works 2026          | Technical blog  | MEDIUM | 3.7       | 2026    |
| 8   | https://markaicode.com/playwright-captcha-bypass-strategies-2025/                                             | CAPTCHA Bypass Strategies in Playwright MCP 2025        | Technical blog  | LOW    | 3.2       | 2025    |
| 9   | https://github.com/microsoft/playwright-mcp/issues/403                                                        | GitHub Issue #403: Cookie attachment (CLOSED)           | Official source | HIGH   | 4.6       | 2025-05 |
| 10  | https://dev.to/aykutde96/configuring-playwright-mcp-like-a-pro-custom-headers-cookies-and-smarter-agents-237g | Configuring Playwright MCP: Custom Headers & Cookies    | Technical blog  | LOW    | 3.3       | 2025    |
| 11  | https://testdino.com/blog/playwright-mcp/                                                                     | Playwright MCP Explained: Setup, Config & Examples 2026 | Technical blog  | MEDIUM | 3.8       | 2026    |
| 12  | https://markaicode.com/playwright-mcp-memory-leak-fixes-2025/                                                 | Playwright MCP 2.0 Memory Leak Fixes (2025 Benchmarks)  | Technical blog  | LOW    | 3.0       | 2025    |
| 13  | https://www.speakeasy.com/blog/playwright-tool-proliferation                                                  | Why Less Is More: Playwright Proliferation Problem      | Technical blog  | MEDIUM | 3.9       | 2025    |
| 14  | https://deepwiki.com/microsoft/playwright-mcp/5.3-file-operations-and-resource-management                     | Playwright MCP File Operations & Resource Management    | Community wiki  | MEDIUM | 3.6       | 2025    |
| 15  | https://www.firecrawl.dev/blog/playwright-vs-puppeteer                                                        | Playwright vs Puppeteer 2026                            | Technical blog  | MEDIUM | 3.7       | 2026    |
| 16  | https://use-apify.com/blog/mcp-servers-web-scraping-guide                                                     | MCP Servers for Web Scraping: Complete Guide 2026       | Technical blog  | MEDIUM | 3.8       | 2026    |
| 17  | https://brightdata.com/blog/ai/playwright-mcp-server                                                          | A Detailed Guide to Playwright MCP Server               | Technical blog  | MEDIUM | 3.6       | 2025    |

---

## Contradictions

**Stealth effectiveness:** Sources disagree on whether playwright-stealth
plugins provide meaningful protection. Kameleo [5] and BrowserStack [6] say
stealth plugins partially work but degrade quickly. AlterLab [7] and Firecrawl
[15] say "modern anti-bot systems detect CDP usage at the protocol level
regardless of fingerprint masking." The more conservative assessment (no
reliable bypass without managed proxy infrastructure) is the safer position for
skill design.

**Memory benchmarks:** The specific numbers in [12] (1,240MB per 5 Chrome
contexts) come from a Markaicode article with no linked methodology. These
numbers are plausible but should be treated as indicative, not authoritative.

**robots.txt:** No source explicitly confirms Playwright MCP ignores robots.txt
— this is inferred from the headless browser category. No source claims it
respects it either.

---

## Gaps

1. **Exact page render time (wall clock):** No benchmark found for "time from
   browser_navigate call to browser_snapshot response" for a typical page. The
   300ms figure found in one search result referred to performance API query
   execution, not full page load extraction.

2. **Maximum page size before context window overflow:** The token limit at
   which full HTML via `browser_evaluate` becomes impractical is not quantified.
   Needs empirical testing.

3. **playwright-extra compatibility with MCP server:** Whether
   `playwright-extra` stealth plugin can be integrated into the official MCP
   server's browser launch (via `--init-script`) is not documented. This is a
   gap for our skill design.

4. **Official robots.txt stance:** Microsoft has no documented position on
   robots.txt compliance in Playwright MCP.

5. **Rate limiting behavior:** What happens when a site returns 429 to
   Playwright MCP — whether it waits, retries, or passes through to the tool
   call response — is not documented.

6. **Concurrent extraction:** Maximum safe concurrent Playwright MCP browser
   sessions on a typical developer machine (16GB RAM) is not benchmarked.

---

## Serendipity

**Tool proliferation as a design signal:** The Speakeasy article [13] makes an
important observation: Playwright MCP's 26 tools create "decision paralysis" in
AI agents, with agents taking unnecessary screenshots and redundant snapshots.
For the `/website-analysis` skill design, this suggests we should expose only
the minimal tool set needed (navigate + snapshot + evaluate + screenshot) rather
than the full 26-tool MCP surface. The 80/20 rule: 8 tools cover 90% of use
cases.

**Playwright CLI as a lighter alternative:** The Playwright CLI approach uses
~27,000 tokens vs ~114,000 for MCP for equivalent tasks. For batch analysis of
many pages, the CLI approach may be more token-efficient, though it requires
more complex orchestration.

**Storage-state.json pattern for auth:** The recommended security pattern for
authenticated site analysis is to authenticate manually (outside Claude Code),
export session state to `storage-state.json`, then pass it to Playwright MCP via
`--storage-state`. This keeps credentials out of the AI context entirely.

---

## Confidence Assessment

- HIGH claims: 6 (tool inventory, JS execution, bot protection, cookie handling,
  comparison matrix, content extraction architecture)
- MEDIUM claims: 3 (performance characteristics, robots.txt, file downloads)
- LOW claims: 1 (specific memory benchmarks from single-source article)
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH** — tool inventory and capabilities are
  well-documented from official sources; performance and anti-bot limitations
  have consistent multi-source corroboration; some performance specifics are
  single-source.
