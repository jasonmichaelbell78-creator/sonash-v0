# Gap Finding: Rate Limiting, Respectful Crawling, and Cloudflare Detection

**Gap type:** scope-gap (rate limiting / crawl-delay) + verification-gap
(Cloudflare detection signals) **Profile used:** web **Confidence:** HIGH

---

## Finding

Two design-critical gaps were identified and filled. The original research
covered robots.txt allow/disallow compliance but entirely omitted:

1. How crawl-delay values from robots.txt should be honored at runtime
2. What request spacing and concurrency limits constitute polite crawling
3. How to detect Cloudflare-protected sites before attempting extraction
4. What fail-fast behavior is correct when Cloudflare is confirmed

Both gaps are now filled with HIGH-confidence findings from official
documentation and cross-referenced practitioner sources.

---

## Section A: Rate Limiting and Respectful Crawling

### Crawl-Delay Directive

The `Crawl-delay` directive in robots.txt is an informal extended directive, NOT
part of the official Robots Exclusion Protocol RFC. Google ignores it entirely.
Bing treats the value as a per-window limit (max 1 request per N seconds).
Yandex treats it as a minimum wait between sequential requests. For a Claude
Code skill acting as a non-search-engine bot, the Yandex interpretation is the
most conservative and most appropriate: treat `Crawl-delay: N` as "wait at least
N seconds between requests to this domain."

Crawl-delay is effectively a site owner's signal that they are sensitive to
request volume. It should always be read and respected when present, even though
compliance is voluntary.

### Standard Delay Values

Sources converge on the following scale for polite crawling:

| Site type                                  | Recommended delay between requests |
| ------------------------------------------ | ---------------------------------- |
| Small or medium site (no crawl-delay)      | 10-15 seconds                      |
| Large site with explicit crawl permissions | 1-2 seconds                        |
| Site with Crawl-delay directive            | max(10s, crawl-delay value)        |
| After receiving 429 Too Many Requests      | Retry-After header value, or 60s   |

The minimum safe floor is 0.1 seconds (prevents accidental DoS). The maximum cap
for exponential backoff is 60 seconds before abandoning.

### HTTP 429 and Retry-After Handling

When a server returns 429, it typically includes a `Retry-After` header with
either a seconds-to-wait value or an HTTP date timestamp. Correct behavior:

1. Read `Retry-After` header
2. Wait that duration (or a default of 60 seconds if the header is absent)
3. Retry the request up to 3 times before abandoning
4. Never retry in a tight loop without delay

If the crawler continuously receives 403 (Forbidden), stop crawling that domain
entirely for the session. Unlike 429, 403 is not a rate signal - it is an access
denial.

### Concurrency Limits

For a Claude Code skill operating in Site Crawl or Expedition mode, the Crawl4AI
defaults provide a useful reference baseline:

- Default base delay: 1-3 seconds (randomized to avoid predictable patterns)
- Default max concurrent sessions: 10 (MemoryAdaptiveDispatcher)
- For sensitive or small sites: reduce to 3-5 concurrent tasks, 2-5s base delay

A skill operating through Playwright MCP (single browser context, sequential
navigation) has inherent single-thread serialization, making concurrency limits
less relevant. The key constraint is inter-page delay, not parallelism.

### Cross-Session Domain Tracking

The research did not find a formal standard for cross-session crawl-delay
enforcement. The practical pattern from responsible crawler implementations is:

- Track the last-request timestamp per domain in a session-scoped store
- Do not enforce cross-session delay at the crawl client level (this would
  require persistent state beyond a single skill invocation)
- Document this limitation explicitly: the skill cannot know whether the same
  domain was visited in a prior session from a different machine or locale

---

## Section B: Cloudflare Detection and Fail-Fast

### Detection Signals (Three Tiers)

**Tier 1 - Definitive (HTTP response headers):**

- `cf-mitigated: challenge` - Set ONLY when Cloudflare is actively serving a
  challenge page (Managed Challenge, JS Challenge, or Turnstile CAPTCHA). This
  is the authoritative signal per official Cloudflare documentation. Any
  response with this header is NOT real page content.
- `cf-ray: <hash>-<IATA>` - Present on every response that passed through
  Cloudflare's network, including normal non-challenged responses. Format is
  `rayID-datacenterCode` (e.g., `230b030023ae2822-SJC`). Presence alone does NOT
  mean content is blocked, but confirms Cloudflare is in the path.

**Tier 2 - Confirmatory (combinatory):**

- `server: cloudflare` - Indicates response was served by Cloudflare's edge
  network. Combined with `cf-ray`, this is a HIGH-confidence identification that
  Cloudflare protects the domain.
