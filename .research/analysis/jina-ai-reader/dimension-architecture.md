# Architecture Dimension — jina-ai/reader

## Headline Band: Healthy (72/100)

Solid extraction pipeline with well-structured fallback chains and a clean
multi-target deployment strategy. The SERP provider abstraction is portable.
Loses points for duplicated rate-limit logic across API hosts, a
shallow-but-wide god class in CrawlerHost, and cache metadata split across
Firestore + GCS with no obvious coherence boundary.

---

## Layer Map

```
HTTP Request
     |
     v
[Stand-alone Server]  [Cloud Functions / Firebase]
 KoaServer (h2c)       Express adapter (CloudHTTPv2)
 src/stand-alone/      src/cloud-functions/
     |                          |
     +----------+---------------+
                |
                v
         [API Hosts]                      civkit RPCHost
          CrawlerHost    (api/crawler.ts) — crawl endpoints
          SearcherHost   (api/searcher.ts)— s.jina.ai search
          SerpHost       (api/serp.ts)    — serp-only variant
          AdaptiveCrawlerHost             — async bulk crawl
                |
         [Services Layer]
          PuppeteerControl   — headless Chrome scraping
          JSDomControl       — linkedom + Readability (threaded)
          CurlControl        — curl-impersonate HTTP fetch
          CFBrowserRendering — Cloudflare Browser Rendering API
          SnapshotFormatter  — HTML -> Readability -> Turndown -> MD
          AltTextService     — OpenAI VLM for image alt text
          PDFExtractor       — pdfjs-dist
          SerperGoogle/Bing  — Serper.dev HTTP client
          InternalJinaSerp   — Jina's own SERP API
          GoogleSERP         — direct Puppeteer scrape of Google
          RobotsTxtService   — robots-parser compliance
          GeoIPService       — MaxMind mmdb country detection
                |
         [DB / Cache Layer]
          Crawled            (Firestore metadata + GCS snapshots)
          SERPResult         (Firestore — search cache, 7d TTL)
          AdaptiveCrawlTask  (Firestore — async task state)
          DomainBlockade     (Firestore — abuse blocks)
          DomainProfile      (Firestore)
          ImgAlt             (Firestore — cached alt text)
                |
         [Shared / Private Submodule]
          thinapps-shared:   FirestoreRecord, SecretExposer,
                             RateLimitControl, ProxyProviderService,
                             FirebaseStorageBucketControl, auth DTO
```

Data flows: Request -> API Host -> `iterSnapshots()` -> cache check -> side-load
(curl) -> Puppeteer -> `jsdomControl.narrowSnapshot()` ->
`snapshotFormatter.format*()` -> response.

---

## Multi-Target Deployment Strategy

One Docker image, three entry points, six Cloud Run services.

**The trick:** The `build/` directory contains three compiled entry points:

- `build/stand-alone/crawl.js` — Koa HTTP/2 server for r.jina.ai
- `build/stand-alone/search.js` — Koa server for s.jina.ai
- `build/stand-alone/serp.js` — Koa server for standalone SERP

The CD workflow (`cd.yml`) builds a single Docker image then deploys it six
times with different `--args` flags (crawl, search, serp × us-central1 plus
eu/hk geo variants). Same binary, different entrypoint argument.

`stand-alone/crawl.ts` calls `container.resolve(CrawlStandAloneServer)` which
wires `CrawlerHost` into a Koa server via tsyringe DI. `stand-alone/search.ts`
does the same with `SearcherHost`. The `cloud-functions/` directory wraps the
same service classes in Firebase Functions adapters (`@CloudHTTPv2`,
`@CloudTaskV2` decorators from the civkit library).

The shared core (`api/crawler.ts`, `services/`) is DI-injected into whichever
host class is resolved. No service duplication, no separate packages. The
Dockerfile uses `CMD [ "build/stand-alone/crawl.js" ]` as default; the Cloud Run
deploy overrides it with `--args`.

**Portable pattern:** Single compiled artifact + runtime entrypoint argument
dispatch. Works anywhere with a container runtime.

---

## Content Extraction Pipeline

