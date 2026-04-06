# Web Content Extraction Tool Comparison Test

**Date:** 2026-04-06 **Purpose:** Compare 3 extraction tools to determine the
best pipeline for a `/website-analysis` skill **Test Environment:** Windows 11,
pandoc 3.9.0.2, Playwright MCP, Claude Code WebFetch

---

## Test URLs

| #   | URL                                                                                        | Type                       | Complexity                                          |
| --- | ------------------------------------------------------------------------------------------ | -------------------------- | --------------------------------------------------- |
| 1   | https://www.joshwcomeau.com/css/custom-css-reset/                                          | Tech blog with code blocks | SSR Next.js, interactive widgets, styled-components |
| 2   | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map | MDN documentation          | Server-rendered, structured reference docs          |
| 3   | https://react.dev/learn                                                                    | React tutorial             | SSR Next.js, Sandpack embeds, React-built           |

---

## Per-URL Results

### URL 1: Josh Comeau Blog (Custom CSS Reset)

#### Extractor A: WebFetch

**Result:** Excellent. Returned a well-structured summary with all 10 CSS reset
rules explained, full heading hierarchy, code blocks reconstructed, changelog
entries, and external links. Captured metadata (title, publish date, last
updated). Identified interactive elements like the box-sizing quiz.

**Key observation:** Despite being told "do not summarize," WebFetch still ran
content through a model and produced a synthesis rather than raw content. The
output reads like a high-quality article summary -- useful for understanding,
but not a faithful reproduction of the original page structure.

**Sample output (first ~30 lines):**

```
# A Modern CSS Reset by Josh W. Comeau - Full Page Analysis

## Page Metadata
- **Title:** A Modern CSS Reset - Josh W. Comeau
- **URL:** joshwcomeau.com/css/custom-css-reset/
- **Published:** November 23, 2021
- **Last Updated:** March 18, 2026
- **Category:** CSS
- **Content Type:** Blog Post/Tutorial

## Page Structure & Headings

### Main Headings
1. Introduction
2. The CSS Reset
3. 1. Box-sizing model
...
```

#### Extractor B: curl + pandoc

**Result:** FAILURE. Pandoc returned 0 usable lines of markdown (1 line total --
a TagOpen error). The raw HTML was 496,489 bytes and is SSR (headings exist in
the HTML), but pandoc choked on the complex styled-components class names and
custom HTML attributes. Converting to plain text also produced 0 lines.

**Root cause:** Pandoc's HTML parser cannot handle the heavy CSS-in-JS class
soup and interactive widget markup that Josh Comeau's site uses. The HTML is
technically server-rendered, but too complex for pandoc's parser.

**Headers captured successfully:**

```
HTTP/1.1 200 OK
Content-Length: 496489
Content-Type: text/html; charset=utf-8
Server: Vercel
X-Nextjs-Prerender: 1
```

**Sample output (the only line):**

```
TagOpen "button" [("style","transform:rotate(0deg);opacity:0.7"),("class","w11udlg3 ah084m5")]
```

#### Extractor C: Playwright MCP

**Result:** Good structured data extraction. Successfully captured:

- **Title:** "A Modern CSS Reset - Josh W. Comeau"
- **Metadata:** 14 fields including og:title, og:description, og:image,
  twitter:card, author
- **Links:** 74 total
- **Headings:** 23 (H1-H3), full hierarchy including TOC, main content, footer
  sections
- **Code blocks:** 121 `<pre>` and `<code>` elements detected
- **Tables:** 0
- **Text preview:** 5,000 chars of innerText showing full article flow with code
  blocks inline

