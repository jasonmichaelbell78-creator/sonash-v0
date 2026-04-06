# Findings: Website Compliance Gates — robots.txt, ToS, Legal Considerations

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-05
**Sub-Question IDs:** SQ-3

---

## Key Findings

### 1. robots.txt Parsing — Node.js Library Recommendation [CONFIDENCE: HIGH]

The clear winner for Node.js is **`robots-parser` v3.0.1** (npm package by Sam
Clarke).

- RFC 9309 compliant, supports wildcards (`*`) and EOL (`$`) path matching
- API: `robots.isAllowed(url, userAgent)` returns boolean,
  `robots.getCrawlDelay(userAgent)` returns seconds or undefined
- 95 dependent packages in the npm registry; most actively maintained option
- Fixed a known HTTPS port-443 bug in v3.0.1 (Feb 2023)
- Install: `npm i robots-parser`

**Usage pattern for pre-flight:**

```js
import robotsParser from "robots-parser";
// Fetch https://example.com/robots.txt first, then:
const robots = robotsParser("https://example.com/robots.txt", robotsTxtBody);
const allowed = robots.isAllowed(
  "https://example.com/page",
  "WebsiteAnalysisTool"
);
const delay = robots.getCrawlDelay("WebsiteAnalysisTool"); // seconds or undefined
```

Fetching and parsing robots.txt is a single HTTP GET to `<origin>/robots.txt` —
typical round-trip is under 500ms on any responsive server. A 5-second timeout
is more than adequate for pre-flight.

**Alternatives (lower priority):**

- `robots-txt-parser` (promises + caching built in, but less actively
  maintained)
- Python: `urllib.robotparser.RobotFileParser` (stdlib, no install needed)

