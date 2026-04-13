# Security Dimension — jina-ai/reader

## Headline Band: Needs Work (48/100)

The code shows genuine security thought: the URL validator in `services/misc.ts`
does DNS resolution + private-range blocking, Docker runs as non-root, Puppeteer
launches without `--no-sandbox`, secrets are externalised via `SecretExposer`,
and rate limits are enforced per-UID/IP with domain blockades for abusers.
However, the crawler is a **public URL-fetching proxy** and the validator is
applied only to the "target URL" — every other network-capable input
(`X-Proxy-Url`, `inject*Script`, PDF URL, robots.txt fetch, puppeteer
subresource filter) has weaker or missing validation, leaving several paths that
reach the internal network or leak the outbound traffic. TLS verification is
globally disabled in curl, which compromises the trust of every outbound hop.

## Key Findings (ranked severity)

### S0 - Critical findings

- **SSRF via `X-Proxy-Url` header** — `dto/crawler-options.ts:569-570` copies
  the raw `x-proxy-url` header into `instance.proxyUrl` with zero validation,
  and `services/curl.ts:175-178` passes it directly into
  `curl.setOpt(Curl.option.PROXY, ...)`, while `services/puppeteer.ts:928-941`
  uses it as the upstream proxy for every subresource. An authenticated caller
  can therefore (a) route outbound traffic through `http://127.0.0.1:PORT` /
  `http://169.254.169.254` / any internal host to reach services behind the
  crawler, and (b) exfiltrate requests/cookies by pointing at an attacker-owned
  SOCKS/HTTP proxy. The target-URL SSRF check never runs on the proxy URL.
  [OWASP A10/A05]

- **SSRF + arbitrary script fetch in `injectFrameScript`/`injectPageScript`** —
  `api/crawler.ts:1082-1099` does `fetch(x).then(r => r.text())` on any URL the
  user places in `injectFrameScript`/`injectPageScript`, bypassing
  `miscService.assertNormalizedUrl`. The returned body is then executed inside
  the page via puppeteer. This is a second SSRF vector (raw Node `fetch` has no
  private-IP guard) and a remote-script-injection vector (whatever the internal
  host returns becomes JS running in a Chromium context with
  `setBypassCSP(true)`). [OWASP A10/A03]

- **TLS verification disabled on every curl fetch** — `services/curl.ts:123`
  sets `Curl.option.SSL_VERIFYPEER, false` for all outbound curl requests (the
  main fetch path and sideloaded subresources). A network adversary between the
  crawler and its target can MitM responses, inject arbitrary content into the
  markdown returned to callers (which users and LLM agents trust), and forge
  cookies/headers. Jina's own proxy infrastructure makes this especially
  impactful. [OWASP A02]

### S1 - High severity

- **DNS-rebinding window between validator and fetcher** — `services/misc.ts`
  does a `dns.lookup(hostname, { all: true })` and rejects if any answer is in
  `isIPInNonPublicRange`, but the subsequent `curl` / `puppeteer` call
  re-resolves the hostname with a separate resolver. A short-TTL authoritative
  server can return a public IP to the validator and `127.0.0.1` to the actual
  fetcher. There is no `_hintIps` pinning into
  `curl.setOpt(CURLOPT_RESOLVE,...)` nor into puppeteer, so the mitigation is
  incomplete. [OWASP A10]

- **Private-IP filter incomplete** — `utils/ip.ts:131-153` covers RFC1918,
  loopback, link-local (incl. 169.254.169.254 AWS IMDS), carrier-grade NAT, and
  most IPv6 locals, but does **not** list `::ffff:0:0/96` (IPv4-mapped IPv6),
  `64:ff9b::/96` (NAT64), or `2001:db8::/32`. An attacker can request
  `http://[::ffff:7f00:1]/` which passes `isIP()` as IPv6 and routes to
  `127.0.0.1` on dual-stack hosts. The in-page puppeteer SSRF filter
  (`services/puppeteer.ts:674-681`) is even weaker — it only checks literal
  `localhost` and `127.*`, missing all other private ranges for subresources
  loaded by the rendered page. [OWASP A10]