**Key observation:** Got the JS-rendered content perfectly (including
interactive widgets' text). The innerText extraction gives clean readable text
but loses structure (no heading markers, no code block delimiters). Metadata
extraction was the richest of all three tools.

**Sample metadata:**

```json
{
  "description": "I have a set of baseline CSS styles that come with me from project to project...",
  "og:title": "A Modern CSS Reset - Josh W. Comeau",
  "og:image": "https://www.joshwcomeau.com/images/og-custom-css-reset.png",
  "og:image:width": "1280",
  "twitter:card": "summary_large_image"
}
```

---

### URL 2: MDN Array.prototype.map()

#### Extractor A: WebFetch

**Result:** Excellent. Captured the complete API documentation including syntax,
parameters table, return value, description, all 8+ code examples with full code
blocks, specifications reference, browser compatibility note, and "See also"
links. Metadata extracted (title, last modified date).

**Sample output (first ~30 lines):**

```
# Array.prototype.map() - MDN Documentation

## Page Metadata
- **Title**: Array.prototype.map() - JavaScript | MDN
- **Last Modified**: July 20, 2025
- **Status**: Baseline - Widely available across browsers since July 2015

## Main Content

### Overview
The `map()` method of Array instances creates a new array populated with
the results of calling a provided function on every element in the calling array.

### Syntax
map(callbackFn)
map(callbackFn, thisArg)

### Parameters
| Parameter | Description |
|-----------|-------------|
| `callbackFn` | A function to execute for each element... |
```

#### Extractor B: curl + pandoc

**Result:** Good. Produced 519 lines of markdown. Content is present and code
blocks are preserved. However, the output is cluttered with pandoc's div/span
markup artifacts (`:::::`, `::::`, `:::` fencing, `.heading-anchor` class
references, `{.brush: .js .notranslate}` code fence attributes). Headings and
code blocks are structurally correct but require post-processing to clean up the
pandoc markdown extensions.

**Line count:** 519 lines

**Sample output (first ~30 lines of content):**

```markdown
:::::: {#content .layout**content role="main"} ::::::: {.layout**header
.reference-layout\_\_header}

# Array.prototype.map()

[]{.indicator role="img" aria-label="Baseline Check"}

::: status-title Baseline [ Widely available ]{.not-bold} :::

::: browsers [ []{.browser .chrome .supported key="chrome"...
```

**Sample code block (clean portion):**

````
``` {.brush: .js .notranslate}
const numbers = [1, 4, 9];
const roots = numbers.map((num) => Math.sqrt(num));
// roots is now     [1, 2, 3]
// numbers is still [1, 4, 9]
````

````

#### Extractor C: Playwright MCP

**Result:** Good structured data. Successfully captured:
- **Title:** "Array.prototype.map() - JavaScript | MDN"
- **Metadata:** 14 fields including og:url, og:image, twitter:card, twitter:creator
- **Links:** 260 total (MDN has extensive cross-linking)
- **Headings:** 20 (H1-H3), complete hierarchy
- **Code blocks:** 129 elements
- **Tables:** 1 (specifications/compatibility)
- **Text preview:** 5,000 chars of clean readable text with full content flow

**Sample headings:**
```json
[
  "H1: Array.prototype.map()",
  "H2: Try it",
  "H2: Syntax",
  "H3: Parameters",
  "H3: Return value",
  "H2: Description",
  "H2: Examples",
  "H3: Mapping an array of numbers to an array of square roots",
  "H3: Using map to reformat objects in an array",
  "H3: Using parseInt() with map()"
]
````

---

### URL 3: React.dev/learn (JS-heavy SPA)

#### Extractor A: WebFetch

**Result:** Excellent. Captured the complete Quick Start tutorial with all 10
sections, every code example (components, JSX, styles, data display, conditional
rendering, lists, events, state, hooks, shared state). External links listed.
Metadata captured.

**Key observation:** Despite react.dev being a React SPA with Sandpack
interactive code editors, WebFetch captured ALL the content including the
embedded code examples. This is the critical JS-rendering test and WebFetch
passed it convincingly.

**Sample output (first ~30 lines):**

```
# React Quick Start - Complete Page Content

## Metadata
- **Page Title:** Quick Start
- **Purpose:** Introduction to 80% of daily-use React concepts

## Learning Objectives (YouWillLearn)
- How to create and nest components
- How to add markup and styles
- How to display data
...
```

#### Extractor B: curl + pandoc

**Result:** Partially successful but severely degraded. Produced 1,082 lines,
but the content is heavily polluted with:

- Inline SVG base64 data URIs (massive blobs consuming hundreds of characters
  per icon)
- Deeply nested pandoc div markers (`:::::::::::::::::::::` -- up to 20+ colons
  deep)
- CSS class lists embedded in the markdown
  (`.rounded-2xl .h-full .w-full .overflow-x-auto`)
- Sandpack widget markup mixed into content
- Some actual content IS present (headings, code blocks, prose) but buried under
  noise

The signal-to-noise ratio is very poor. Perhaps 30% of the 1,082 lines are
useful content.

**Line count:** 1,082 lines (but ~700 are noise)

**Sample output showing the noise problem:**

```markdown
::::::::::::::::::::::::::::::::::::::::::: {.min-w-0 .isolate role="main"}
::::::::::::::::::::::::::::::::::::::::: ps-0 ::::::::: {} :::::::: {.px-5
.sm:px-12 .pt-3.5} ::::::: {.max-w-4xl .ms-0 .2xl:mx-auto} :::::: {.flex
.justify-between .items-start} ::::: flex-1 :::: {.flex .flex-wrap} ::: {.flex
.mb-3 .mt-0.5 .items-center} [Learn React](/learn)
```

**Headers captured successfully:**

```
HTTP/1.1 200 OK
Content-Length: 265127
Content-Type: text/html; charset=utf-8
Server: Vercel
X-Nextjs-Prerender: 1
```

#### Extractor C: Playwright MCP

**Result:** Good structured data. Full JS-rendered content captured:

- **Title:** "Quick Start -- React"
- **Metadata:** 16 fields including fb:app_id, og:image, twitter:site,
  google-site-verification, algolia-search-order, theme-color
- **Links:** 126 total
- **Headings:** 16 (H1-H3), complete section hierarchy
- **Code blocks:** 129 elements
- **Tables:** 0
- **Text preview:** 5,000 chars of clean text with full tutorial content and
  embedded code

**Key observation:** Playwright successfully rendered the React SPA and
extracted all JS-generated content. The innerText output is clean and readable
-- code examples appear inline. The metadata extraction captured fields that no
other tool found (fb:app_id, algolia-search-order, google-site-verification).

---

## Scoring Matrix

Scale: 1 (failed) to 5 (excellent)

### URL 1: Josh Comeau Blog

| Criterion              | WebFetch (A) | curl+pandoc (B) | Playwright (C) |
| ---------------------- | ------------ | --------------- | -------------- |
| Content completeness   | 5            | 1               | 4              |
| Structure preservation | 4            | 1               | 3              |
| Metadata extraction    | 3            | 2               | 5              |
| Link extraction        | 4            | 1               | 4              |
| Token efficiency       | 4            | 5 (no output)   | 3              |
| JS content handling    | 5            | 1               | 5              |
| **Subtotal**           | **25**       | **11**          | **24**         |

### URL 2: MDN Documentation

| Criterion              | WebFetch (A) | curl+pandoc (B) | Playwright (C) |
| ---------------------- | ------------ | --------------- | -------------- |
| Content completeness   | 5            | 4               | 4              |
| Structure preservation | 5            | 3               | 3              |
| Metadata extraction    | 3            | 2               | 5              |
| Link extraction        | 4            | 4               | 5              |
| Token efficiency       | 4            | 2               | 3              |
| JS content handling    | 5            | 4               | 5              |
| **Subtotal**           | **26**       | **19**          | **25**         |

### URL 3: React.dev (JS-heavy)

| Criterion              | WebFetch (A) | curl+pandoc (B) | Playwright (C) |
| ---------------------- | ------------ | --------------- | -------------- |
| Content completeness   | 5            | 3               | 4              |
| Structure preservation | 5            | 2               | 3              |
| Metadata extraction    | 3            | 2               | 5              |
| Link extraction        | 4            | 3               | 4              |
| Token efficiency       | 4            | 1               | 3              |
| JS content handling    | 5            | 3               | 5              |
| **Subtotal**           | **26**       | **14**          | **24**         |

### Aggregate Scores

| Extractor                  | URL 1 | URL 2 | URL 3 | Total (/90) |
| -------------------------- | ----- | ----- | ----- | ----------- |
| **WebFetch (A)**           | 25    | 26    | 26    | **77**      |
| **superpowers-chrome (D)** | 26    | 24    | 25    | **75**      |
| **Playwright (C)**         | 24    | 25    | 24    | **73**      |
| **curl+pandoc (B)**        | 11    | 19    | 14    | **44**      |

---

## Per-URL Winners

| URL               | Winner            | Runner-up       | Notes                                                         |
| ----------------- | ----------------- | --------------- | ------------------------------------------------------------- |
| URL 1 (Blog)      | **WebFetch** (25) | Playwright (24) | pandoc completely failed on complex HTML                      |
| URL 2 (MDN)       | **WebFetch** (26) | Playwright (25) | All three produced usable output; WebFetch had best structure |
| URL 3 (React SPA) | **WebFetch** (26) | Playwright (24) | WebFetch handled JS content + preserved structure best        |

---

## Detailed Analysis

### WebFetch Strengths

1. **Best content comprehension** -- Produces clean, well-structured markdown
   with proper heading hierarchy, code blocks, and tables
2. **JS rendering** -- Handles JS-heavy sites transparently (runs through a
   model that processes rendered content)
3. **Structure preservation** -- Output is immediately usable without
   post-processing
4. **Consistent quality** -- Scored 25-26 across all three URL types

### WebFetch Weaknesses

1. **Model mediation** -- Content passes through a small model, which means:
   - Cannot guarantee 100% faithful reproduction (may summarize despite
     instructions)
   - May miss niche/unusual content the model doesn't prioritize
   - Output quality depends on the mediating model's interpretation
2. **Limited metadata** -- Captures title and some meta tags but not the full
   set (no og:image dimensions, no twitter:creator, no JSON-LD explicitly)
3. **No raw HTML access** -- Cannot extract specific DOM elements or run custom
   queries
4. **Cache behavior** -- 15-minute cache means repeated calls may return stale
   content

### curl+pandoc Strengths

1. **No model dependency** -- Deterministic output, no AI mediation
2. **Raw access** -- Full HTTP headers available via `curl -sI`
3. **Cheap** -- No API costs, runs locally
4. **MDN worked OK** -- For well-structured, standards-compliant HTML, pandoc
   produces usable output

### curl+pandoc Weaknesses

1. **Catastrophic failure on complex HTML** -- Josh Comeau's site (SSR Next.js
   with styled-components) produced 0 usable lines