- `content-type: text/html` on a resource type that should be otherwise (e.g., a
  JSON API endpoint returning HTML) is a secondary signal that a challenge page
  was served instead of real content.

**Tier 3 - Content-based (fallback):**

- Challenge page HTML contains recognizable patterns:
  `<title>Just a moment...</title>` or `<title>Attention Required!</title>`
- Body text includes phrases like "Checking if the site connection is secure",
  "Enable JavaScript and cookies to continue", or "Verifying you are human"
- These are brittle and should only be used if HTTP header inspection is not
  available (e.g., when Playwright intercepts at the page level)

### Cloudflare Protection Tiers (What Cannot Be Bypassed)

Not all Cloudflare protection is equal. The skill must distinguish:

| Protection type        | Behavior with Playwright MCP       | Bypassable?                        |
| ---------------------- | ---------------------------------- | ---------------------------------- |
| Standard CDN / WAF     | Transparent pass-through           | N/A (no block)                     |
| Bot Fight Mode (basic) | May block headless Chromium        | Sometimes, with stealth headers    |
| Managed Challenge (JS) | Serves challenge page, js required | Rarely; timing/fingerprint issue   |
| Turnstile CAPTCHA      | Interactive CAPTCHA served         | No - requires human or paid solver |

Playwright MCP operating in default headless mode exposes `navigator.webdriver`
and DevTools Protocol signatures. Cloudflare's bot management detects these
within seconds. The `puppeteer-stealth` workaround was deprecated by its
maintainers in February 2025 and is now reliably detected.

### FlareSolverr Status (2025-2026)

FlareSolverr is effectively end-of-life for this use case:

- Officially deprecated by maintainers in 2025
- CAPTCHA solvers nonfunctional as of January 2026
- Cloudflare continuously updates detection to defeat it

Active alternatives exist (Byparr using Camoufox, Solvearr using TLS fingerprint
tampering) but all require self-hosted infrastructure, introduce legal and
ethical ambiguity, and are outside the scope of a Claude Code skill that should
be deployable without external service dependencies.

For the website-analysis skill, FlareSolverr and its alternatives should NOT be
integrated. The correct design is fail-fast.

### Correct Fail-Fast Behavior

When Cloudflare challenge detection fires, the skill must:

1. Check `cf-mitigated` header first (authoritative)
2. If not available (Playwright intercepts at DOM level), check page title and
   body text for challenge markers
3. Return a structured error result immediately, do NOT:
   - Attempt to parse the challenge HTML as content
   - Retry with the same tool (Playwright MCP will fail identically)
   - Fall back to a static extractor (it will receive the same challenge HTML)
4. Surface to the user: "This site is protected by Cloudflare Turnstile.
   Automated extraction is not possible. Use your browser manually or skip this
   site."

The 16% prevalence figure (Cloudflare protecting ~16% of top-1M sites) means
this is not an edge case. It is a first-class failure mode that needs a
dedicated error code in the skill's result schema.

---

## Evidence

**Rate Limiting:**

