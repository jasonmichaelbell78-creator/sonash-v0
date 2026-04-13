# Documentation Dimension — jina-ai/reader

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Headline Band: Needs Work (52/100)

The README is genuinely above average for an API service — it covers edge cases
most tools ignore. But the codebase itself is nearly undocumented, there is no
self-hosting path, no contribution guide, no environment variable inventory, and
the "How it works" section is a single badge pointing offsite.

---

## README assessment

**Completeness:** Moderate. Covers both endpoints (r.jina.ai, s.jina.ai), all
current Accept-header modes, every documented request header, SPA edge cases,
streaming semantics, and JSON mode caveats. Missing: auth/API key flow (where
does a key come from? what does it unlock?), error response shapes, rate limit
details beyond an external link, and any description of the response envelope
structure.

**Onboarding:** Fast for basic use. Time-to-first-call is under 60 seconds —
prepend a URL, open it in a browser. No install required. No auth required for
the free tier. The live demo and Colab notebook links reinforce this. The
interactive code builder at `jina.ai/reader#apiform` partially substitutes for a
formal parameter reference.

**API reference:** Present but informal. Headers are documented as prose bullet
points, not a structured table. No schema for request body (POST mode), no
documentation of which parameters are mutually exclusive, no response schema, no
HTTP status code inventory. The JSON mode response is described as
`{'title', 'content', 'url'}` — a notation that is not valid JSON, suggesting
the docs were written quickly rather than from a spec.

---

## API documentation

**Header catalog:** Documented inline in README prose: `x-with-generated-alt`,
`x-set-cookie`, `x-respond-with`, `x-proxy-url`, `x-cache-tolerance`,
`x-no-cache`, `x-target-selector`, `x-wait-for-selector`, `x-timeout`. This
covers the surface a typical user needs. Not formatted as a table; no default
values stated; no value-type constraints listed (e.g., that `x-cache-tolerance`
is an integer in seconds appears only in passing).

**Response modes:** All six modes are documented (default markdown, markdown
without readability, html, text, screenshot URL, JSON). The streaming/SSE mode
is documented with the important nuance that each chunk supersedes the prior one
— a genuinely non-obvious semantic that many streaming APIs omit. The screenshot
mode returns a URL to the screenshot rather than binary data — this is not
explicitly stated anywhere.

**Undocumented surface found in source:** `CONTENT_FORMAT` enum in
`src/dto/crawler-options.ts` includes `VLM` and `READER_LM = 'readerlm-v2'`
values not mentioned in the README. `ENGINE_TYPE` enum exposes
`cf-browser- rendering` and `curl` as engine options. `RESPOND_TIMING` enum has
six values (`html`, `visible-content`, `mutation-idle`, `resource-idle`,
`media-idle`, `network-idle`). None of these appear in any user-facing doc.

---

## Inline comments / JSDoc

**Density:** Low for business logic; moderate for the stealth utilities file.
The `src/services/minimal-stealth.js` file contains well-written JSDoc with
`@param`, `@example`, and cross-references — but this is a vendored/adapted
third-party file, not representative of the project's own commenting practices.

**Quality in first-party code:** The crawler, searcher, and service files use
terse inline comments describing intent (`// Prevent circular crawling`,
`// Potential privacy issue, dont cache if cookies are used`) but no `@param` /
`@returns` annotations on any exported TypeScript methods. The one `/** */`
block on a first-party method (`searchWithFallback` in `src/api/searcher.ts`)
documents params and returns correctly, but it is the only such block in the
entire crawl/search API surface. DB model classes (`Crawled`, `PDFContent`,
`AdaptiveCrawlTask`) have zero comments.

**TypeScript as documentation:** The DTO classes (`CrawlerOptions`,
`AdaptiveCrawlerOptions`, `TurnDownTweakableOptions`) use the civkit
`AutoCastable`/`Prop` decorator pattern for validation. This provides implicit
type documentation at runtime but no human-readable descriptions on individual
fields.

---

## Operational docs