2. **Noise pollution** -- pandoc markdown extensions (`:::::` div fencing,
   `{.class}` attributes, inline base64 SVGs) make output noisy even when it
   works
3. **No JS rendering** -- Cannot access content generated by client-side
   JavaScript
4. **No metadata extraction** -- Headers only; no OpenGraph, JSON-LD, or
   semantic metadata
5. **Post-processing required** -- Even successful output needs cleaning (strip
   pandoc extensions, base64 blobs, etc.)
6. **Token wasteful when noisy** -- React.dev produced 1,082 lines but ~700 were
   noise

### Playwright Strengths

1. **Best metadata extraction** -- Captured 14-16 metadata fields per page
   including og:_, twitter:_, fb:app_id, google-site-verification, theme-color
2. **Full JS rendering** -- Handles SPAs, React apps, dynamic content perfectly
3. **Programmatic access** -- Can extract specific DOM elements, count
   structures, run arbitrary JS
4. **Quantitative data** -- Link counts, code block counts, table counts,
   heading hierarchies as structured data
5. **Screenshot capability** -- Can capture visual state (not tested here but
   available)
6. **Consistent across all URL types** -- Scored 24-25 uniformly

### Playwright Weaknesses

1. **No structure preservation in text** -- `innerText` gives flat text without
   heading markers or code delimiters