- **`proxyUrl` construction accepts `file://`/`gopher://` and embedded
  credentials** — `services/curl.ts:176` does `new URL(crawlOpts.proxyUrl)` and
  passes `.href` to libcurl. `node-libcurl` honours many protocols beyond the
  reader's `http/https/blob` allowlist. Combined with the unvalidated header
  input (S0 #1), this widens the smuggling surface. [OWASP A03]

- **Auth tokens used verbatim as Firestore document IDs** —
  `dto/jina-embeddings-auth.ts:89,125,141,190` sets
  `JinaEmbeddingsTokenAccount._id = bearerToken` and calls
  `JinaEmbeddingsTokenAccount.COLLECTION.doc(this.bearerToken!)`. Firestore read
  permissions, backups, log samples, or an IAM misconfiguration directly leak
  live API keys. No hashing/salted lookup (even though `bcrypt` is a
  dependency). [OWASP A02/A07]

- **Anonymous/IP-based rate limit is low-bar** — `api/crawler.ts:313-319` limits
  unauthenticated callers to 20 requests/minute/IP, but there is no concurrency
  cap, no per-target limit, no global circuit breaker beyond the domain
  blockade. The crawler happily runs Puppeteer + curl loops against any URL for
  unauthenticated users, making it usable as a DDoS amplifier/proxy. [OWASP A04]

- **`MAXFILESIZE = 4 GiB` per request** — `services/curl.ts:194` allows
  individual downloads up to 4 GiB before libcurl aborts. Combined with
  concurrent abuse, a single caller can exhaust disk (files land in
  `TempFileManager`) and memory. No global download budget is visible. [OWASP
  A04]

### S2 - Medium

- **Stale/vulnerable dependencies** (`package.json`):
  - `stripe ^11.11.0` — three major versions behind (current v17+). Billing code
    path on an EOL client.
  - `axios ^1.3.3` — predates the CVE-2024-39338 SSRF fix (patched in 1.7.4).
  - `express ^4.19.2` — 4.x maintenance-only.
  - `civkit ^0.9.0-2570394` — Jina's own pre-1.0 lib, not semver-stable; all
    auth/SSRF checks depend on it (`marshalErrorLike`, `AsyncService`,
    `HashManager`).
  - `firebase-admin ^12.1.0`, `puppeteer ^23.3.0` — both one major behind.
    `pdfjs-dist 4.10.38` is post-CVE-2024-4367 fix and uses
    `disableFontFace: true` — good. [OWASP A06]

- **Puppeteer `setBypassCSP(true)` globally** — `services/puppeteer.ts:623`.
  Combined with S0 #2, the rendered page loses CSP protection, so any injected
  script (via the inject\* path or a MitM'd target) can exfiltrate or manipulate
  freely within the browsing context. Reader caches the resulting HTML. [OWASP
  A05]

- **Error strings leak target origins** — `services/curl.ts:185`
  (`Failed to access ${urlToCrawl.origin}: ${err.message}`),
  `services/pdf-extract.ts:329`
  (`Unable to process ${nameUrl} as pdf: ${err?.message}`), and many others echo
  raw error strings back to the caller. This is useful for SSRF blind-probing
  (distinguishing "connection refused" vs "DNS miss" vs "TLS fail" reveals
  what's reachable). SoNash's `sanitizeError` pattern is absent. [OWASP A09]

- **`X-Set-Cookie` header parsed with `set-cookie-parser` without an
  explicit-domain allowlist** — `dto/crawler-options.ts:554-567` accepts the raw
  header, splits on `, `, and passes each chunk to `parseSetCookieString`. Naive
  splitting on `', '` breaks any cookie whose `Expires=` date contains a
  comma-space, and nothing constrains `Domain=` scope on the downstream
  curl/puppeteer pipeline — cookies can be flagged to leak to sibling hosts.
  [OWASP A03]

- **`targetSelector`/`removeSelector` accept near-arbitrary CSS** —
  `api/crawler.ts:1045-1058` rejects only selectors starting with `*` or `:`.
  Catastrophic-backtracking selectors (`:has()`, attribute regex in linkedom),
  extremely deep combinators, or selectors that force a full DOM walk on a
  100k-element page can wedge the JSDom worker. There is no selector-length cap.
  [OWASP A04]

- **`x-target-selector`/`x-wait-for-selector` split on `', '` only** — same
  file, line 513-516. Selector values containing a comma plus space become
  multiple selectors silently; a single selector with `attribute*="a, b"`
  breaks. Behavioural rather than security in strict sense, but the parsed
  selector drives code execution in the browser. [OWASP A03]

- **Deprecated `apt-key add -`** — `Dockerfile:8` uses the legacy trusted.gpg
  store for Chrome's key; Debian recommends `signed-by=`. Not exploitable on its
  own but flagged by image scanners. [OWASP A05]

### S3 - Low / informational

- `blackhole-detector.ts` is a **worker-hang detector**, not an SSRF blackhole.
  The name is misleading for anyone auditing the codebase; a one-line comment
  would help.
- `services/curl.ts:122` disables `FOLLOWLOCATION` then re-implements
  redirect-following manually (`urlToFile`, line 320-372). The loop also
  re-attaches received `Set-Cookie` values without re-validating `Domain` scope
  as strictly as the initial pass.
- `getTargetUrl` (`api/crawler.ts:497-529`) calls `tryDecodeURIComponent` on the
  raw path before URL parsing; adversarial encoded NULs or CR/LF could reach the
  URL constructor. URL parsing does reject most of these, but the combination
  with `normalize-url` (which does aggressive rewrites) is a frequent source of
  parser-differential bugs.
- `services/puppeteer.ts:563` sets
  `headless: !Boolean(process.env.DEBUG_BROWSER)` — any operator who sets
  `DEBUG_BROWSER` in production turns the crawler into a visible Chromium,
  enlarging the attack surface.
- No Content Security Policy / response headers observed on the outer HTTP
  server (Koa); the markdown response is `text/plain` which mitigates XSS in
  browsers, but consumers that render the markdown to HTML (LLM chat UIs, Jina's
  own frontend) must escape it themselves — markdown-injection /
  prompt-injection content is returned verbatim from the crawled page.
- `setBypassCSP(true)` + `WeakMap` lifecycle for temp files means a leaked
  request can keep a `FancyFile` (up to 4 GiB) alive until the async context
  ends.
- The `integrity-check.cjs` step in `build` (package.json:5) is 280 bytes and
  not readable from this repomix; actual content not audited.

## Positive Patterns

- **Dedicated SSRF validator** in `services/misc.ts`: protocol allowlist
  (`http/https/blob`), explicit `localhost` reject, DNS lookup with
  private-range check, and propagation of resolved IPs via `_hintIps` to
  downstream code (though not into the actual fetcher).
- **Rate limiting** is tiered: per-UID wallet debit + per-IP floor, with
  `DomainBlockade` firestore collection for known-abusive hostnames; abusive
  domains are banned for an hour (`abuseBlockMs = 3600000`). Circuit breaker
  also blocks crawling the crawler's own host (`circuitBreakerHosts`).
- **Puppeteer in-page guards**: rps cap (`rps > 10` background, `> 60`
  foreground), `reqCounter > 2000` DDoS brake, `domainSet.size > 200` halt,
  media requests blocked, non-http protocols blocked, abuse event handler.
- **Docker non-root user** (`Dockerfile:17-19`: `groupadd -r jina`,
  `USER jina`).
- **Puppeteer launch without `--no-sandbox`** — uses Chromium's default sandbox
  (line 561-568, args only `--disable-dev-shm-usage` and
  `--disable-blink-features=AutomationControlled`).
- **PDF parser has `disableFontFace: true`** (`services/pdf-extract.ts:101,108`)
  — mitigates CVE-2024-4367-class font-JS bugs.
- **Per-request `createBrowserContext()`** (`services/puppeteer.ts:611`) — each
  request gets an isolated profile, mitigating cross-request cookie and storage
  leaks.
- **Cache gated on privacy signals** — cookies, `private`, injected scripts,
  custom viewport, and DNT all disable caching (`api/crawler.ts:110-127`,
  `dto/crawler-options.ts:665-683`), which reduces cross-tenant leakage.
- **Secrets externalised** via `SecretExposer` (private `thinapps-shared`), not
  committed env files; `GLOBAL_PROJECT`/`NODE_ENV`/`PORT` are the only env reads
  in the audited tree.
- **Circular crawl prevention** — own hostname added to `circuitBreakerHosts` on
  every request (`api/crawler.ts:275-277`).
- **Robots.txt support is opt-in** (`robotsTxt` option,
  `services/robots-text.ts`), with an explicit allow-if-unreachable stance
  documented in code.

## Caveats

- **Private submodule `thinapps-shared` not visible** — reduces confidence on:
  rate-limit semantics (`shared/services/rate-limit`), proxy pool
  (`shared/services/proxy-provider`), secrets management
  (`shared/services/secrets`), auth/Jina dashboard client
  (`shared/3rd-party/jina-embeddings`), Firebase storage helpers,
  `SecurityCompromiseError` class, and `marshalErrorLike` sanitisation. If any
  of these (especially the rate-limit store) fail open, several S1/S2 findings
  become more severe.
- **No runtime or npm-audit output** was available for this review — all S2
  dependency findings are based on declared semver ranges in `package.json`, not
  the resolved lockfile.
- `integrity-check.cjs` exists but was not inspected in full; `build` is gated
  on it.
- The Cloud Functions and Cloud Run entrypoints (`cloud-functions/*`,
  `stand-alone/*`) were only skimmed; ingress-level auth/IAM on the GCP side
  (whether the Cloud Run service is `--allow-unauthenticated`, how Cloud
  Functions triggers are bound) is outside this repomix.
- The front-door HTTP middleware stack (Koa body parser limits, CORS origin
  list, response headers, HSTS, compression bomb defences) lives in shared code
  and was not available.
- Image processing (`@napi-rs/canvas`, `svg2png-wasm`) usage path was not
  reached in this timebox — decoder-bomb / malformed-SVG handling is unaudited.
- `minimal-stealth.js` was skimmed only at the top; bundled stealth replacement
  of `navigator`/`WebGL`/`chrome.runtime` properties can itself be an issue if
  it monkey-patches unsafely, but nothing jumped out.

## Summary (2-3 sentences)

jina-ai/reader has a defensible perimeter for the **target-URL** SSRF case
(DNS + private-range check, domain blockades, per-user rate limits, non-root
Docker, sandboxed Puppeteer), but every other network-capable parameter —
`X-Proxy-Url`, `injectFrameScript`/`injectPageScript`, and PDF URLs — reaches
the outbound network without that validator, and `SSL_VERIFYPEER` is globally
disabled. The combination of unvalidated proxy URL, script-fetch SSRF, and
disabled TLS verification puts the whole pipeline one header away from internal
reachability or traffic exfiltration; these, plus storing bearer tokens as
Firestore document IDs, are the items to fix before treating this code as a
production boundary.