**Self-hosting:** No documentation. The Dockerfile is present and functional —
it installs Chrome, copies built assets, sets `OVERRIDE_CHROME_EXECUTABLE_PATH`,
`LD_PRELOAD` for curl-impersonate, and `PORT=8080` — but there is no README
section explaining how to build, run, or configure a self-hosted instance. A
developer would need to reverse-engineer the Dockerfile and CD pipeline to
attempt it.

**Deployment:** The `cd.yml` workflow reveals the full deployment topology
(Cloud Run services: `crawl`, `search`, `serp`, with EU and HK regions) but this
is implicit infrastructure knowledge, not documentation. Required secrets
(`THINAPPS_SHARED_READ_TOKEN`, `GCLOUD_SERVICE_ACCOUNT_SECRET_JSON`) are not
enumerated or explained anywhere.

**Environment variables:** No `.env.example`, no env var inventory. The secrets
system routes through a private `thinapps-shared` submodule. The only env vars
visible in the Dockerfile are Chrome path, curl-impersonate settings, compile
cache, and port. All API keys (Serper, Brave, OpenAI, Firebase, GeoIP database
path) are opaque.

**Required licensed assets:** The CD pipeline fetches two assets at build time
(MaxMind GeoLite2-City.mmdb, Source Han Sans SC font). Neither is mentioned in
any user-facing doc. A self-hoster would encounter runtime failures without
them.

---

## What's missing

- Environment variable reference (required keys, optional keys, defaults)
- Self-hosting guide (build steps, required assets, port configuration)
- CONTRIBUTING.md (no file exists; not referenced in README)
- Issue or PR templates (`.github/workflows/.keep` is the only file in
  `.github/workflows/` aside from `cd.yml`)
- Response envelope schema with field types and nullability
- HTTP error response format and status code inventory
- Documentation of undocumented header values: engine selection, respond-timing,
  VLM/readerlm-v2 content formats
- Authentication guide (API key acquisition, what authenticated access unlocks,
  tier differences)
- CHANGELOG or release notes (the "Updates" section in README is hand-maintained
  and stale — last entry is 2024-07-15)
- Architecture narrative: the "How it works" section is `[![Ask DeepWiki]...]` —
  a link to a third-party AI-generated wiki, not authored documentation

---

## What's excellent

- SPA edge cases are documented proactively and correctly: hash-routing via POST
  body, preload content via `x-timeout` or `x-wait-for-selector`. Most API
  services document happy paths only.
- Streaming semantics are explained with precision: subsequent chunks supersede
  prior ones, which is the opposite of LLM streaming. The ASCII diagram is
  clear.
- Live clickable examples embedded directly in the README mean the reader can
  verify the API behavior in under 10 seconds without writing any code.
- Google Colab notebook link for batch/full-site crawling is a practical
  onboarding artifact that most similar tools omit.
- The `thinapps-shared` submodule is acknowledged and its irrelevance to
  end-users is explicitly stated — transparent about an otherwise confusing gap.
- Interactive code builder link (`jina.ai/reader#apiform`) partially compensates
  for the absence of a structured parameter table.

---

## Teachability score

**No.** Reading this repo does not teach you how to build a similar service. The
README teaches you how to call the hosted API. The source code is readable
TypeScript but is tightly coupled to internal Jina AI infrastructure (civkit RPC
framework, Firebase, shared secrets service, internal SERP providers) with no
explanation of those dependencies. A developer attempting to understand the
architecture would need to study the `civkit` framework internals, reverse-
engineer the DI container wiring, and access the private `thinapps-shared`
submodule. The "How it works" section — the natural home for architectural
explanation — is replaced entirely by a DeepWiki badge.

---

## Summary

The README is a legitimate outlier for API documentation quality: edge case
coverage (SPAs, preloading, streaming semantics), working clickable examples,
and a Colab notebook push it well above typical API service docs. The ceiling is
pulled down sharply by three gaps — no self-hosting path despite an open-source
codebase, no environment variable inventory, and a "How it works" section that
is a single external link — plus first-party TypeScript code that is almost
entirely JSDoc-free. A user can be productive with the hosted service in under
60 seconds; a developer attempting to self-host or contribute has no documented
path to follow.

---

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0     | 2026-04-12 | Initial release |