2. **Requires multiple calls** -- Need separate navigate + run_code calls (2+
   round trips)
3. **Text truncation** -- The 5,000 char `innerText` limit means long pages are
   incomplete
4. **No built-in markdown conversion** -- Would need custom JS to convert DOM to
   structured markdown
5. **Browser overhead** -- Heavier resource usage than curl

---

## Overall Recommendation (Updated with superpowers-chrome)

### Final Rankings

| Rank | Tool               | Score | Role                                                     |
| ---- | ------------------ | ----- | -------------------------------------------------------- |
| 1    | WebFetch           | 77/90 | Best processed content (model-mediated, clean structure) |
| 2    | superpowers-chrome | 75/90 | Best raw capture (4 artifacts, 1 call, unmediated truth) |
| 3    | Playwright MCP     | 73/90 | Best metadata + programmatic DOM access                  |
| 4    | curl+pandoc        | 44/90 | HTTP headers only — unreliable for content               |

### Key Insight: Complementary, Not Competitive

WebFetch and superpowers-chrome are complementary:

- **superpowers-chrome** gives raw truth (actual rendered page, no
  summarization)
- **WebFetch** gives processed understanding (model-mediated, noise stripped)
- **superpowers-chrome** produces 4 artifacts in 1 call (efficiency win)
- **WebFetch** produces 1 clean artifact in 1 call (quality win for content
  parsing)

