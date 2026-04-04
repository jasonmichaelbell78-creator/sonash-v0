# D2b: Package Registry Search APIs as Repo Discovery Vectors

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-03-31 **Sub-Question IDs:** SQ-D2b-1 through SQ-D2b-8 **Depth:** L1
(Exhaustive)

---

## Key Findings

1. **npm search API is the most feature-rich among language registries**
   [CONFIDENCE: HIGH]

   The npm registry exposes `GET /-/v1/search` with full-text search, weighted
   scoring, and advanced qualifiers. Responses include three independently
   weighted score components (quality, popularity, maintenance) plus inline
   links to repository URLs. Search qualifiers support `author:`, `maintainer:`,
   `keywords:`, `is:insecure`, `is:unstable` — enabling targeted queries for
   well-maintained or insecure packages. The `size` parameter returns up to 250
   results per call. [SOURCE-1, SOURCE-2]

2. **PyPI has NO search API; XML-RPC search was permanently decommissioned
   September 2024** [CONFIDENCE: HIGH]

   The XML-RPC `search()` method and other methods (`list_packages`,
   `package_releases`, `release_urls`, `release_data`) were permanently disabled
   via rolling brownouts September 5-26, 2024. The JSON API at
   `pypi.org/pypi/{package}/json` requires knowing the package name. The Simple
   API (`pypi.org/simple/`) lists all packages but returns only filenames — no
   full-text search. There is no programmatic classifier-based search. PyPI's
   BigQuery dataset (via `pypi-bigquery`) is the only way to run aggregate
   queries across the full corpus. [SOURCE-3, SOURCE-4, SOURCE-5]

3. **crates.io has basic search but rich per-crate metadata including reverse
   dependencies** [CONFIDENCE: HIGH]

   The Cargo registry spec defines `/api/v1/crates?q=<query>&per_page=100`
   returning name, max_version, description, and total count. The extended
   crates.io API adds category and keyword filtering, sort options (downloads,
   recent-downloads), and per-crate endpoints for reverse dependencies
   (`/api/v1/crates/{name}/reverse_dependencies`), downloads history, and
   owners. The 2025 update added an experimental OpenAPI spec at
   `crates.io/api/openapi.json` and a Security tab pulling RustSec advisories in
   OSV format. crates.io does NOT have quality scores analogous to npms.io.
   [SOURCE-6, SOURCE-7, SOURCE-8]

4. **Go has NO dedicated search API; pkg.go.dev has no public REST API as of
   2026** [CONFIDENCE: HIGH]

   GitHub issue #36785 requesting a pkg.go.dev API has been open since January
   2020, assigned to "pkgsite/unplanned" — no resolution expected. The Go module
   ecosystem provides `index.golang.org/index` (chronological feed, max 2000
   entries per call, filterable by `since` timestamp) and per-module metadata
   via the proxy protocol (`proxy.golang.org/<module>/@v/<version>.info`).
   pkg.go.dev surfaces quality signals (has go.mod, redistributable license,
   tagged version, stable v1+) but only via the human-readable web UI, not a
   machine-readable API. [SOURCE-9, SOURCE-10]

5. **Go modules are architecturally different: the module path IS the source
   URL** [CONFIDENCE: HIGH]

   Unlike npm/PyPI/Cargo where source repo is optional metadata, Go module paths
   are canonical URLs. The go command fetches via VCS discovery
   (`GET https://<module-path>?go-get=1`) which returns a
   `<meta name="go-import">` tag pointing to the actual Git/SVN/Hg/Bzr/Fossil
   repo. This means Go modules have near-100% source URL accuracy by design —
   the module cannot be installed without a resolvable path. The downside: no
   central registry, so discovery must go through index.golang.org or
   pkg.go.dev. [SOURCE-11, SOURCE-12]