Sources: [robots-parser GitHub](https://github.com/samclarke/robots-parser),
[npm registry](https://www.npmjs.com/package/robots-parser)

---

### 2. What robots.txt Actually Controls [CONFIDENCE: HIGH]

Per **RFC 9309** (official IETF standard, September 2022):

**Officially standardized directives (MUST be respected):**

- `User-agent` — which crawler the rules apply to
- `Allow` — paths the crawler may access
- `Disallow` — paths the crawler must not access

**Non-standard extensions (MAY be respected, inconsistently supported):**

- `Crawl-delay` — seconds to wait between requests; NOT in RFC 9309 core;
  supported by Bing/Yandex but **explicitly ignored by Google**; supported by
  Anthropic's ClaudeBot; included in `robots-parser` library
- `Sitemap` — informational URL pointing to sitemap; NOT a restriction directive

**Key rules:**

- User-agent matching is **case-insensitive**
- Most-specific agent wins; `*` is the wildcard fallback
- robots.txt caches should not be used for more than 24 hours
- robots.txt is **advisory, not enforceable** — bots can choose to ignore it

Sources: [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html),
[Google robots.txt docs](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt)

---

### 3. AI Agent User-Agent Rules — ClaudeBot, GPTBot, and Others [CONFIDENCE: HIGH]

**Anthropic (verified via official Anthropic Help Center):** | User-Agent |
Purpose | Respects robots.txt? | |---|---|---| | `ClaudeBot` | AI model training
data collection | YES | | `Claude-User` | User-initiated content retrieval | YES
| | `Claude-SearchBot` | Search indexing | YES |

Blocking all Anthropic crawlers:

```
User-agent: ClaudeBot
Disallow: /

User-agent: Claude-User
Disallow: /

User-agent: Claude-SearchBot
Disallow: /
```

Contact for issues: claudebot@anthropic.com

**OpenAI (verified via official OpenAI platform docs, December 2025):** |
User-Agent | Purpose | Respects robots.txt? | |---|---|---| | `GPTBot/1.1` |
Training data collection | YES | | `OAI-SearchBot/1.0` | Search indexing | YES |
| `ChatGPT-User/1.0` | User-initiated requests | **NO** (removed compliance
language Dec 2025) |

**Scale of adoption:** As of mid-2025, ~21% of the top 1,000 websites have
GPTBot rules. ClaudeBot blocked by 69% of sites that have AI crawler rules;
GPTBot blocked by 62%. By November 2023, GPTBot rules appeared on 578,000+
sites.

**Critical note:** OpenAI removed robots.txt compliance language for
`ChatGPT-User` in December 2025. This means user-initiated ChatGPT browsing now
ignores robots.txt. This is a live precedent that adherence to robots.txt is not
universal even among major players.

Sources:
[Anthropic Help Center](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler),
[OpenAI bots overview](https://platform.openai.com/docs/bots),
[Paul Calvano AI bots analysis](https://paulcalvano.com/2025-08-21-ai-bots-and-robots-txt/),
[Cloudflare blog](https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/)

---

### 4. Ethical/Legal Consensus: Should Our Tool Respect robots.txt? [CONFIDENCE: HIGH]

**Yes — strongly and unambiguously.**

Reasons:

1. **Legal risk reduction:** While robots.txt violations are not CFAA violations
   (it's voluntary), violating it in conjunction with ToS violations creates
   compound legal exposure (see hiQ outcome below)
2. **Ethical baseline:** robots.txt is the universal signal for "do not crawl
   this" — ignoring it makes the tool an adversarial agent, not an analysis tool
3. **GDPR signal:** EU regulators increasingly treat robots.txt as a consent
   signal; violating it complicates "legitimate interest" GDPR basis
4. **Practical:** Being blocked (IP ban, CAPTCHA wall) defeats the tool's
   purpose anyway
5. **Creator-first framing:** A creator using this tool to analyze a
   competitor's site must not be exposed to legal risk by the tool itself

**Our tool's user-agent:** The tool should use a transparent, descriptive
user-agent string like `WebsiteAnalysisTool/1.0 (+contact@example.com)` — NOT
spoof as a browser. Many ToS require honesty; spoofing creates additional legal
exposure.

Sources:
[AWS polite crawling best practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/web-crawling-system-esg-data/best-practices.html),
[Apify legal guide](https://blog.apify.com/is-web-scraping-legal/),
[browserless legal analysis](https://www.browserless.io/blog/is-web-scraping-legal)

---

### 5. ToS Detection — Programmatic Approaches [CONFIDENCE: MEDIUM]

There is **no reliable automated method** to detect restrictive ToS before
making any request. ToS detection requires fetching and parsing a ToS page,
which creates a chicken-and-egg problem.

**What can be done in pre-flight (<5 seconds):**

1. **Check for common ToS URL patterns** (fetch `/terms`, `/terms-of-service`,
   `/tos`, `/legal/terms`) and scan for prohibition keywords
2. **Keyword scan approach** (LOW confidence, but fast):
   - Prohibition signals: "automated", "scraping", "crawling", "bot", "spider",
     "data mining", "systematic collection", "non-human"
   - Strong signals: "unauthorized access", "CFAA", "Digital Millennium
     Copyright Act"
3. **Practical limit:** This can only flag _potential_ restrictions, not confirm
   them. A clean scan does NOT mean scraping is permitted.

**Common ToS prohibition language patterns:**

- LinkedIn: "software, devices, scripts, robots, or any other means or processes
  (including crawlers, browser plugins and add-ons)"
- Google: "access or use the Services or any content through the use of any
  automated means"
- Most major platforms: some variant of "automated access", "bots", "scraping"

**Enforcement reality:** Clickwrap ToS (requiring affirmative "I agree") are
legally enforceable. Browsewrap ToS (footer links) are generally NOT enforceable
unless prominently displayed with unambiguous consent action. ToS violations
alone are civil, not criminal — but they strengthen legal claims combined with
other violations.

Sources:
[TermsFeed scraping ToS guide](https://www.termsfeed.com/blog/terms-conditions-stop-screen-scraping/),
[DataDome learning center](https://datadome.co/learning-center/website-terms-conditions-scraping-protection/),
[browserless legal analysis](https://www.browserless.io/blog/is-web-scraping-legal)

---

### 6. Legal Landscape — CFAA Boundaries [CONFIDENCE: HIGH]

**hiQ Labs v. LinkedIn (Ninth Circuit):** The most important US precedent:
accessing **publicly available** data does not constitute "unauthorized access"
under the CFAA. The CFAA was designed for criminal hacking, not competitor data
analysis.

**BUT the final outcome is cautionary:** After 5+ years of litigation, hiQ
settled in 2022 — paying $500,000 in damages, agreeing to destroy all scraped
data, accepting a permanent injunction. LinkedIn won on **contract/ToS claims**,
not CFAA. The CFAA ruling helped hiQ survive the injunction fight but not the
ultimate case.

**Key CFAA boundary:**

- Public data behind no authentication barrier: NOT a CFAA violation
- Data behind authentication (login walls): Accessing without permission IS a
  CFAA violation
- Bypassing CAPTCHAs, rate limits, or IP blocks: Legal grey zone — courts have
  not uniformly ruled on this

**Computer Fraud and Abuse Act limits for our tool:**

- Our tool must NEVER access password-protected content
- Our tool must NEVER bypass authentication systems
- CAPTCHA presentation should be treated as a STOP signal

Sources:
[Quinn Emanuel legal landscape](https://www.quinnemanuel.com/the-firm/publications/the-legal-landscape-of-web-scraping/),
[hiQ Wikipedia](https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn),
[Jenner Block analysis](https://www.jenner.com/en/news-insights/publications/client-alert-data-scraping-in-hiq-v-linkedin-the-ninth-circuit-reaffirms-narrow-interpretation-of-cfaa),
[FBM analysis](https://www.fbm.com/publications/what-recent-rulings-in-hiq-v-linkedin-and-other-cases-say-about-the-legality-of-data-scraping/)

---

### 7. Copyright Implications — Caching and Fair Use [CONFIDENCE: MEDIUM]

**The fair use framework (four factors for US courts):**

1. Purpose and character of use (transformative? commercial?)
2. Nature of the copyrighted work (factual vs. creative)
3. Amount and substantiality of the portion used
4. Effect on the market for the original work

**For our tool (analysis, not redistribution):**

- Caching extracted content **locally for analysis** = generally defensible
  under fair use (analogous to Google Books caching full books)
- The key: our tool generates **analysis outputs** (not republished source
  content)
- Factual data (prices, meta tags, link structure, load times) is NOT
  copyright-protected
- HTML as a compiled structure: copyright applies to creative expression, not
  factual structure

**Weak points:**

- Caching full page HTML with substantial creative content (article text,
  images) locally is riskier
- If cached content is ever shared, transmitted, or stored beyond the analysis
  session, risk increases substantially
- Thomson Reuters v. Ross (2025): court ruled AI training use of proprietary
  legal headnotes was NOT fair use when it competed with the original market —
  relevant for any tool that caches and re-uses content at scale

**Design recommendation:** Cache only what is needed for analysis (structure,
meta, links, performance metrics) — not verbatim page content. If full HTML must
be cached, make it session-scoped and auto-deleted.

Sources:
[Neudata copyright analysis](https://www.neudata.co/blog/web-scraping-and-copyright-law),
[Apify fair use analysis](https://blog.apify.com/is-web-scraping-legal/),
[University of Michigan copyright guide](https://ai.umich.edu/blog-posts/grabbing-data-from-the-web-our-copyright-guide-outlines-what-you-need-to-know-about-web-scraping-web-crawling-and-apis/),
[ScraperAPI 2026 guide](https://www.scraperapi.com/web-scraping/is-web-scraping-legal/)

---

### 8. GDPR Implications — European Sites [CONFIDENCE: HIGH]

**GDPR applies to our tool if it analyzes any EU site that contains personal
data of EU residents** — regardless of where our tool runs. Penalties up to €20
million or 4% of global revenue.

**What counts as personal data in web context:**

- Names, email addresses, phone numbers
- User reviews, comments, author bylines
- Profile photos, location data
- IP addresses (yes, even these)
- Any combination that identifies a natural person

**The "publicly available" trap:** GDPR explicitly states that public
availability does not remove personal data protection. This is the opposite of
CFAA doctrine. An EU site publishing user reviews is still subject to GDPR —
scraping those reviews is a GDPR data processing activity.

**Enforcement actions (2024-2025):**

- France CNIL fined KASPR €240,000 (Dec 2024) for scraping LinkedIn contact data
  — 160 million contacts
- Clearview AI settled a US class action for ~$51 million (2025) — facial
  recognition from scraped images

**Design recommendations:**

- Our tool should NOT extract personal data fields (user reviews with names,
  profile photos, email addresses)
- Analysis of structural/technical elements (page speed, meta tags, link graph,
  design patterns) is lower GDPR risk
- If a site is clearly an EU-targeted site with user-generated content, warn the
  user about GDPR exposure

Sources:
[Zyte EU AI scraping guide](https://www.zyte.com/blog/ai-personal-data-scraping-europe-guidance/),
[Morgan Lewis GDPR position](https://www.morganlewis.com/pubs/2024/05/eu-regulator-adopts-restrictive-gdpr-position-on-data-scraping-impacting-ai-technologies),
[Medium GDPR €20M article](https://medium.com/deep-tech-insights/web-scraping-in-2025-the-20-million-gdpr-mistake-you-cant-afford-to-make-07a3ce240f4f),
[IAPP EU scraping state](https://iapp.org/news/a/the-state-of-web-scraping-in-the-eu)

---

### 9. "Analyzing" vs. "Scraping" — The Legal Distinction [CONFIDENCE: MEDIUM]

Courts and regulators do NOT use a bright-line definition. The distinction is
purpose and effect, not method:

| Factor                | Analysis (lower risk)               | Scraping (higher risk)           |
| --------------------- | ----------------------------------- | -------------------------------- |
| Purpose               | Research, evaluation, improvement   | Data monetization, republication |
| Output                | Derived insights, metrics, reports  | Copies of original content       |
| Volume                | Limited pages for specific analysis | Bulk systematic collection       |
| Retention             | Session-scoped, analysis-only       | Stored dataset                   |
| Personal data         | Minimized or none                   | Included systematically          |
| Competing with source | No                                  | Yes (market substitution)        |

**Practical test for our tool:** If the output could substitute for visiting the
original site, it's high-risk. If the output is a performance report or design
analysis that couldn't replace the site, it's lower-risk.

The EU DSM Directive (2019) specifically creates a Text and Data Mining
exception for research institutions with lawful access — our tool used by a
developer/creator for site analysis fits within this spirit even if not the
explicit carve-out.

Sources: [Apify legal guide](https://blog.apify.com/is-web-scraping-legal/),
[Quinn Emanuel landscape](https://www.quinnemanuel.com/the-firm/publications/the-legal-landscape-of-web-scraping/),
[Infomineo compliance guide](https://infomineo.com/services/data-analytics/is-web-scraping-legal-laws-compliance-best-practices/)

---

### 10. Rate Limiting Best Practices [CONFIDENCE: HIGH]

**Crawl-delay by context:** | Site Type | Recommended Delay | |---|---| |
Small/medium sites (general default) | 10-15 seconds between requests | | Large
sites with robust infrastructure | 1-2 seconds | | Explicit crawl-delay in
robots.txt | Honor exactly as specified | | No robots.txt crawl-delay | Default
to 2-5 seconds for analysis tools |

**429 Response handling:**

- On first 429: pause and wait (minimum 60 seconds before retry)
- On repeated 429s (3+): surface to user, do not auto-retry
- Log 429 timestamps for adaptive throttling

**Concurrent request limits:**

- Maximum 1 concurrent request per domain during analysis
- Minimum 100ms between any requests (even for large sites)
- Maximum delay ceiling: 2 minutes (prevent indefinite stall)

**Rate limit signals to detect:**

1. HTTP 429 (explicit rate limit)
2. HTTP 503 (server overload)
3. CAPTCHA page in response body
4. Response time dramatically increasing (server stress signal)
5. Connection reset / TCP timeout (aggressive blocking)

**Polite crawling pattern for our tool:**

```
1. Fetch robots.txt → extract crawl-delay for our UA or wildcard
2. Use max(specified_delay, tool_minimum_delay) between requests
3. Monitor response times — if p95 > 3x baseline, increase delay
4. On 429: back off exponentially (60s, 120s, 240s)
5. On 403 persistent: stop and warn user
```

Sources:
[AWS polite crawling guide](https://docs.aws.amazon.com/prescriptive-guidance/latest/web-crawling-system-esg-data/best-practices.html),
[Firecrawl polite crawling](https://www.firecrawl.dev/glossary/web-crawling-apis/what-is-polite-crawling),
[Sitebulb crawl responsibly guide](https://sitebulb.com/resources/guides/how-to-crawl-responsibly-the-need-for-less-speed/),
[AI Crawler rate limiting guide](https://aicrawlercheck.com/blog/ai-crawler-rate-limiting-guide)

---

### 11. Pre-Flight Gate Design [CONFIDENCE: MEDIUM-HIGH]

Based on findings above, the recommended pre-flight gate sequence:

**Hard-block conditions (stop, do not proceed without explicit user override):**

1. `robots.txt` explicitly disallows our user-agent or wildcard for the target
   URL
2. Site returns 403 or connection refused on robots.txt fetch (potential hostile
   signal)
3. Login/auth wall detected on target page (CFAA boundary)
4. CAPTCHA presented on initial fetch

**Warn conditions (surface to user, require acknowledgment to proceed):**

1. No `robots.txt` exists at `<origin>/robots.txt` (HTTP 404) — no signal either
   way
2. robots.txt exists but has no rules for our user-agent (only `*` rules apply)
3. ToS keyword scan detects "automated", "scraping", "bot" prohibition language
4. Site appears to be EU-hosted with user-generated content (GDPR flag)
5. Site appears to be a major platform with known anti-scraping posture
   (LinkedIn, Twitter, etc.)
6. Crawl-delay specified as >30 seconds (makes analysis impractical; warn user)

**Informational (log but do not block):**

1. Crawl-delay specified — inform user of pacing
2. Sitemap URL found in robots.txt — offer to user
3. Partial disallow (our specific user-agent denied for some paths)

**Override mechanism:**

- User must explicitly confirm with acknowledgment text (not just a button
  click) to override hard-block
- Log override decision with timestamp and reason
- Do NOT offer override for login walls / authenticated content (CFAA boundary)

**Timing target:**

- robots.txt fetch: <500ms typical, 2s timeout
- ToS keyword scan: <2s (fetch + regex scan)
- Full pre-flight: <5 seconds total

Sources: Synthesized from
[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html),
[Apify legal guide](https://blog.apify.com/is-web-scraping-legal/),
[AWS best practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/web-crawling-system-esg-data/best-practices.html),
[Quinn Emanuel landscape](https://www.quinnemanuel.com/the-firm/publications/the-legal-landscape-of-web-scraping/)

---

## Sources

| #   | URL                                                                                                                                                         | Title                                              | Type                                  | Trust       | CRAAP     | Date         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------- | ----------- | --------- | ------------ |
| 1   | https://www.rfc-editor.org/rfc/rfc9309.html                                                                                                                 | RFC 9309: Robots Exclusion Protocol                | Official standard                     | HIGH        | 5/5/5/5/5 | Sep 2022     |
| 2   | https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler                             | Anthropic: Does Anthropic crawl data from the web? | Official vendor doc                   | HIGH        | 5/5/5/5/5 | 2024         |
| 3   | https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt                                                                               | Google: How to interpret robots.txt                | Official vendor doc                   | HIGH        | 5/5/5/5/5 | 2024         |
| 4   | https://github.com/samclarke/robots-parser                                                                                                                  | robots-parser GitHub                               | Official tool docs                    | HIGH        | 4/5/4/5/5 | Feb 2023     |
| 5   | https://www.quinnemanuel.com/the-firm/publications/the-legal-landscape-of-web-scraping/                                                                     | Quinn Emanuel: Legal Landscape of Web Scraping     | Legal analysis                        | HIGH        | 3/5/5/4/4 | 2024         |
| 6   | https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn                                                                                                          | hiQ Labs v. LinkedIn - Wikipedia                   | Reference                             | MEDIUM-HIGH | 4/5/4/4/5 | Updated 2024 |
| 7   | https://www.jenner.com/en/news-insights/publications/client-alert-data-scraping-in-hiq-v-linkedin-the-ninth-circuit-reaffirms-narrow-interpretation-of-cfaa | Jenner & Block: hiQ v LinkedIn CFAA analysis       | Legal analysis                        | HIGH        | 3/5/5/5/4 | 2022         |
| 8   | https://paulcalvano.com/2025-08-21-ai-bots-and-robots-txt/                                                                                                  | AI Bots and Robots.txt                             | Developer research                    | MEDIUM-HIGH | 5/5/4/4/5 | Aug 2025     |
| 9   | https://docs.aws.amazon.com/prescriptive-guidance/latest/web-crawling-system-esg-data/best-practices.html                                                   | AWS: Best Practices for Ethical Web Crawlers       | Official vendor docs                  | HIGH        | 4/5/4/5/5 | 2024         |
| 10  | https://blog.apify.com/is-web-scraping-legal/                                                                                                               | Apify: Is web scraping legal?                      | Developer blog (authoritative vendor) | MEDIUM-HIGH | 4/5/4/4/4 | 2025         |
| 11  | https://www.zyte.com/blog/ai-personal-data-scraping-europe-guidance/                                                                                        | Zyte: AI personal data scraping EU guidance        | Industry analysis                     | MEDIUM      | 4/5/3/4/4 | 2024         |
| 12  | https://www.browserless.io/blog/is-web-scraping-legal                                                                                                       | Browserless: Is web scraping legal?                | Developer blog                        | MEDIUM      | 4/5/3/4/4 | 2025         |
| 13  | https://www.firecrawl.dev/glossary/web-crawling-apis/what-is-polite-crawling                                                                                | Firecrawl: What is polite crawling?                | Tool vendor glossary                  | MEDIUM      | 4/5/3/4/4 | 2024         |
| 14  | https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/                                                                       | Cloudflare: Who's crawling your site in 2025       | Infrastructure vendor research        | HIGH        | 5/5/4/5/5 | 2025         |
| 15  | https://iapp.org/news/a/the-state-of-web-scraping-in-the-eu                                                                                                 | IAPP: State of web scraping in the EU              | Privacy law professional org          | HIGH        | 4/5/5/4/5 | 2024         |
| 16  | https://www.morganlewis.com/pubs/2024/05/eu-regulator-adopts-restrictive-gdpr-position-on-data-scraping-impacting-ai-technologies                           | Morgan Lewis: GDPR position on data scraping       | Legal firm analysis                   | HIGH        | 4/5/5/5/5 | May 2024     |
| 17  | https://www.scraperapi.com/web-scraping/is-web-scraping-legal/                                                                                              | ScraperAPI: Is web scraping legal? 2026 guide      | Developer blog                        | MEDIUM      | 5/5/3/3/4 | 2025         |
| 18  | https://ppc.land/openai-revises-chatgpt-crawler-documentation-with-significant-policy-changes/                                                              | OpenAI revises ChatGPT crawler documentation       | Tech news                             | MEDIUM      | 5/5/3/3/4 | Dec 2025     |

---

## Contradictions

**1. Google ignores crawl-delay; Anthropic and Bing honor it.** RFC 9309 does
not standardize crawl-delay. Google explicitly ignores it. Anthropic explicitly
supports it. Bing and Yandex support it but interpret it differently (time
window vs. fixed delay). Our tool should parse and honor crawl-delay, but
document that it is not universally enforced.

**2. ChatGPT-User no longer respects robots.txt (Dec 2025).** This directly
contradicts the widespread assumption that major AI companies universally
respect robots.txt. OpenAI removed compliance language for user-initiated
ChatGPT browsing. While our tool is not ChatGPT, this signals that the voluntary
compliance regime is fragmenting. Any claim that "major AI companies all respect
robots.txt" is now false.

**3. Fair use for analysis vs. Thomson Reuters v. Ross (2025).** The Google
Books case established that large-scale caching for transformative purposes is
fair use. The Thomson Reuters ruling (2025) found that AI training on
proprietary content that competes with the source market is NOT fair use. These
cases can be reconciled (our tool does not republish or compete), but the legal
landscape is actively evolving. Fair use for caching during analysis is
defensible but not guaranteed.

**4. CFAA "public data" protection vs. ToS breach liability.** hiQ won the CFAA
argument but lost on contract claims. The Ninth Circuit's ruling protects
against criminal CFAA liability for public data, but ToS violations can still
create civil liability. These two legal theories are complementary from the
plaintiff's perspective and must both be addressed.

---

## Gaps

1. **No comprehensive, up-to-date ToS keyword detection corpus.** I found
   indicative patterns but no authoritative list of required keywords that
   definitively indicate "this site prohibits automated access." An NLP-based
   approach would need training data.

2. **No official ruling on whether respecting robots.txt creates safe harbor.**
   It reduces risk but courts have not established that robots.txt compliance
   alone immunizes a scraper from ToS breach claims.

3. **The OpenAI ChatGPT-User robots.txt reversal (Dec 2025) is recent and its
   legal implications are unexplored.** Does ignoring robots.txt for
   user-initiated AI browsing create liability for OpenAI? Unknown.

4. **Country-specific laws beyond GDPR and CFAA.** This research focused on US
   and EU. Australia's Privacy Act, Canada's PIPEDA, and Brazil's LGPD all have
   implications for scraping personal data but were not deeply investigated.

5. **Practical robots.txt fetch failure modes.** What if robots.txt returns a
   5xx error? RFC 9309 says "treat as no restrictions" but this is a security
   risk if the site intends to restrict access. This edge case needs explicit
   design guidance.

6. **No empirical data on ToS detection accuracy.** The keyword-scan approach
   for ToS detection is based on reasoning, not tested recall/precision. A false
   negative (missing a prohibition) creates legal exposure for users.

---

## Serendipity

**llms.txt emerging standard (2025):** Multiple sources referenced a new
`llms.txt` convention (analogous to robots.txt but specifically for LLM/AI
tools) that some sites are beginning to adopt. This is not yet a standard but
could be a forward-looking signal for AI-specific tool compliance checks. If
this gains traction, our tool should check for it.

**robots.txt as GDPR consent signal:** EU regulators are increasingly treating
robots.txt `Disallow` as a machine-readable opt-out under GDPR's legitimate
interest framework. This strengthens the ethical/legal case for treating
robots.txt violations more seriously than "just a voluntary protocol."

**The EU Digital Services Act (DSA):** The DSA imposes new obligations on very
large platforms (VLPs) in the EU, including data access requirements for
researchers. This creates a carve-out where academic/research scraping of VLPs
might be legally protected even if their ToS prohibits it — but only for
qualified researchers, not developer tools.

---

## Confidence Assessment

- HIGH claims: 6 (robots.txt library selection, RFC 9309 directives,
  Anthropic/OpenAI UA strings, CFAA boundaries, rate limiting pattern, GDPR
  applicability)
- MEDIUM-HIGH claims: 2 (should-we-respect-robots.txt consensus, pre-flight gate
  design)
- MEDIUM claims: 3 (ToS detection approach, analysis vs scraping distinction,
  fair use for caching)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The legal findings are grounded in verifiable case law and regulatory guidance.
The tool design recommendations are synthesized from multiple authoritative
sources. The primary uncertainty is the fast-moving legal landscape (Thomson
Reuters 2025, OpenAI Dec 2025 reversal) and the inherent unpredictability of
fair use analysis in novel contexts.