```
URL in
  |
  1. CACHE CHECK — Firestore metadata lookup (urlPathDigest MD5)
  |                GCS snapshot download if hit and not stale
  |                Tolerance: X-Cache-Tolerance header (default 1h)
  |
  2. SIDE LOAD (curl-impersonate, Chrome 116 UA spoofing)
  |    - Tries direct fetch first
  |    - If <42 tokens returned or non-200: retry via allocated proxy
  |    - If content-type is not text/html: yield immediately (PDF/binary)
  |    - Result fed as sideLoad hint to Puppeteer session
  |    - SHORT-CIRCUIT if engine=curl or engine=direct
  |    - SHORT-CIRCUIT if engine=cf-browser-rendering (Cloudflare API)
  |
  3. PUPPETEER (headless Chrome, stealth mode)
  |    - Receives sideLoad hint (avoids double network fetch)
  |    - Waits for respond-timing: html / visible-content /
  |      mutation-idle / resource-idle / media-idle / network-idle
  |    - Expands shadow DOM / iframes on request
  |    - Captures PageSnapshot: html, text, parsed, imgs, pdfs,
  |      screenshot, pageshot
  |    - On abuse event: writes DomainBlockade to Firestore
  |
  4. JSDOM / NARROWING (Threaded worker thread — linkedom + Readability)
  |    - Applies targetSelector / removeSelector
  |    - Runs Mozilla Readability for article extraction
  |    - Counts token density to detect captcha/bot screens
  |
  5. SNAPSHOT FORMATTER (main thread)
  |    - Turndown (HTML->MD) with GFM plugin + custom rules
  |    - PDF: pdfjs-dist text layer extraction
  |    - Images: optional VLM alt-text via OpenAI / Jina reranker
  |    - Output modes: content(default) / markdown / html / text /
  |      screenshot / pageshot / vlm / readerlm-v2
  |
  6. CACHE WRITE — GCS (snapshot JSON) + batched Firestore metadata
  |                Batch interval: 10s + random jitter
  |
Response out (text/plain, application/json, or text/event-stream SSE)
```

**Fallback chain priority:** `Firestore cache fresh` >
`Firestore cache stale + live fetch` > `curl direct` > `curl + proxy` >
`Puppeteer` > `stale cache on Puppeteer error`

**Special routing:**