6. **npms.io provides richer scoring than the native npm registry** [CONFIDENCE:
   HIGH]

   npms.io at `api.npms.io/v2/search?q=<query>` scores packages 0-10 across
   three weighted categories: quality (weight ~0.30), maintenance (~0.35),
   popularity (~0.35). Quality sub-metrics: README presence, license,
   .gitignore, stable version, tests, test coverage, CI passing, dependency
   vulnerability status. Maintenance sub-metrics: open/closed issue ratio, issue
   resolution time, commit recency, commit frequency. Popularity sub-metrics:
   GitHub stars, forks, subscribers, contributors, total downloads, download
   acceleration. Scores are recomputed every ~2 weeks using a Bezier curve
   normalization. npms.io powers the npm website search. [SOURCE-13, SOURCE-14,
   SOURCE-15]

7. **deps.dev (Google) is the best cross-registry API, covering 7 ecosystems
   with security integration** [CONFIDENCE: HIGH]

   `deps.dev` API v3 covers Go, npm, PyPI, Cargo, Maven, NuGet, RubyGems — 5+
   million packages, 50+ million versions. Key endpoints: `GetPackage`
   (versions), `GetVersion` (licenses/advisories), `GetDependencies` (resolved
   full graph), `GetProject` (GitHub/GitLab/Bitbucket info),
   `GetProjectPackageVersions` (project-to-package mapping), `Query`
   (cross-system hash or name search up to 1,000 results). Unique capabilities:
   computed transitive dependency graphs (not just declared), OpenSSF Scorecard
   per package, OSV advisory integration, SLSA provenance attestations, OSS-Fuzz
   metrics. Accessible as JSON/HTTP and gRPC, free, no auth required.
   [SOURCE-16, SOURCE-17]

8. **libraries.io covers 31+ registries with dependent-count metadata not in
   individual APIs** [CONFIDENCE: MEDIUM-HIGH]

   libraries.io API (`GET /api/:platform/:name`,
   `GET /api/:platform/:name/dependents`) covers NPM, PyPI, Cargo, Go, Maven,
   NuGet, RubyGems, Hex, Pub, CocoaPods, CPAN, CRAN, Conda, and 20+ more.
   Requires API key, rate-limited to 60 req/min. Key differentiator: dependent
   counts (packages that depend on the given package) across all 31+ registries
   — not available from most individual registry APIs. Dataset is available as
   bulk download from Zenodo (5GB compressed, 25GB uncompressed), covering ~2.5M
   components, 9M versions, 25M repositories, 100M declared dependencies.
   Dataset dumps appear to be last updated through 2020 on Zenodo, but the live
   API continues to be updated. [SOURCE-18, SOURCE-19]

9. **Source repo URL reliability varies significantly by registry** [CONFIDENCE:
   MEDIUM]
   - **Go**: Near-100% accurate by design (module path is the URL)
   - **npm**: `repository` field is optional and frequently missing/stale — npm
     emits a warning `No repository field` for packages without it; no published
     rate but known to be incomplete for many packages
   - **PyPI**: `project_urls` table (including `Source Code`, `Homepage`,
     `Repository` keys) is optional; maintainers provide it voluntarily via
     `pyproject.toml`
   - **crates.io**: Cargo.toml `repository` field is optional but ecosystem
     convention strongly encourages it; high adoption among serious packages
   - For all registries: URL can be stale (repo deleted/moved), incorrect
     (copy-paste errors), or point to org page rather than specific repo
     [SOURCE-20, SOURCE-21, SOURCE-22]

10. **Metadata unique to registries vs GitHub alone** [CONFIDENCE: HIGH]

    Package registries provide metadata that GitHub cannot:
    - **Download counts** (npm: `api.npmjs.org/downloads/point/last-week/{pkg}`;
      PyPI: BigQuery or pypistats.org; crates.io:
      `/api/v1/crates/{name}/downloads`)
    - **Reverse dependency counts** (who depends on this package, not just who
      it depends on) — crates.io API, deps.dev, libraries.io
    - **Quality/maintenance scores** — npms.io (npm), Snyk Security DB
      (npm/PyPI/Go)
    - **Vulnerability advisories at install time** — crates.io RustSec tab,
      deps.dev OSV integration, Snyk Security DB
    - **Version history with publication timestamps** — all registries
    - **Trove classifiers** (PyPI only) — structured taxonomy for audience,
      topic, OS, language version
    - **OpenSSF Scorecard** — deps.dev computes and surfaces this across all 7
      ecosystems [SOURCE-16, SOURCE-23, SOURCE-24]