- [AWS Prescriptive Guidance: Best practices for ethical web crawlers](https://docs.aws.amazon.com/prescriptive-guidance/latest/web-crawling-system-esg-data/best-practices.html) -
  T1 source, specific delay values, error handling
- [Firecrawl Glossary: What is polite crawling](https://www.firecrawl.dev/glossary/web-crawling-apis/what-is-polite-crawling) -
  delay ranges, robots.txt priority
- [Crawl4AI Multi-URL Crawling documentation](https://docs.crawl4ai.com/advanced/multi-url-crawling/) -
  RateLimiter class defaults, concurrency controls
- [Firecrawl Glossary: What is a 429 error](https://www.firecrawl.dev/glossary/web-scraping-apis/what-is-429-error-web-scraping) -
  Retry-After handling
- [Conductor: Crawl-delay FAQ](https://www.conductor.com/academy/robotstxt/faq/crawl-delay-10/) -
  Google ignores, Bing/Yandex support

**Cloudflare Detection:**

- [Cloudflare Docs: Detect a Challenge Page response](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/) -
  T1 official source: `cf-mitigated: challenge` is the authoritative signal
- [Cloudflare Docs: HTTP headers reference](https://developers.cloudflare.com/fundamentals/reference/http-headers/) -
  T1 official: cf-ray, server: cloudflare, cf-cache-status
- [Cloudflare Docs: Cloudflare Ray ID](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/) -
  Ray ID format and interpretation
- [Scrapfly: How to Bypass Cloudflare Anti-Scraping (2025)](https://scrapfly.io/blog/posts/how-to-bypass-cloudflare-anti-scraping) -
  detection failure modes, navigator.webdriver exposure
- [ZenRows: How to Bypass Cloudflare with Playwright (2026)](https://www.zenrows.com/blog/playwright-cloudflare-bypass) -
  Playwright limitations
- [Playwright GitHub issue #23884: Cloudflare Turnstile Bypass](https://github.com/microsoft/playwright/issues/23884) -
  community documentation of failure

**FlareSolverr:**

- [FlareSolverr GitHub repository](https://github.com/FlareSolverr/FlareSolverr) -
  deprecation status
- [DiCloak: 2025 FlareSolverr Review](https://dicloak.com/blog-detail/2025-flaresolverr-review-overcoming-cloudflare-for-seamless-web-scraping) -
  nonfunctional CAPTCHA solvers as of Jan 2026
- [Round Proxies: How to use Byparr in 2026](https://roundproxies.com/blog/byparr/) -
  active alternative using Camoufox

---

## Claims

- **[C-G1-01]** The `cf-mitigated: challenge` HTTP response header is the
  authoritative signal that a Cloudflare challenge page was served; it is
  present on ALL challenge types regardless of requested resource type.
  (confidence: HIGH - T1 Cloudflare official documentation)

- **[C-G1-02]** The `cf-ray` header is present on every response passing through
  Cloudflare's network, including non-challenged responses; its presence alone
  indicates Cloudflare is in the path but does NOT indicate blocking.
  (confidence: HIGH - T1 Cloudflare official documentation)

- **[C-G1-03]** `server: cloudflare` combined with `cf-ray` provides
  HIGH-confidence identification of a Cloudflare-protected domain. (confidence:
  HIGH - cross-referenced official + practitioner sources)

- **[C-G1-04]** Cloudflare Turnstile challenge pages cannot be bypassed by
  Playwright MCP operating in default headless mode; the tool returns challenge
  HTML, not target content. This is a confirmed design-level constraint, not a
  configuration issue. (confidence: HIGH - multiple practitioner sources, GitHub
  issue #23884)

- **[C-G1-05]** FlareSolverr is end-of-life as a bypass option: deprecated by
  maintainers in 2025, CAPTCHA solvers nonfunctional as of January 2026. It must
  not be integrated into the website-analysis skill. (confidence: HIGH -
  GitHub + review sources cross-referenced)

- **[C-G1-06]** For polite crawling of small/medium sites without an explicit
  `Crawl-delay` directive, 10-15 seconds between requests to the same domain is
  the standard range used by responsible crawlers. (confidence: HIGH - AWS
  prescriptive guidance + Firecrawl glossary)

- **[C-G1-07]** When `Crawl-delay: N` is present in robots.txt, a
  non-search-engine bot should treat it as "wait at least N seconds between
  sequential requests to this domain" (Yandex interpretation, most
  conservative). (confidence: HIGH - Conductor + Wikipedia + Firecrawl
  cross-referenced)

- **[C-G1-08]** HTTP 429 responses must trigger a wait of the `Retry-After`
  header value (seconds or HTTP date) before retrying, with a fallback default
  of 60 seconds if the header is absent; max 3 retries before abandoning.
  (confidence: HIGH - Crawl4AI docs + Firecrawl 429 glossary)

- **[C-G1-09]** HTTP 403 Forbidden is NOT a rate limit signal; it indicates
  access denial and should cause the skill to stop crawling that domain for the
  session rather than retry. (confidence: HIGH - AWS prescriptive guidance)

- **[C-G1-10]** Cloudflare protects approximately 16% of top-1M websites, making
  Cloudflare challenge detection a first-class failure mode in the skill design,
  not an edge case. (confidence: MEDIUM - figure from earlier research D1b;
  cross-referenced with Cloudflare traffic surge data but specific 16% figure
  not re-verified by this gap search)

- **[C-G1-11]** The website-analysis skill cannot enforce cross-session
  crawl-delay because it has no access to persistent state about when a domain
  was last visited in a prior skill invocation. This is an inherent limitation
  to document, not a bug to fix. (confidence: HIGH - architectural reasoning, no
  counter-evidence found)

- **[C-G1-12]** Challenge page HTML contains reliable content-level markers
  (`<title>Just a moment...</title>`, body text "Verifying you are human") that
  can be used as fallback detection when HTTP headers are not accessible at the
  Playwright intercept layer. (confidence: MEDIUM - practitioner consensus, not
  tested programmatically)
