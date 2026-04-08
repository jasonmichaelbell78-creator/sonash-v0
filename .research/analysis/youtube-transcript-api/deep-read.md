# Deep Read: youtube-transcript-api

## Artifacts Discovered

### Documentation

- **README.md** — Comprehensive. API examples (fetch, list, translate, filter by
  type), CLI usage, proxy setup (generic + Webshare), IP ban workarounds,
  formatting options. Badges: CI, coverage, PyPI, Python versions.
- **.github/ISSUE_TEMPLATE/bug_report.md** — Structured bug report template
- **.github/ISSUE_TEMPLATE/feature_request.md** — Feature request template

### Configuration

- **pyproject.toml** — Poetry build with 100% coverage requirement, ruff
  formatting, precommit task chain (format → lint → coverage). Only 2 runtime
  deps: requests + defusedxml.
- **poetry.lock** — Full lock file for reproducible builds
- **.github/workflows/ci.yml** — CI workflow
- **.github/FUNDING.yml** — GitHub Sponsors + PayPal

### Test Infrastructure

- **youtube_transcript_api/test/** — 4 test modules + 14 static fixture files
  - `test_api.py` — Core API tests
  - `test_cli.py` — CLI tests
  - `test_formatters.py` — Output format tests
  - `test_proxies.py` — Proxy config tests
  - `test/assets/` — 14 static HTML/JSON/XML fixtures for mocking YouTube
    responses (transcript XML, innertube responses, consent pages, error states,
    age-restricted, blocked, etc.)

### Internal Artifacts NOT Found

- No examples/ directory (README serves as examples)
- No notebooks
- No architecture docs (code is self-documenting)
- No CONTRIBUTING.md (though Contributing section in README mentions PR process)

## Knowledge Beyond Code

1. **YouTube's innertube API**: The code reveals that transcripts are fetched
   via YouTube's internal innertube API (`/youtubei/v1/player`), not the public
   YouTube Data API. This means no API key needed. The ANDROID client context
   (`clientName: "ANDROID", clientVersion: "20.10.38"`) is used to avoid certain
   restrictions.

2. **Transcript availability hierarchy**: The code distinguishes between
   manually_created_transcripts and generated_transcripts, with manual taking
   priority. This is important for quality — manual captions are human-verified,
   auto-generated may have errors.

3. **IP blocking is the primary challenge**: The extensive proxy infrastructure
   (GenericProxyConfig, WebshareProxyConfig with rotating residential IPs,
   retry-on-429) reveals that YouTube actively blocks bulk transcript requests.
   This is the main operational challenge for T27.

4. **Cookie auth is broken**: The code has commented-out cookie authentication
   with a note that YouTube's recent API changes broke it. Age-restricted
   content is currently inaccessible. This is a real limitation for T27.

5. **Consent cookie for EU**: YouTube's GDPR consent page is handled
   automatically — the library detects the consent form, extracts the token, and
   creates the cookie. Without this, EU-based requests would fail.

6. **defusedxml**: The choice of defusedxml over standard xml.etree shows
   security awareness — transcript XML could theoretically contain XXE attacks.

## Cataloged for Phase 4b

- Webshare proxy service (referenced for IP rotation)
- YouTube innertube API endpoint (undocumented internal API)
- SearchAPI, Supadata, Dumpling AI (commercial sponsors offering hosted
  alternatives)