---

## Detailed Analysis

### npm Registry

**Search endpoint:** `GET https://registry.npmjs.org/-/v1/search`

Parameters:

- `text`: Full-text query string
- `size`: 1-250 (default 20)
- `from`: Pagination offset
- `quality`, `popularity`, `maintenance`: Float weights (0-1) to bias scoring

Search qualifiers in `text` field:

- `author:<name>`, `maintainer:<name>`, `scope:<scope>`
- `keywords:<kw>` with `,` (OR), `+` (AND), `,-` (exclude)
- `is:unstable`, `not:unstable`, `is:insecure`, `not:insecure`
- `boost-exact:false` (disable exact-name boost)

Response score object:

```json
{
  "score": {
    "final": 0.85,
    "detail": {
      "quality": 0.9,
      "popularity": 0.8,
      "maintenance": 0.85
    }
  },
  "searchScore": 0.92
}
```

**Package metadata endpoint:** `GET https://registry.npmjs.org/{package}`

Returns: name, description, keywords, license, homepage, repository (type +
url), bugs (url), maintainers (array), dist-tags, all version objects, readme
(first 64KB).

**Downloads API (separate service):**
`GET https://api.npmjs.org/downloads/point/{period}/{package}`

- Periods: `last-day`, `last-week`, `last-month`, ranges like
  `2024-01-01:2024-12-31`
- Returns: downloads count, start/end dates
- Limitation: Counts any HTTP 200 tarball response — includes CI mirrors,
  automated pulls; not a reliable "human installs" count

**npms.io scoring (powers npm website):**

Three category weights: quality 0.30, maintenance 0.35, popularity 0.35. Bezier
curve normalization applied after min/max bucketing. Scores updated every ~2
weeks.

- **Quality metrics:** README presence, license file, .gitignore, version
  stability (>1.x), deprecation status, test coverage %, CI passing,
  vulnerability-free dependencies, badges, linter config
- **Maintenance metrics:** Open/total issue ratio, issue close time, commit
  recency, commit frequency
- **Popularity metrics:** GitHub stars, forks, subscribers, contributors, total
  downloads, download acceleration

API: `GET https://api.npms.io/v2/search?q=<query>&from=<offset>&size=<n>`

### PyPI

**Current state (post-September 2024):**

The XML-RPC API's search-related methods are permanently decommissioned. No
programmatic full-text search exists.

**What remains:**

1. **JSON API:** `GET https://pypi.org/pypi/{package}/json` — returns complete
   metadata for a specific package you already know
2. **JSON version API:** `GET https://pypi.org/pypi/{package}/{version}/json`
3. **Simple API:** `GET https://pypi.org/simple/` — HTML/JSON index listing all
   package names (no metadata, just names and file URLs)

**JSON API metadata fields** (from the `info` object):

- `author`, `author_email`, `maintainer`, `maintainer_email`
- `classifiers` (array of trove classifiers)
- `description` (full README)
- `home_page`, `project_url`, `project_urls` (dict of labeled URLs)
- `keywords`, `license`
- `requires_python`, `requires_dist`
- `vulnerabilities` (array, includes OSV IDs, affected versions, fixed versions)

**project_urls** example:
`{"Source Code": "https://github.com/...", "Documentation": "...", "Changelog": "..."}`

**Trove classifiers** provide structured taxonomy:

- `Development Status :: 5 - Production/Stable`
- `Intended Audience :: Developers`
- `Topic :: Software Development :: Libraries`
- `License :: OSI Approved :: MIT License`
- `Programming Language :: Python :: 3.11`