superpowers-chrome **replaces Playwright MCP** for metadata extraction (eval
gives same richness) and adds screenshot + console + HTML that Playwright needs
separate calls for.

### Recommended Pipeline for `/website-analysis`

```
Step 1: superpowers-chrome navigate (always, FIRST)
        → Auto-captures: raw HTML, Markdown, screenshot, console
        → 1 tool call = 4 artifacts

Step 2: superpowers-chrome eval (always)
        → Metadata: title, all meta tags, OG/Twitter/JSON-LD
        → Structural counts: links, headings, code blocks, tables
        → 1 tool call = structured metadata JSON

Step 3: WebFetch with analysis prompt (Standard/Deep only)
        → Model-processed content summary with clean structure
        → Primary source for Creator View prose generation
        → 1 tool call = focused content

Step 4: curl -sI for HTTP headers (Deep only)
        → Server, cache, CSP, security headers
        → 1 tool call = technical metadata

Total: 2-4 tool calls depending on depth tier
```

### Why Not superpowers-chrome Alone?

superpowers-chrome's Markdown has noise: navigation menus, duplicate code
blocks, heading link prefixes. WebFetch strips this automatically. For the
Creator View (conversational prose about what a site KNOWS), the model-processed
content from WebFetch is a better input than raw markdown with 200 lines of
navigation.

---

## superpowers-chrome Results (Post-Restart Test)

**Tested 2026-04-06** after enabling plugin and restarting Claude Code.

### Auto-Capture Confirmed

Each `navigate` call automatically produced 4 files:

- `{prefix}.md` — structured Markdown (page content)
- `{prefix}.html` — full rendered DOM
- `{prefix}.png` — viewport screenshot
- `{prefix}-console.txt` — browser console messages

`eval` action provides full programmatic access to DOM, metadata, JSON-LD.

### URL 1: Josh Comeau Blog

**Markdown:** 1,261 lines. Full article content with all 10 CSS reset rules,
code blocks properly fenced, heading hierarchy preserved, all 74 links captured
with full URLs, changelog section included.

**Strengths:** Complete content capture, code blocks intact, JS-rendered
interactive widgets captured. **Weaknesses:** Navigation chrome at top (~30
lines), "Link to this heading" prefix on headings, some code blocks appear
duplicated (visible + clipboard copy version).

**Metadata via eval:** 14 fields (og:title, og:description, og:image,
og:image:width, og:image:height, og:locale, og:type, twitter:card,
twitter:title, twitter:description, twitter:image, twitter:image:width,
twitter:image:height, description, author). Full parity with Playwright.

### URL 2: MDN Documentation