- `engine=cf-browser-rendering`: bypasses Puppeteer, calls Cloudflare API
- `engine=curl`: hard-skips Puppeteer
- PDF input (blob://pdf/...): skips network entirely, goes straight to pdfjs
- Raw HTML input: skips all fetching
- `respondWith=readerlm-v2`: fetches HTML then calls Jina's ReaderLM model
- `respondWith=vlm`: forces screenshot path + OpenAI Vision

---

## Adaptive Crawler (cloud-functions/adaptive-crawler.ts)

**Problem solved:** Bulk-crawling an entire site (up to N pages) without
blocking a single long-running HTTP request, and without knowing the full URL
list upfront.

**Mechanism:**

1. `adaptiveCrawl` HTTP endpoint: receives root URL + options
2. Two modes:
   - **Sitemap mode**: parses robots.txt -> sitemap.xml, extracts up to
     `maxPages` URLs, enqueues each as a Cloud Tasks item
   - **Recursive mode**: crawls root URL via `r.jina.ai` with
     `X-With-Links-Summary: true`, then calls `jina-reranker-v2` to score all
     discovered links by relevance, enqueues top-scoring URLs, repeating until
     `maxPages` reached
3. Each `singleCrawlQueue` Cloud Task (max 200 instances, 5 dispatches/sec)
   calls `r.jina.ai` internally, saves JSON result to GCS, updates Firestore
   task state in a transaction
4. `adaptiveCrawlStatus` endpoint polls task state; client passes URL list to
   have GCS blobs inlined into the response

**Why a separate Cloud Function:** The task queue requires Firebase Functions
(`@CloudTaskV2`) which is only available in the cloud-functions runtime. The
crawl logic itself delegates back to `r.jina.ai` over HTTP — no code
duplication. This is an async job coordinator layered on top of the same crawl
service.

---

## Caching Strategy

**Crawl cache (content):**

- Index: Firestore `crawled` collection, keyed by MD5 of normalized URL
- Body: GCS buckets (`snapshots/`, `screenshots/`, `pageshots/`)
- TTL: 7 days hard expiry (`expireAt` field), 1 hour freshness window
- `X-Cache-Tolerance` header overrides freshness window (seconds, 0 = bypass)
- `X-No-Cache` header = tolerance 0
- Cache skipped if: cookies present, scripts injected, custom viewport set,
  `doNotTrack=1` (DNT header)
- Write path: batched 10s interval to reduce Firestore write pressure

**Search cache (SERP):**

- Firestore `searched` collection, keyed by MD5 of normalized query params
- TTL: 7 days, freshness 1 hour
- Batch write: same 10s pattern as crawl cache
- Stale-while-revalidate: if live fetch fails, falls back to stale cache entry

**In-memory (process-level):**

- `LRUCache` (max 256, 1h TTL) for high-frequency API key rate-limit state —
  avoids Firestore round-trip on every request for premium keys

---

## Search Architecture (SERP Providers)

Three provider implementations behind a common interface:

| Provider      | Class                         | Notes                                |
| ------------- | ----------------------------- | ------------------------------------ |
| Serper Google | `SerperGoogleSearchService`   | Primary for web/images/news          |
| Serper Bing   | `SerperBingSearchService`     | 3x billing multiplier                |
| Jina Internal | `InternalJinaSerpService`     | Jina's own SERP API (web only)       |
| Google Direct | `GoogleSERP` (serp/google.ts) | Puppeteer scrape of Google SERP page |

Provider selection via `iterProviders()` generator — yields providers in order,
catches errors and tries next:

```
google preference:  JinaSerp -> SerperGoogle -> SerperGoogle
bing preference:    SerperBing -> JinaSerp -> SerperGoogle
default:            JinaSerp -> SerperGoogle -> SerperGoogle
```

(SerpHost variant swaps JinaSerp for GoogleSERP in the bing path.)

Stale-cache fallback wraps the entire provider loop: if all providers throw, and
a stale Firestore entry exists, it is returned instead of erroring.

**Query fallback:** If no results, progressively shortens the query (strips last
N/4 terms, up to 4 iterations, RTL-aware), multiplying the billing scalar by
`tryTimes`.

Caching is query-digest keyed (MD5 of full params object) and batched into
Firestore every 10 seconds.

---

## DTOs and Input Contracts

`CrawlerOptions` (`dto/crawler-options.ts`) is the central input contract — an
`AutoCastable` class with 30+ properties, all sourced from HTTP headers on GET
(via `RPC_CALL_ENVIRONMENT` context injection) or JSON body on POST.

Key design: `CrawlerOptionsHeaderOnly` is a subclass that strips body params —
used for GET requests to prevent body-injection attacks.

Output is `FormattedPage` (`services/snapshot-formatter.ts`): title,
description, url, content, html, text, screenshotUrl, pageshotUrl, links,
images, usage, warning.

No OpenAPI schema is auto-generated from these (the `@Also({openapi: ...})`
decorators on the DTO define static parameter docs manually).

---

## Threading / Concurrency

`ThreadedServiceRegistry` extends `civkit/AbstractThreadedServiceRegistry`,
pre-spawning 2 Node.js worker threads on startup. Methods decorated with
`@Threaded()` are offloaded to these workers.

Only `JSDomControl.actualNarrowSnapshot()` uses `@Threaded()`. This makes sense:
linkedom + Readability parsing is CPU-intensive and would block the event loop
during Puppeteer's concurrent page operations. The thread count is capped at
physical CPUs (detects hyperthreading by comparing even/odd CPU cycles).

The main thread retains: Puppeteer management, all I/O (GCS, Firestore, HTTP),
SSE streaming, rate limiting, billing.

---

## Noteworthy Patterns (extraction candidates)

**1. Single-image multi-target deployment** One Docker image, one build, N Cloud
Run services with different `--args`. Eliminates drift between deployments.
Directly portable to any service with container support.

**2. Side-load hint to Puppeteer** curl fetches the page first; if successful,
the result is passed as a `sideLoad` hint into the Puppeteer session so Chrome
doesn't re-fetch the network resource. Halves network cost on simple pages while
keeping the rendering path intact for JS-heavy sites.

**3. Provider iterator with silent failover** `iterProviders()` yields clients
in preference order; a `for...of` loop catches per-provider errors and advances
to the next. The caller never needs to know which provider succeeded. Highly
portable for any multi-provider API integration.

**4. Batch-write with jitter** Both crawl and search cache writes use
`setInterval` with `+ Math.random() * 1000` jitter to prevent Firestore write
storms when multiple instances flush simultaneously. Cheap and effective.

**5. AsyncLocalContext for request-scoped state** `AsyncLocalContext` wraps
Node's `AsyncLocalStorage` to propagate traceId, user state, and feature flags
(e.g., `collect-favicon`) down the call stack without threading them through
every function signature.

**6. `isSnapshotAcceptableForEarlyResponse()` on the DTO** The options object
knows whether a given snapshot satisfies the caller's timing requirements. This
is cleaner than scattering timing logic across the pipeline — the DTO
encapsulates both config parsing and config-driven decisions.

**7. Adaptive crawl as a task coordinator over HTTP** `singleCrawlQueue` tasks
call `r.jina.ai` as a normal API client. The adaptive crawler adds zero new
crawl logic — it is purely a scheduling and state-tracking layer. Clean
separation.

---

## Anti-Patterns

**1. Duplicated rate-limit and high-frequency key logic** `SearcherHost` and
`SerpHost` contain nearly identical rate-limiting code blocks (~80 lines each),
including the `highFreqKeyCache` LRU and the async fire-and-forget billing
pattern. Should be extracted to a shared mixin or base class method.

**2. CrawlerHost is a god class** `api/crawler.ts` exceeds 1,000 lines and owns:
HTTP handler, cache read/write, URL normalization, proxy allocation, domain
blockade enforcement, engine routing, snapshot formatting delegation, billing,
and the adaptive-crawl internal HTTP call. At minimum, the cache layer and
engine-routing logic deserve their own classes.

**3. Metadata split across Firestore + GCS with implicit coherence** The
`Crawled` Firestore document is a thin metadata envelope; the actual snapshot
JSON lives in GCS at `snapshots/{uuid}`. There is no transaction across both
stores — a crash between the GCS write and the Firestore batch commit produces
an orphaned GCS object or a dangling Firestore record.

**4. `AdaptiveCrawlerHost.getIndex()` is a no-op stub** The method body is
entirely commented out with a TODO in Chinese. The returned value is
`undefined`, which is silently serialized. Dead code in a production path.

**5. `singleCrawlQueue` re-fetches task state for each URL** In recursive mode,
every enqueued task reads the full `AdaptiveCrawlTask` document in a Firestore
transaction to check URL deduplication. With 150 concurrent dispatches this
produces 150 simultaneous Firestore transactions on the same document — a
contention hotspot for large crawls.

**6. No schema validation on the output contract** `FormattedPage` is a plain
interface with optional fields. Nothing enforces that downstream consumers (SSE,
JSON, plain-text serialization) receive a consistent shape. Missing fields are
silently omitted rather than defaulted.

---

## Caveats

- Private submodule `thinapps-shared` is not visible. Analysis of
  `FirestoreRecord`, `SecretExposer`, `RateLimitControl`,
  `ProxyProviderService`, auth DTO (`JinaEmbeddingsAuthDTO`), and billing
  (`reportUsage`) is inferred from call sites only.
- The `civkit` library (Jina-internal) provides the RPC framework (`RPCHost`,
  `@Method`, `@CloudHTTPv2`, `@CloudTaskV2`, `AutoCastable`,
  `AbstractThreadedServiceRegistry`). Its internals are not inspectable.
- The `GoogleSERP` (serp/google.ts) Puppeteer-based scraper is present but its
  scraping logic was not read in full; it is used only as a tertiary fallback in
  the SERP host.

---

## Summary

jina-ai/reader deploys a single Node.js Docker image to multiple Cloud Run
regions and Firebase Functions by varying the entrypoint argument at deploy time
— all service-specific logic is selected through tsyringe DI at container
resolution, not at build time. The content extraction pipeline is a layered
fallback: Firestore cache -> curl side-load (Chrome UA spoofing) -> Puppeteer
headless render -> stale cache on failure, with explicit engine overrides for CF
Browser Rendering, raw HTML, and PDF inputs. CPU-intensive DOM parsing
(linkedom + Readability) is offloaded to pre-spawned worker threads to keep
Puppeteer's async loop unblocked. The SERP abstraction is the clearest portable
pattern: a generator yields provider clients in preference order, each call is
wrapped in try/catch, and the first success wins — with a Firestore stale-cache
backstop if all providers fail.