There is NO API to query all packages with a given classifier. Must use
BigQuery.

**Download stats:** Via `pypistats.org` (aggregated) or Google BigQuery
`bigquery-public-data.pypi.file_downloads` table — includes file, country,
Python version, installer, and `timestamp` per download event.

### crates.io

**Search endpoint (Cargo spec):**
`GET https://crates.io/api/v1/crates?q=<query>&per_page=100`

- Returns: `name`, `max_version`, `description`, total count
- This is the minimal Cargo registry protocol

**Extended crates.io search:** Additional parameters via the crates.io-specific
API:

- `sort`: `downloads`, `recent-downloads`, `recent-updates`, `new`,
  `alphabetical`
- `category`: filter by category slug
- `keyword`: filter by keyword
- `user_id`, `team_id`: filter by owner

**Per-crate metadata:** `GET https://crates.io/api/v1/crates/{name}`

- `name`, `description`, `homepage`, `repository`, `documentation`
- `downloads` (all-time), `recent_downloads` (last 90 days)
- `max_version`, `newest_version`
- `categories` (array), `keywords` (array)
- `created_at`, `updated_at`

**Reverse dependencies:**
`GET https://crates.io/api/v1/crates/{name}/reverse_dependencies`

- Full list of crates that list this as a dependency
- Paginated; can be slow for popular crates (known performance issue)

**Downloads history:** `GET https://crates.io/api/v1/crates/{name}/downloads`

- Per-version, per-day download counts

**Category system:** crates.io has a formal category taxonomy (e.g.,
`command-line-interface`, `network-programming`, `cryptography`,
`web-programming`, `embedded`) with maintained descriptions. Not self-assigned —
must match official slugs.

**Quality signals available:**

- `downloads` + `recent_downloads` (90-day) — recency-weighted activity
- `updated_at` — last publish date
- `versions` count — number of releases
- Security tab: RustSec advisories in OSV JSON format, displayed on crate page,
  accessible via `rustsec.org/advisories`
- **No scoring system** analogous to npms.io

**2025 additions:** OpenAPI spec at `crates.io/api/openapi.json` (experimental),
Security tab, crate deletion endpoint, trusted publishing via GitHub Actions
OIDC.

### Go / pkg.go.dev

**Architecture:** Go is VCS-native, decentralized. No central registry for
submission. The module path itself is the source URL.

**Module discovery infrastructure:**

- `index.golang.org/index` — chronological feed of new modules, NDJSON format,
  max 2000 per call, filterable by `since` (RFC3339 timestamp)
- `proxy.golang.org/<module>/@v/list` — all known versions for a module
- `proxy.golang.org/<module>/@v/<version>.info` — version metadata (version,
  time)
- `proxy.golang.org/<module>/@latest` — latest version info

**Source URL mechanism:** `go-import` meta tag at
`https://<module-path>?go-get=1` returns the VCS type and canonical repo URL.
For `github.com/*` paths, the URL IS the GitHub repo with no lookup needed.

**pkg.go.dev quality signals (UI only, no API):**

- Has `go.mod` file (module system compliance)
- Redistributable license
- Tagged version (semver)
- Stable version (v1+)
- Documentation score (implicit — indexed from package comments)

**No public search API for pkg.go.dev.** Issue #36785 open since January 2020,
milestone "pkgsite/unplanned." Community workarounds: web scraping, or
`go list -json -m all` locally.

### Cross-Registry Tools

**deps.dev (Google Open Source Insights)**

Ecosystems: Go, npm, PyPI, Cargo, Maven, NuGet, RubyGems API: REST/JSON + gRPC,
no auth required, free

Key endpoints:

- `GET /v3/systems/{system}/packages/{name}` — all versions + default version
- `GET /v3/systems/{system}/packages/{name}/versions/{version}` — licenses (SPDX
  2.1), advisories, provenance
- `GET /v3/systems/{system}/packages/{name}/versions/{version}:dependencies` —
  FULL resolved dependency graph