**Markdown:** 1,150 lines. Full API reference with syntax, parameters,
description, examples, specifications, browser compatibility.

**Strengths:** Complete content, all code examples captured, 260 links
preserved. **Weaknesses:** Navigation mega-menu (~200 lines of noise at top),
inline code elements rendered as separate code blocks (e.g., `callbackFn`
becomes its own fenced block), redundant anchor links next to headings.

### URL 3: React.dev (JS-heavy SPA)

**Markdown:** 947 lines. Full Quick Start tutorial with all sections, code
examples, interactive Sandpack embeds captured as static code.

**Strengths:** Successfully rendered React SPA, all JS-generated content
captured, 126 links preserved. **Weaknesses:** Code block duplication (visible
code + hidden copy version), CSS code blocks lose formatting (single-line),
navigation sidebar included.

### Scoring

| Criterion              | URL 1  | URL 2  | URL 3  |
| ---------------------- | ------ | ------ | ------ |
| Content completeness   | 5      | 4      | 4      |
| Structure preservation | 3      | 3      | 3      |
| Metadata extraction    | 5      | 5      | 5      |
| Link extraction        | 5      | 5      | 5      |
| Token efficiency       | 3      | 2      | 3      |
| JS content handling    | 5      | 5      | 5      |
| **Subtotal**           | **26** | **24** | **25** |

**Total: 75/90**

### Key Differentiators

1. **Single-call 4-artifact capture** — no other tool produces HTML + Markdown +
   screenshot + console in one call
2. **Raw content, not model-mediated** — WebFetch passes content through a model
   (may summarize/reinterpret); superpowers-chrome gives the actual rendered
   page
3. **Full metadata via eval** — same richness as Playwright (14-16 fields),
   better than WebFetch (3-5 fields)
4. **Persistent auth profiles** — can access logged-in content that WebFetch and
   Playwright cannot
5. **CDP escape hatch** — `raw` command enables any Chrome DevTools Protocol
   operation

### Weaknesses vs WebFetch

1. **More noise** — captures navigation, sidebars, footers; WebFetch's model
   strips these
2. **Code block duplication** — sites with copy-to-clipboard produce double code
   blocks
3. **Less structured** — WebFetch produces clean, well-organized markdown;
   superpowers-chrome preserves page structure warts and all
4. **Higher token cost** — 947-1,261 lines vs WebFetch's ~3,000-5,000 words of
   focused content

---

## Raw Data Summary

| Metric             | WebFetch (A)    | superpowers-chrome (D)            | Playwright (C)           | curl+pandoc (B)          |
| ------------------ | --------------- | --------------------------------- | ------------------------ | ------------------------ |
| URL 1 output size  | ~4,500 words    | 1,261 lines MD + 1,241 lines HTML | ~5,000 chars text + JSON | 0 lines (failed)         |
| URL 2 output size  | ~3,000 words    | 1,150 lines MD + 937 lines HTML   | ~5,000 chars text + JSON | 519 lines (~12K)         |
| URL 3 output size  | ~5,000 words    | 947 lines MD + 398 lines HTML     | ~5,000 chars text + JSON | 1,082 lines (~70% noise) |
| Calls per URL      | 1               | 1 (navigate) + 1 (eval)           | 2 (navigate + run_code)  | 2-3                      |
| Artifacts per call | 1 (text)        | 4 (MD + HTML + PNG + console)     | 1 (text or JSON)         | 1 (text)                 |
| JS rendering       | Yes (via model) | Yes (real Chrome)                 | Yes (real browser)       | No                       |
| Metadata richness  | Medium (3-5)    | High (14-16 via eval)             | High (14-16)             | Low (headers only)       |
| Failure rate       | 0/3             | 0/3                               | 0/3                      | 1/3 fail, 1/3 degraded   |
| Content mediation  | Model-processed | Raw (unmediated)                  | Raw (flat text)          | Raw (noisy pandoc)       |
| Screenshot         | No              | Yes (auto)                        | Separate call            | No                       |
| Auth support       | No              | Persistent profiles               | Storage state            | No                       |