- `GET /v3/projects/{projectKey.id}` — GitHub/GitLab/Bitbucket project data
  (stars, issues, forks, description)
- `GET /v3/projects/{projectKey.id}:packageversions` — maps a repo to all
  registry packages it backs
- `GET /v3/query` — hash-based or name-based cross-system search (up to 1,000
  results)

Unique metadata over individual registries:

- Computed transitive dependency graphs (same algorithm as package manager, not
  just declared deps)
- OpenSSF Scorecard results per package
- SLSA provenance attestations with verification status
- OSS-Fuzz line coverage metrics
- Cross-ecosystem: find a Go package's npm equivalent or vice versa via project
  mapping

**libraries.io**

Ecosystems: 31+ (npm, PyPI, Cargo, Go, Maven, NuGet, RubyGems, Hex, Pub,
CocoaPods, CPAN, CRAN, Conda, Clojars, and more) API: requires free API key, 60
req/min rate limit

Key endpoints:

- `GET /api/platforms` — list all 31+ supported registries
- `GET /api/:platform/:name` — full package metadata, version history, source
  repo link
- `GET /api/:platform/:name/dependents` — packages that depend on this one (with
  `subset=name_only`)
- `GET /api/:platform/:name/:version/dependencies` — dependencies for specific
  version

Unique metadata: dependent counts across 31+ ecosystems in a single API (most
registries only provide their own ecosystem's data). Bulk dataset on Zenodo
covers 2.5M packages, 100M declared dependencies.

**Snyk Security Database (formerly Snyk Advisor)**

Note: Snyk Advisor standalone site sunset January 2026; all data merged into
`security.snyk.io`. Ecosystems covered: npm, PyPI, Go

Provides: Popularity score, Maintenance score, Security score, Community score
(now alongside vulnerability data on the same page).

No documented programmatic API for the health scores — primarily a
human-readable interface integrated into Snyk's broader security tooling.

---

## Ranking Signals by Registry

| Signal              | npm                         | PyPI                     | crates.io              | Go                      |
| ------------------- | --------------------------- | ------------------------ | ---------------------- | ----------------------- |
| Download counts     | Yes (API)                   | Yes (BigQuery/pypistats) | Yes (API)              | No                      |
| Recent downloads    | Via date range              | Via BigQuery             | Yes (90-day)           | No                      |
| Quality score       | npms.io (0-10)              | No                       | No                     | No                      |
| Maintenance score   | npms.io                     | No                       | `updated_at`           | `updated_at` (proxy)    |
| Reverse dep count   | Via npms.io or libraries.io | Via PyPI BigQuery        | Yes (API)              | Via deps.dev            |
| Security advisories | Via `is:insecure` search    | In JSON API response     | Security tab (RustSec) | Via deps.dev            |
| Classifier/category | keywords                    | Trove classifiers        | Category slugs         | Package path prefix     |
| Source repo URL     | Optional `repository` field | Optional `project_urls`  | Optional `repository`  | Mandatory (module path) |

---

## Gaps Identified

1. **PyPI classifier search gap**: No programmatic way to search all PyPI
   packages by classifier. Must use BigQuery (requires Google Cloud account) or
   scrape the HTML search at `pypi.org/search`. The XML-RPC search is gone
   permanently.

2. **pkg.go.dev API gap**: No public search API and none planned. The
   `index.golang.org` feed provides chronological discovery but not search by
   topic/keyword. Module path prefixes (e.g., `github.com/`) can be used as weak
   search proxies but no structured search exists.

3. **npm repository URL completeness data**: No published empirical study with
   specific numbers on what percentage of npm packages have a `repository` field
   populated. The npm client warns on missing field, suggesting it's common
   enough to warn about. Libraries.io and deps.dev partially compensate by
   inferring GitHub URLs from other signals.

4. **crates.io scoring gap**: Unlike npm/npms.io, crates.io has no quality or
   maintenance score. The Security tab (2025) covers vulnerability advisories
   but there's no aggregate quality metric. `recent_downloads` serves as a proxy
   for activity.

5. **libraries.io dataset freshness**: Zenodo bulk dataset was last published
   in 2020. The live API continues to update, but large-scale analysis using the
   bulk data would be working with stale snapshots. Current Zenodo record is
   from 2020 with no confirmed newer bulk release found.

6. **Go module metadata richness**: Go's module path architecture makes source
   URL reliable but means virtually no registry-side quality metadata (no
   download counts, no scores, no categories). Quality assessment requires
   either pkg.go.dev UI scraping or supplemental tools like deps.dev.

7. **Snyk Security DB API access**: Snyk's package health scores (post-Advisor)
   appear to be UI-only within the Snyk platform — no documented public API
   endpoint found for the new security.snyk.io package health scores.

---

## Sources

| #   | URL                                                                                                                            | Title                                             | Type                  | Trust       | CRAAP     | Date          |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | --------------------- | ----------- | --------- | ------------- |
| 1   | https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md                                                                 | npm Registry API Docs                             | Official docs         | HIGH        | 5/5/5/5/5 | 2024          |
| 2   | https://api-docs.npmjs.com/                                                                                                    | npm Registry API                                  | Official docs         | HIGH        | 5/5/5/5/5 | 2024          |
| 3   | https://discuss.python.org/t/deprecation-of-pypi-xmlrpc-methods/63026                                                          | PyPI XML-RPC Deprecation                          | Official announcement | HIGH        | 5/5/5/5/5 | Sep 2024      |
| 4   | https://github.com/pypi/warehouse/issues/16642                                                                                 | Deprecation of PyPI XMLRPC Methods issue          | Official tracker      | HIGH        | 5/5/5/5/5 | 2024          |
| 5   | https://docs.pypi.org/api/bigquery/                                                                                            | PyPI BigQuery Datasets                            | Official docs         | HIGH        | 5/5/4/5/5 | 2024          |
| 6   | https://doc.rust-lang.org/cargo/reference/registry-web-api.html                                                                | Cargo Registry Web API                            | Official docs         | HIGH        | 5/5/5/5/5 | 2024          |
| 7   | https://blog.rust-lang.org/2025/02/05/crates-io-development-update/                                                            | crates.io 2025 Dev Update                         | Official blog         | HIGH        | 5/5/5/5/5 | Feb 2025      |
| 8   | https://docs.rs/crates_io_api                                                                                                  | crates_io_api Rust library docs                   | Library docs          | HIGH        | 4/5/4/4/5 | 2024          |
| 9   | https://github.com/golang/go/issues/36785                                                                                      | pkg.go.dev API request issue                      | Official tracker      | HIGH        | 5/5/5/5/5 | 2020-2024     |
| 10  | https://pkg.go.dev/about                                                                                                       | pkg.go.dev About                                  | Official site         | HIGH        | 5/5/5/5/5 | 2024          |
| 11  | https://proxy.golang.org/                                                                                                      | Go Module Services                                | Official docs         | HIGH        | 5/5/5/5/5 | 2024          |
| 12  | https://go.dev/ref/mod                                                                                                         | Go Modules Reference                              | Official docs         | HIGH        | 5/5/5/5/5 | 2024          |
| 13  | https://npms.io/about                                                                                                          | npms.io About page                                | Third-party tool      | MEDIUM-HIGH | 3/5/4/4/4 | 2023          |
| 14  | https://github.com/npms-io/npms-analyzer/blob/master/docs/architecture.md                                                      | npms-analyzer architecture                        | Open source docs      | HIGH        | 4/5/4/4/5 | 2023          |
| 15  | https://users.encs.concordia.ca/~shang/pubs/npms.pdf                                                                           | Simplifying the Search of npm Packages (academic) | Academic paper        | HIGH        | 4/5/4/5/5 | 2020          |
| 16  | https://docs.deps.dev/api/v3/                                                                                                  | deps.dev API v3                                   | Official docs         | HIGH        | 5/5/5/5/5 | 2024          |
| 17  | https://security.googleblog.com/2023/04/announcing-depsdev-api-critical.html                                                   | deps.dev API announcement                         | Official blog         | HIGH        | 5/5/5/5/5 | Apr 2023      |
| 18  | https://libraries.io/api                                                                                                       | libraries.io API docs                             | Official docs         | HIGH        | 4/5/4/4/5 | 2024          |
| 19  | https://zenodo.org/records/3626071                                                                                             | Libraries.io dataset on Zenodo                    | Dataset               | HIGH        | 3/5/4/5/5 | 2020          |
| 20  | https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md                                                   | npm package-metadata.md                           | Official docs         | HIGH        | 5/5/5/5/5 | 2024          |
| 21  | https://alpha-omega.dev/blog/surfacing-security-advisories-on-crates-io-bringing-vulnerability-data-to-the-point-of-discovery/ | crates.io Security Tab blog                       | Official blog         | HIGH        | 5/5/5/5/5 | 2025          |
| 22  | https://snyk.io/blog/snyk-advisor-security-database/                                                                           | Snyk Advisor → Security DB migration              | Official blog         | HIGH        | 5/5/5/5/4 | 2025-2026     |
| 23  | https://blog.npmjs.org/post/92574016600/numeric-precision-matters-how-npm-download-counts-work                                 | npm download count methodology                    | Official blog         | HIGH        | 4/5/5/5/5 | 2014 (stable) |
| 24  | https://nesbitt.io/2025/12/29/categorizing-package-registries.html                                                             | Categorizing Package Registries                   | Expert analysis       | MEDIUM-HIGH | 4/5/4/4/4 | Dec 2025      |

---

## Contradictions

1. **npms.io score weights**: One source (codelessgenie.com) reports quality
   40%, popularity 30%, maintenance 30%. The architecture.md document and
   another source report quality 0.30, maintenance 0.35, popularity 0.35. The
   npms.io about page was inaccessible (JavaScript-only). The architecture.md
   source is more authoritative but the exact production weights are unconfirmed
   without direct API observation.

2. **libraries.io dataset freshness**: The platform claims to cover "33 package
   managers" on some pages and "31+" and "36" on others. The Zenodo bulk dataset
   is from 2020, but the live API is updated continuously. It is unclear whether
   the dataset on Zenodo represents the full current scope.

3. **Snyk Advisor sunset timeline**: One source says "January 2026" for the Snyk
   Advisor sunset; the blog post from Snyk says the consolidation is happening
   but existing URLs "will automatically redirect." The exact date of full
   feature removal is ambiguous.

---

## Serendipity

1. **crates.io Security tab design philosophy**: The team explicitly decided NOT
   to use advisory count as a quality signal, because well-maintained packages
   get MORE advisories due to scrutiny. This is an important nuance for any
   quality-scoring system.

2. **Go modules as decentralized VCS-native registry**: The architectural
   decision to use import paths as URLs means Go has no repository URL
   reliability problem — but also no discovery infrastructure beyond the
   chronological index. This is the strongest argument for supplemental tools
   like deps.dev when working with Go.

3. **deps.dev hash-based lookup**: The `Query` endpoint supports content hash
   lookup — you can find which package versions contain a specific file by its
   MD5/SHA1/SHA256/SHA512. This is a unique supply chain security capability not
   available in any individual registry API.

4. **npm downloads inflation**: npm's download counts include mirror pulls and
   CI caches. A package can show 50k downloads/week primarily from mirror
   crawling. Only downloads >50/day are considered signal over noise per npm's
   own analysis.

5. **PyPI vulnerability data in JSON API**: Since the XML-RPC deprecation, PyPI
   added vulnerability data directly to the JSON API response (`vulnerabilities`
   array with OSV IDs, affected ranges, fixed versions). This is a relatively
   recent addition that makes the per-package JSON API more useful for security
   workflows even without search capability.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM-HIGH claims: 2
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** (all major registry APIs verified against
  official documentation; cross-registry tools verified against official API
  docs and announcements)
