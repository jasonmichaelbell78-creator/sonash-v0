<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Website Analysis Reference

Output schemas, value axes, absence patterns, Creator View template, Engineer
View dimensions, scoring bands, compliance pre-flight, link scoring, URL-to-slug
algorithm, Expedition mode, Site mode, routing menu, agent allocation, state
file schema, and tool fallback matrix for the website-analysis skill.

---

## 1. Output Schemas

### 1.0 Directory Structure

Per-site artifacts in `.research/website-analysis/<site-slug>/` (Decisions #5,
#12):

```
<site-slug>/
├── analysis.json          # Core analysis (shared schema + website extensions)
├── findings.jsonl         # Per-finding records (shared schema)
├── value-map.json         # Knowledge candidates ranked (shared schema)
├── links.json             # Scored link candidates (website-only)
├── assets.json            # Images, downloadable files (website-only)
├── tables.json            # Extracted HTML tables (website-only, Decision #26)
├── meta.json              # Site metadata: OG, JSON-LD, etc. (website-only)
├── sitemap.json           # Site structure map (website-only)
├── SITE-ANALYSIS.md       # Human-readable Creator View report
├── trends.jsonl           # Append-only per-run tracking
└── expedition-*.{meta.json,snap.json,jsonl}  # Expedition state (Decision #18)
```

Cross-entity in `.research/`:

```
extraction-journal.jsonl   # Append-only extraction decisions (shared, Decision #8)
EXTRACTIONS.md             # Auto-regenerated grouped view (shared)
reading-chain.jsonl        # Cross-site relationships (shared)
research-index.jsonl       # Extended with website type fields
```

### 1.1 `analysis.json`

Top-level analysis result. Consumed by `/deep-plan` as research context and by
resume detection on re-invocation.

```json
{
  "schema_version": "1.0",
  "meta": {
    "url": "https://example.com/article",
    "domain": "example.com",
    "slug": "example-com--article",
    "scan_date": "YYYY-MM-DD",
    "scan_depth": "quick|standard|deep",
    "scan_mode": "page|site|expedition",
    "scan_version": "1.0",
    "extraction_mode": "superpowers-chrome|webfetch-playwright|webfetch-only",
    "pages_analyzed": 1
  },
  "site_type": "Blog|Documentation|SPA/App|E-commerce|Curated List|Forum/Community|News/Media|API Docs|Government|Academic|Portfolio|Landing Page|Registry/Directory|Tool/Utility|Social Media",
  "site_type_secondary": "string|null",
  "site_type_confidence": 0.85,
  "ecosystem_tags": ["react", "performance", "css"],
  "tech_stack": ["Next.js", "Tailwind CSS", "Vercel"],
  "site": {
    "title": "Example Site",
    "description": "Site meta description",
    "author": "string|null",
    "language": "en",
    "last_modified": "ISO8601|null",
    "has_rss": true,
    "rss_url": "https://example.com/feed.xml|null"
  },
  "value_axes": {
    "content_depth": { "score": 4, "band": "Excellent", "detail": "..." },
    "content_freshness": { "score": 3, "band": "Healthy", "detail": "..." },
    "editorial_stance": { "score": 3, "band": "Healthy", "detail": "..." },
    "information_architecture": {
      "score": 4,
      "band": "Excellent",
      "detail": "..."
    },
    "link_graph_quality": { "score": 2, "band": "Needs Work", "detail": "..." },
    "visual_design_philosophy": {
      "score": 3,
      "band": "Healthy",
      "detail": "..."
    },
    "audience_assumed_expertise": {
      "score": 3,
      "band": "Healthy",
      "detail": "..."
    },
    "source_attribution": { "score": 4, "band": "Excellent", "detail": "..." },
    "content_authenticity": {
      "score": 4,
      "band": "Excellent",
      "detail": "..."
    },
    "monetization_pressure": {
      "score": 4,
      "band": "Excellent",
      "detail": "..."
    },
    "community_signal": { "score": 2, "band": "Needs Work", "detail": "..." },
    "entity_authority": { "score": 3, "band": "Healthy", "detail": "..." },
    "structural_completeness": {
      "score": 3,
      "band": "Healthy",
      "detail": "..."
    }
  },
  "engineer_dimensions": {
    "performance": { "score": 72, "band": "Healthy", "detail": "..." },
    "security_headers": { "score": 85, "band": "Excellent", "detail": "..." },
    "accessibility": { "score": 60, "band": "Healthy", "detail": "..." },
    "seo": { "score": 78, "band": "Excellent", "detail": "..." },
    "technical_stack": { "score": 70, "band": "Healthy", "detail": "..." },
    "mobile_readiness": { "score": 65, "band": "Healthy", "detail": "..." }
  },
  "summary_bands": {
    "Content Quality": { "score": 78, "band": "Excellent" },
    "Technical Health": { "score": 72, "band": "Healthy" },
    "Creator Value": { "score": 85, "band": "Excellent" }
  },
  "absence_patterns": [
    { "pattern": "DEAD_BLOG", "confidence": "Medium", "evidence": "..." }
  ],
  "creator_verdict": {
    "verdict": "Study|Explore|Extract|Note",
    "verdict_score": 78,
    "recommendation": "One-sentence creator recommendation"
  },
  "compliance": {
    "status": "PROCEED|WARN|HARD_BLOCK",
    "robots_txt": "allowed|disallowed|not_found",
    "cf_mitigated": false,
    "x_robots_tag": "none|noindex|nofollow|noindex, nofollow|<raw header value>",
    "llms_txt": "not_found|allowed|restricted",
    "rss_available": false,
    "rss_url": "string|null",
    "notes": "Optional compliance details"
  }
}
```

**Field definitions:**

| Field                   | Type   | Description                                                       |
| ----------------------- | ------ | ----------------------------------------------------------------- |
| `schema_version`        | string | Schema version (`"1.0"`)                                          |
| `meta.url`              | string | Analyzed URL                                                      |
| `meta.domain`           | string | Domain extracted from URL                                         |
| `meta.slug`             | string | URL-to-slug result (Section 9)                                    |
| `meta.scan_date`        | string | Date of analysis (YYYY-MM-DD)                                     |
| `meta.scan_depth`       | string | Depth tier: `quick`, `standard`, or `deep`                        |
| `meta.scan_mode`        | string | Mode: `page`, `site`, or `expedition`                             |
| `meta.scan_version`     | string | Skill version used for this analysis                              |
| `meta.extraction_mode`  | string | Which extraction pipeline was used                                |
| `meta.pages_analyzed`   | number | Total pages analyzed (1 for page mode)                            |
| `site_type`             | string | Primary classification (15-type taxonomy, Section 1.8)            |
| `site_type_secondary`   | string | Secondary type (null if single-type)                              |
| `site_type_confidence`  | number | Classification confidence (0.0-1.0)                               |
| `ecosystem_tags`        | array  | Lightweight tags for synthesis (e.g., `["react", "performance"]`) |
| `tech_stack`            | array  | Detected technologies (CMS, frameworks, hosting)                  |
| `site.*`                | object | Site metadata (title, description, author, etc.)                  |
| `value_axes.*`          | object | Per-axis: score (1-5), band, and detail string                    |
| `engineer_dimensions.*` | object | Per-dimension: score (0-100), band, and detail string             |
| `summary_bands.*`       | object | 3-band summary: Content Quality, Technical Health, Creator Value  |
| `absence_patterns`      | array  | Objects with pattern name, confidence, and evidence               |
| `creator_verdict`       | object | Creator lens verdict (Study/Explore/Extract/Note)                 |
| `compliance`            | object | Compliance pre-flight result                                      |

**Shared field parity with repo-analysis:** `schema_version`, `meta.scan_date`,
`meta.scan_depth`, `meta.scan_version`, `ecosystem_tags`, `absence_patterns`,
`summary_bands` structure. Website-specific extensions are additive fields, not
renames.

### 1.2 `findings.jsonl`

One record per finding. Shared schema with repo-analysis plus website-specific
extensions.

```jsonl
{
  "schema_version": "1.0",
  "id": "F001",
  "severity": "high|medium|low|info",
  "category": "content|technical|compliance|absence",
  "dimension": "content_depth|security_headers|...",
  "title": "No HTTPS enforcement detected",
  "detail": "Full finding description with evidence",
  "recommendation": "Recommended action",
  "source_url": "https://example.com/page",
  "source_mode": "static|js-rendered|webfetch"
}
```

**Field definitions:**

| Field            | Type   | Required | Description                                                                   |
| ---------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `schema_version` | string | Yes      | Schema version (`"1.0"`)                                                      |
| `id`             | string | Yes      | Finding ID (F001, F002, etc.)                                                 |
| `severity`       | string | Yes      | `high`, `medium`, `low`, or `info`                                            |
| `category`       | string | Yes      | `content`, `technical`, `compliance`, `absence`, or `cautionary`              |
| `dimension`      | string | Yes      | Value axis or engineer dimension ID                                           |
| `title`          | string | Yes      | Short finding title                                                           |
| `detail`         | string | Yes      | Full description with evidence                                                |
| `recommendation` | string | Yes      | Recommended action                                                            |
| `source_url`     | string | Yes      | URL where finding was detected (website extension)                            |
| `source_mode`    | string | Yes      | Extraction mode used: `static`, `js-rendered`, `webfetch` (website extension) |

### 1.3 `value-map.json`

Ranked list of knowledge extraction candidates. Produced by Standard and Deep
modes. Updated with extraction decisions when user acts on candidates.

```json
{
  "schema_version": "1.0",
  "url": "https://example.com",
  "scan_date": "YYYY-MM-DD",
  "extraction_candidates": [
    {
      "rank": 1,
      "name": "CSS Reset Methodology",
      "location": "https://example.com/css/reset",
      "description": "What the knowledge item is and why it matters",
      "candidate_type": "concept|tool|example|dataset|pattern|methodology",
      "pattern_novelty": "High|Med|Low",
      "quality_signal": "High|Med|Low",
      "extraction_effort": "E0|E1|E2",
      "objective_score": 85,
      "personal_fit_score": 72,
      "fit_class": "active-sprint|park-for-later|evergreen|not-relevant",
      "confidence": "High|Med|Low",
      "notes": "Adaptation requirements, context",
      "status": "identified|selected|extracted|integrated|skipped",
      "decision_date": "ISO8601 or null",
      "decision_notes": "Why this decision was made"
    }
  ],
  "related_sites": [
    {
      "url": "https://related-site.com",
      "relationship": "referenced-by|links-to|similar-to|contrast|extends",
      "discovery_context": "How this relationship was discovered"
    }
  ]
}
```

**Required fields:**

| Field                | Type   | Description                                                                                                    |
| -------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `rank`               | number | Priority rank by composite value signal                                                                        |
| `name`               | string | Short descriptive name for the knowledge candidate                                                             |
| `location`           | string | Source URL or page path                                                                                        |
| `description`        | string | What the item is and why it matters                                                                            |
| `candidate_type`     | string | `concept`, `tool`, `example`, `dataset`, `pattern`, or `methodology` (website extension)                       |
| `pattern_novelty`    | string | Does this site offer something we do not? High/Med/Low                                                         |
| `quality_signal`     | string | Is this knowledge better than what we have? High/Med/Low                                                       |
| `extraction_effort`  | string | E0 (read/study), E1 (experiment/prototype), E2 (significant adaptation)                                        |
| `objective_score`    | number | Objective value score (0-100), context-independent                                                             |
| `personal_fit_score` | number | Personal fit to active projects (0-100), sprint-dependent                                                      |
| `fit_class`          | string | Derived: `active-sprint` (fit>=60), `park-for-later` (fit<60, obj>=60), `evergreen` (both>=40), `not-relevant` |
| `confidence`         | string | Confidence in the assessment: High/Med/Low                                                                     |
| `notes`              | string | Context, adaptation requirements                                                                               |

**Extraction effort levels (adapted for websites):**

| Level | Label                  | Description                                               |
| ----- | ---------------------- | --------------------------------------------------------- |
| E0    | Read/study             | Read and understand; knowledge transfer only              |
| E1    | Experiment             | Requires prototyping or testing to validate applicability |
| E2    | Significant adaptation | Complex knowledge requiring major context translation     |

**Fit badge derivation (shared with repo-analysis):**

| Condition                                            | Badge             |
| ---------------------------------------------------- | ----------------- |
| `personal_fit_score >= 60`                           | `[ACTIVE-SPRINT]` |
| `personal_fit_score < 60 AND objective_score >= 60`  | `[PARK]`          |
| `objective_score >= 40 AND personal_fit_score >= 40` | `[EVERGREEN]`     |
| Otherwise                                            | (no badge)        |

### 1.4 `links.json` (website-only)

Scored link candidates from the analyzed page(s). Produced by Standard and Deep
modes. The primary artifact for Expedition mode link selection.

```json
{
  "schema_version": "1.0",
  "source_url": "https://example.com",
  "scan_date": "YYYY-MM-DD",
  "total_links": 74,
  "external_links": 42,
  "internal_links": 32,
  "scored_links": [
    {
      "url": "https://linked-site.com/article",
      "anchor_text": "Descriptive anchor text",
      "link_type": "tutorial|reference|academic-paper|tool-library|long-form-article|community-discussion|video|social-media|marketing|press-release",
      "link_tier": "HIGH|MEDIUM|LOW",
      "is_external": true,
      "semantic_container": "article|main|section|aside|nav|header|footer",
      "scores": {
        "context_relevance": 0.85,
        "anchor_quality": 0.7,
        "position": 0.9,
        "url_pattern": 0.6,
        "link_type_score": 0.3,
        "novelty": 0.1,
        "alive_check": 0.05,
        "composite": 0.78
      },
      "alive_status": "200|301|404|timeout|unchecked",
      "domain": "linked-site.com"
    }
  ]
}
```

**Field definitions:**

| Field                               | Type    | Description                             |
| ----------------------------------- | ------- | --------------------------------------- |
| `total_links`                       | number  | Total link count on page                |
| `external_links`                    | number  | Links to other domains                  |
| `internal_links`                    | number  | Links within same domain                |
| `scored_links[].url`                | string  | Target URL                              |
| `scored_links[].anchor_text`        | string  | Link text                               |
| `scored_links[].link_type`          | string  | Classified link type (Section 8)        |
| `scored_links[].link_tier`          | string  | HIGH, MEDIUM, or LOW (Section 8)        |
| `scored_links[].is_external`        | boolean | Whether link points to different domain |
| `scored_links[].semantic_container` | string  | HTML5 container element                 |
| `scored_links[].scores`             | object  | Per-component scores (Section 8)        |
| `scored_links[].alive_status`       | string  | HTTP status from HEAD check             |
| `scored_links[].domain`             | string  | Target domain for deduplication         |

### 1.5 `assets.json` (website-only)

Images, PDFs, and downloadable files discovered during extraction.

```json
{
  "schema_version": "1.0",
  "source_url": "https://example.com",
  "scan_date": "YYYY-MM-DD",
  "assets": [
    {
      "url": "https://example.com/images/diagram.png",
      "type": "image|pdf|document|archive|video|audio",
      "alt_text": "Architecture diagram",
      "context": "Found in main content, section 'Architecture'",
      "size_bytes": 245000,
      "mime_type": "image/png"
    }
  ]
}
```

### 1.6 `tables.json` (website-only, Decision #26)

Extracted HTML tables with structure preservation. JSON format handles complex
tables (merged cells, headers) better than markdown.

```json
{
  "schema_version": "1.0",
  "source_url": "https://example.com",
  "scan_date": "YYYY-MM-DD",
  "tables": [
    {
      "id": "T001",
      "caption": "Browser Compatibility",
      "source_section": "H2: Compatibility",
      "headers": ["Browser", "Version", "Support"],
      "rows": [
        ["Chrome", "120+", "Full"],
        ["Firefox", "119+", "Full"],
        ["Safari", "17+", "Partial"]
      ],
      "row_count": 3,
      "col_count": 3,
      "has_merged_cells": false
    }
  ]
}
```

### 1.7 `meta.json` (website-only)

Site metadata extracted from Open Graph, JSON-LD, Twitter Card, and standard
HTML meta tags.

```json
{
  "schema_version": "1.0",
  "source_url": "https://example.com",
  "scan_date": "YYYY-MM-DD",
  "open_graph": {
    "og:title": "Example Article",
    "og:description": "A description of the article",
    "og:type": "article",
    "og:image": "https://example.com/og-image.png",
    "og:site_name": "Example Site",
    "og:url": "https://example.com/article"
  },
  "json_ld": [
    {
      "@type": "Article",
      "headline": "Example Article",
      "author": { "@type": "Person", "name": "Author Name" },
      "datePublished": "2026-01-15",
      "dateModified": "2026-03-20",
      "sameAs": ["https://twitter.com/author", "https://linkedin.com/in/author"]
    }
  ],
  "twitter_card": {
    "twitter:card": "summary_large_image",
    "twitter:site": "@example",
    "twitter:creator": "@author"
  },
  "html_meta": {
    "title": "Example Article - Example Site",
    "description": "A description of the article",
    "author": "Author Name",
    "canonical": "https://example.com/article",
    "generator": "Next.js",
    "viewport": "width=device-width, initial-scale=1"
  },
  "structured_counts": {
    "headings": { "h1": 1, "h2": 8, "h3": 12, "h4": 3, "h5": 0, "h6": 0 },
    "links": { "total": 74, "external": 42, "internal": 32 },
    "code_blocks": 15,
    "tables": 2,
    "images": 6,
    "forms": 0
  },
  "feeds": [
    {
      "type": "rss|atom",
      "url": "https://example.com/feed.xml",
      "title": "Example Site RSS"
    }
  ],
  "cms_detected": "WordPress|Ghost|Hugo|Jekyll|Next.js|Gatsby|null",
  "hosting_detected": "Vercel|Netlify|Cloudflare Pages|AWS CloudFront|null"
}
```

### 1.8 `sitemap.json` (website-only)

Site structure map. Populated during Site mode auto-discovery or from
sitemap.xml parsing.

```json
{
  "schema_version": "1.0",
  "domain": "example.com",
  "scan_date": "YYYY-MM-DD",
  "sitemap_source": "sitemap.xml|auto-discovery|manual-urls",
  "has_sitemap_index": false,
  "estimated_page_count": 150,
  "pages": [
    {
      "url": "https://example.com/article-1",
      "title": "Article Title",
      "last_modified": "ISO8601|null",
      "depth_from_root": 1,
      "analyzed": true,
      "analysis_slug": "example-com--article-1"
    }
  ],
  "navigation_structure": {
    "top_level_sections": ["Blog", "Docs", "About"],
    "max_depth": 3
  }
}
```

### 1.9 `SITE-ANALYSIS.md`

Human-readable Creator View report. Written as conversational prose per
Section 4. Includes YAML frontmatter for Obsidian/Dataview compatibility.

```yaml
---
site_url: https://example.com
site_slug: example-com
site_type: Blog
analysis_date: 2026-04-06
scan_depth: standard
creator_verdict: Study
creator_verdict_score: 85
tech_stack: [Next.js, Tailwind CSS]
topics: [React, performance, CSS]
---
```

Body follows the 7-section Creator View template (Section 4).

### 1.10 `trends.jsonl` (append-only)

One record per analysis run. Enables trend detection over multiple runs of the
same site.

```jsonl
{
  "schema_version": "1.0",
  "analysis_id": "uuid",
  "timestamp": "ISO8601",
  "url": "https://example.com",
  "domain": "example.com",
  "scan_depth": "standard",
  "creator_verdict": "Study",
  "creator_verdict_score": 85,
  "content_quality_score": 78,
  "technical_health_score": 72,
  "value_axes_summary": {
    "content_depth": 4,
    "content_freshness": 3,
    "editorial_stance": 3,
    "information_architecture": 4
  },
  "findings_total": 12,
  "findings_by_severity": {
    "high": 1,
    "medium": 4,
    "low": 5,
    "info": 2
  },
  "absence_patterns": [
    "DEAD_BLOG"
  ],
  "delta_verdict_score": 5
}
```

### 1.11 Expedition State Files (Decision #18)

Three-file pattern per expedition session. See Section 10 for full
specification.

- `expedition-{timestamp}.meta.json` -- session metadata (full rewrite on
  update)
- `expedition-{timestamp}.snap.json` -- current tree snapshot (full rewrite)
- `expedition-{timestamp}.jsonl` -- event log (append-only, never rewritten)

### 1.12 Cross-Entity: `extraction-journal.jsonl` (Decision #8)

**Location:** `.research/extraction-journal.jsonl` (shared across repo-analysis
and website-analysis)

Append-only log across ALL analyzed entities. One line per extraction decision.

```jsonl
{
  "schema_version": "1.0",
  "source_type": "website",
  "source": "https://example.com",
  "candidate": "CSS Reset Methodology",
  "candidate_type": "methodology",
  "status": "selected",
  "decision": "extract",
  "decision_date": "2026-04-06",
  "extracted_to": "docs/reference/CSS_RESET.md",
  "notes": "Directly applicable to SoNash component reset."
}
```

### 1.13 Cross-Entity: `EXTRACTIONS.md`

**Location:** `.research/EXTRACTIONS.md` (shared)

Auto-regenerated from `extraction-journal.jsonl` after each Extract routing
flow. Grouped by status for quick scanning. Same format as repo-analysis
EXTRACTIONS.md but includes `source_type` column to distinguish website vs repo
sources.

### 1.14 Cross-Entity: `reading-chain.jsonl`

**Location:** `.research/reading-chain.jsonl` (shared)

Append-only log of relationships between analyzed entities (sites and repos).

```jsonl
{
  "schema_version": "1.0",
  "from_type": "website",
  "from_source": "https://example.com",
  "to_type": "website",
  "to_source": "https://related.com",
  "relationship": "referenced-by|links-to|similar-to|contrast|extends",
  "discovery_context": "Found in outbound links during analysis",
  "discovered_during": "example.com analysis",
  "date": "2026-04-06"
}
```

### 1.15 Cross-Entity: `research-index.jsonl`

**Location:** `.research/research-index.jsonl` (shared)

Website analysis appends one record per analysis run.

```jsonl
{
  "id": "ws-001",
  "type": "website",
  "url": "https://example.com",
  "slug": "example-com",
  "domain": "example.com",
  "siteType": "Blog",
  "techStack": [
    "Next.js",
    "Tailwind CSS"
  ],
  "depth": "standard",
  "date": "2026-04-06",
  "output_dir": ".research/website-analysis/example-com/",
  "creator_verdict": "Study",
  "creator_verdict_score": 85,
  "absence_patterns": [
    "DEAD_BLOG"
  ]
}
```

### 1.16 Site Type Taxonomy (15 types, Decision #10 context)

Classification runs during Quick Scan using a 4-layer weighted algorithm.

| Type               | Key Detection Signals                                                   | Typical Extraction Mode |
| ------------------ | ----------------------------------------------------------------------- | ----------------------- |
| Blog               | `og:type=article`, RSS feed, chronological archive, H-entry microformat | Static                  |
| Documentation      | `/docs/`, `/reference/`, code blocks >20% content, version selector     | Static                  |
| SPA/App            | Empty body + `<div id="root">`, JS framework + no static content        | JS-required             |
| E-commerce         | Schema.org Product/Offer, cart links, price elements                    | Static or JS            |
| Curated List       | >15 items with external links, "awesome" in URL/title, low prose        | Static                  |
| Forum/Community    | Reply chains, user cards, karma/reputation, threaded structure          | Static                  |
| News/Media         | `og:type=news_article`, news publisher schema, AMP tags                 | Static                  |
| API Docs           | OpenAPI/Swagger refs, endpoint patterns, code examples >30%             | Static                  |
| Government         | `.gov` TLD, official seals, FOIA references, legal language             | Static                  |
| Academic           | DOI references, author affiliations, abstract sections, citations       | Static                  |
| Portfolio          | Gallery/grid layouts, project case studies, contact CTA                 | Static                  |
| Landing Page       | Single page, CTA-heavy, pricing tables, testimonials                    | Static                  |
| Registry/Directory | Sortable/filterable lists, pagination, structured entries               | JS or Static            |
| Tool/Utility       | Interactive elements, input/output UI, no main prose                    | JS-required             |
| Social Media       | Login gates, user-generated content streams, platform branding          | JS-required             |

**4-layer auto-classification algorithm:**

| Layer              | Weight | Signals                                  |
| ------------------ | ------ | ---------------------------------------- |
| JSON-LD @type      | 0.40   | Schema.org type declarations             |
| Meta generator tag | 0.30   | CMS identification                       |
| URL/OG type        | 0.20   | `og:type`, URL path patterns, TLD        |
| DOM structure      | 0.10   | Element ratio analysis, heading patterns |

Minimum confidence: 0.60 for definitive classification; 0.40-0.60 = "likely
[type] -- unverified". Below 0.40 = "unclassified".

---

## 2. Value Axes (Decision #10)

Thirteen value axes structure the "What This Site Understands" section (Creator
View Section 2) and inform the overall quality assessment. Each axis scored 1-5.

### Axis 1: Content Depth

- **Description:** Specialist vs. generalist; surface vs. technical depth
- **Measurement signals:** Lexical density (unique words / total words),
  technical jargon density, citation depth (links to primary sources), code
  example count and quality, specific version numbers and error messages
- **Scoring rubric:**
  - 5 (Excellent): Expert-level technical depth with original examples, specific
    implementation details, and primary source citations
  - 4 (Strong): Detailed coverage with code examples and references; minor gaps
  - 3 (Adequate): Covers the topic reasonably; some depth but reliant on general
    explanations
  - 2 (Shallow): Surface-level treatment; mostly summaries without specifics
  - 1 (Minimal): Thin content; no substantive technical detail

### Axis 2: Content Freshness

- **Description:** How recently updated; how time-sensitive the domain
- **Measurement signals:** Last-Modified HTTP header, publication dates in meta
  tags (`article:published_time`, `article:modified_time`), JSON-LD
  `dateModified`, visible dates in content, version numbers referenced,
  copyright year in footer, sitemap `<lastmod>` (low reliability)
- **Scoring rubric:**
  - 5: Updated within last 3 months; content references current versions/events
  - 4: Updated within 6 months; still largely current
  - 3: Updated within 12 months; some dated references but core content valid
  - 2: 12-18 months stale; notable outdated references
  - 1: >18 months without update; content likely obsolete in fast-moving domains

### Axis 3: Editorial Stance

- **Description:** Neutral/empirical vs. opinionated vs. advocacy
- **Measurement signals:** First-person language ratio ("I tested", "we built"),
  hedging language ratio ("might", "could", "it depends"), prescriptive language
  ("you should", "always", "never"), data citation frequency, disclosure of
  methodology
- **Scoring rubric:**
  - 5: Transparent stance with explicit methodology and evidence for claims
  - 4: Clear perspective with supporting evidence; occasional unsupported claims
  - 3: Mixed -- some evidence-based, some opinion without qualification
  - 2: Predominantly opinion presented as fact; minimal evidence
  - 1: Pure advocacy or marketing with no evidential foundation

### Axis 4: Information Architecture

- **Description:** How well the site organizes its knowledge
- **Measurement signals:** Heading hierarchy depth and correctness (single H1,
  logical H2-H6 nesting), navigation clarity, sitemap structure,
  cross-referencing between pages, table of contents presence, breadcrumb
  navigation
- **Scoring rubric:**
  - 5: Exemplary IA -- clear hierarchy, intuitive navigation, strong
    cross-linking, findable content
  - 4: Good structure with minor inconsistencies
  - 3: Adequate -- navigable but some organizational gaps
  - 2: Disorganized -- flat structure, poor navigation, hard to find content
  - 1: No discernible organization; content dumped without structure

### Axis 5: Link Graph Quality

- **Description:** Whether outbound links reveal the site's intellectual
  neighborhood
- **Measurement signals:** External domain diversity, link type distribution
  (references vs. social vs. marketing), anchor text quality (descriptive vs.
  "click here"), link context (inline vs. footer/sidebar), proportion of links
  to primary sources vs. secondary aggregation
- **Scoring rubric:**
  - 5: Rich link graph pointing to diverse, high-quality primary sources;
    curated intellectual neighborhood visible
  - 4: Good external links with mostly descriptive anchors
  - 3: Some useful external links mixed with generic or low-quality links
  - 2: Few external links or mostly self-referential
  - 1: No meaningful outbound links or link farm pattern

### Axis 6: Visual Design Philosophy

- **Description:** What the design says about the site's values and audience
- **Measurement signals:** Anti-design signals (stripped metadata, aggressive
  minimalism), information density vs. whitespace ratio, ad density, visual
  hierarchy clarity, consistent design language, accessibility of visual
  elements
- **Scoring rubric:**
  - 5: Design serves content; clear visual hierarchy; accessible; information-
    dense without clutter
  - 4: Clean design with minor issues; content prioritized
  - 3: Functional design; neither helps nor hinders comprehension
  - 2: Design interferes with content (ad-heavy, poor contrast, cluttered)
  - 1: Design actively hostile to reading (dark patterns, pop-ups,
    interstitials)

**Quick Scan note:** Visual design scoring at Quick tier uses screenshot
analysis from superpowers-chrome auto-capture (Decision #36). Standard/Deep use
DOM-based signals for deeper assessment.

### Axis 7: Audience Assumed Expertise

- **Description:** Who the site is written for
- **Measurement signals:** Reading level (Flesch-Kincaid Grade Level), jargon
  density, definition/glossary presence, prerequisite assumptions, code example
  complexity, tutorial vs. reference style
- **Scoring rubric:**
  - 5: Clear audience targeting; appropriate depth for declared audience;
    explicit prerequisites stated
  - 4: Generally well-targeted; occasional mismatches in assumed knowledge
  - 3: Inconsistent -- mixes beginner and expert content without clear signaling
  - 2: Poorly targeted -- assumes too much or too little of the reader
  - 1: No discernible audience awareness; content is a knowledge dump

### Axis 8: Source Attribution

- **Description:** Does the site cite its sources?
- **Measurement signals:** External link ratio (links per paragraph), citation
  style (inline, footnote, bibliography), reference section presence, data
  source attribution, "according to" patterns linking to primary sources
- **Scoring rubric:**
  - 5: Comprehensive attribution; primary sources cited; methodology disclosed
  - 4: Good attribution with occasional uncited claims
  - 3: Some attribution; mix of cited and uncited claims
  - 2: Minimal attribution; most claims unsupported
  - 1: No attribution; all claims presented without sources

### Axis 9: Content Authenticity

- **Description:** Is the content first-hand experience or
  synthesized/generated?
- **Measurement signals:** Specific detail density (version numbers, error
  messages, benchmarks), personal anecdote presence ("I tested", "we built", "in
  production since"), unique examples (not generic), consistent voice, lexical
  density >50% as quality proxy (Decision #10 context from RESEARCH_OUTPUT
  Section 12.3)
- **Scoring rubric:**
  - 5: Clearly first-hand experience; unique examples; specific implementation
    details; consistent personal voice
  - 4: Mostly original with strong specific details
  - 3: Mix of original and synthesized; some specific details, some generic
  - 2: Predominantly synthesized from other sources; few original details
  - 1: Suspected generated content or pure aggregation with no original insight

**AI-generated content signals (suspicion, not proof):** Uniform paragraph
length (+/-20% variance), hedging without specific detail, absence of personal
anecdotes, repetitive transitional phrases, zero external links in long-form
content, publication date clustering.

### Axis 10: Monetization Pressure

- **Description:** Does monetization distort the content?
- **Measurement signals:** Ad density (ad elements per content element),
  affiliate link ratio, sponsored content signals ("sponsored", "partner",
  "paid"), call-to-action frequency, "request a demo" patterns, product name
  density in non-product content
- **Scoring rubric:**
  - 5: No monetization pressure; content-first approach; no ads or affiliate
    links
  - 4: Minimal monetization; does not distort content quality
  - 3: Moderate monetization; some content may be influenced
  - 2: Heavy monetization; content quality visibly compromised
  - 1: Content exists primarily as a monetization vehicle (VENDOR_BROCHURE)

### Axis 11: Community Signal

- **Description:** Is the site connected to a broader community?
- **Measurement signals:** Forum links, IndieWeb webring membership,
  reply/comment presence, community discussion links, contributor/author pages,
  social engagement signals, open source project links
- **Scoring rubric:**
  - 5: Active community with visible engagement; author responsive; connected to
    IndieWeb or domain community
  - 4: Community present with some engagement signals
  - 3: Some community elements but limited engagement
  - 2: Minimal community presence; content is broadcast-only
  - 1: No community signal; isolated content island

### Axis 12: Entity Authority

- **Description:** Is the site or its authors recognized experts?
- **Measurement signals:** E-E-A-T signals (Experience, Expertise,
  Authoritativeness, Trustworthiness), author credentials (bylines, bio pages,
  institutional affiliation), external citations from other authoritative
  sources, organizational transparency (About page, contact info), `sameAs`
  JSON-LD linking to Wikipedia/Wikidata/LinkedIn
- **Scoring rubric:**
  - 5: Recognized domain authority; author credentials verified; cited by peers
  - 4: Established expertise with visible credentials
  - 3: Some authority signals but unverified or inconsistent
  - 2: Minimal authority indicators; anonymous or pseudonymous
  - 1: No authority signals; content from unknown source

### Axis 13: Structural Completeness

- **Description:** Is the site's knowledge base complete or fragmentary?
- **Measurement signals:** Dead link ratio, orphan pages (pages with no
  navigation path), abandoned sections (partial content, empty categories),
  placeholder text, consistent depth across sections, content coverage of
  declared scope
- **Scoring rubric:**
  - 5: Complete and maintained; all sections populated; no dead links;
    consistent depth
  - 4: Mostly complete; minor gaps or a few dead links
  - 3: Partially complete; some abandoned sections; moderate dead links
  - 2: Significantly incomplete; many gaps and dead links
  - 1: Fragmentary; mostly placeholder or abandoned content

---

## 3. Absence Patterns (Decision #11)

Eleven named absence patterns. The absence classifier detects what is missing,
broken, or deceptive about a site. Runs as a cross-cutting concern across all
phases.

### Pattern 1: DEAD_BLOG

- **Description:** Last post >18 months ago, no updates
- **Detection signals:** Publication dates in meta tags, HTTP Last-Modified
  header, visible dates showing gap >18 months, copyright year more than 2 years
  stale
- **Severity:** MEDIUM (content may still have historical value)
- **Action:** Flag age in findings; note as "historical value only" in Creator
  View
- **Tier detection:**
  - Quick: Yes (dates from metadata/eval extraction)
  - Standard: Yes (content date analysis)
  - Deep: Yes (cross-page date trend analysis)

### Pattern 2: VENDOR_BROCHURE

- **Description:** All content is product marketing; no independent technical
  value
- **Detection signals:** High product-name density (product mentioned in every
  paragraph), CTA ratio (>1 CTA per 500 words), "request a demo" / "contact
  sales" patterns, vendor voice markers ("our solution", "our platform"),
  absence of independent analysis
- **Severity:** MEDIUM
- **Action:** Surface in Creator View Warning section; note that content claims
  require independent verification
- **Tier detection:**
  - Quick: Yes (OG tags, meta description patterns)
  - Standard: Yes (full content analysis)
  - Deep: Yes

### Pattern 3: SPA_SHELL

- **Description:** JS-required content but bot protection blocks rendering
- **Detection signals:** JS framework detected + `403` or CAPTCHA on render
  attempt, empty body with only `<div id="root">` or `<div id="app">`, content
  length <300 characters after whitespace normalization despite framework
  presence
- **Severity:** HIGH (extraction failure)
- **Action:** Surface as extraction failure; suggest manual review or direct
  browser visit
- **Tier detection:**
  - Quick: Partial (framework fingerprint detected)
  - Standard: Yes (extraction failure during content phase)
  - Deep: Yes

### Pattern 4: PAYWALLED_HARD

- **Description:** All content behind hard paywall; zero extractable content
- **Detection signals:** Paywall overlay element, zero extractable main content,
  login requirement on all content paths, `X-Paywall` or similar headers
- **Severity:** HIGH
- **Action:** HARD_BLOCK extraction in compliance pre-flight; produce minimal
  analysis.json with paywall reason; surface to user
- **Tier detection:**
  - Quick: Yes (paywall overlay in DOM snapshot)
  - Standard: Yes
  - Deep: Yes

### Pattern 5: PAYWALLED_SOFT

- **Description:** First-N-free articles, then paywall; partial content
  available
- **Detection signals:** Partial content visible + cookie-based gate, "subscribe
  to read more" patterns, content truncation after N paragraphs, metered paywall
  cookies
- **Severity:** LOW
- **Action:** Extract available content; note paywall limitation in findings;
  flag partial coverage in Creator View
- **Tier detection:**
  - Quick: Partial (may show full content on first visit)
  - Standard: Yes (content truncation detectable)
  - Deep: Yes

### Pattern 6: CAPTIVE_JS

- **Description:** Content technically JS-rendered but bot-detection blocks all
  automated access
- **Detection signals:** Cloudflare challenge page (`cf-mitigated: challenge`
  header), CAPTCHA presentation, browser fingerprinting scripts, anti-bot JS
  loaded before content JS
- **Severity:** HIGH (extraction failure)
- **Action:** Surface as extraction failure. Do not retry -- Cloudflare
  challenge pages defeat automated tools. Suggest user visit site directly.
- **Tier detection:**
  - Quick: No (challenge may not trigger on first request)
  - Standard: Yes (failure during content extraction)
  - Deep: Yes

### Pattern 7: AGGREGATOR

- **Description:** Site aggregates content but adds no original analysis
- **Detection signals:** High external link ratio + low prose content, no
  bylines, "according to" as primary attribution pattern, no first-person
  experience language, content is predominantly quotes/excerpts from other
  sources
- **Severity:** LOW
- **Action:** Note aggregator status in Creator View; recommend using the site's
  links as starting points rather than its prose as knowledge
- **Tier detection:**
  - Quick: Partial (link-to-prose ratio from structural counts)
  - Standard: Yes (full content analysis)
  - Deep: Yes

### Pattern 8: LINK_FARM

- **Description:** Thin content optimized for link density; no substantive
  knowledge
- **Detection signals:** >95% link-to-prose ratio, extremely low lexical
  density, generic anchor text, no headings or minimal heading structure, SEO
  keyword stuffing signals
- **Severity:** HIGH
- **Action:** DISCARD -- not a knowledge source. Flag prominently in findings.
  Do not score value axes.
- **Tier detection:**
  - Quick: Yes (structural counts reveal link dominance)
  - Standard: Yes
  - Deep: Yes

### Pattern 9: GENERATED_CONTENT

- **Description:** LLM-generated content with no original insight
- **Detection signals:** Uniform paragraph length (+/-20% variance), hedging
  without specific detail ("it's important to consider"), absence of personal
  anecdotes or specific examples, repetitive transitional phrases, zero external
  links in long-form content, publication date clustering (many posts in short
  windows)
- **Severity:** MEDIUM
- **Action:** Surface suspicion in Creator View; mark all claims with LOW
  confidence. Do NOT auto-penalize -- detection accuracy is 65-88%, too low for
  automated confidence degradation (Decision #10 context, gap finding G3).
- **Tier detection:**
  - Quick: Partial (paragraph length variance from structural preview)
  - Standard: Partial (full content analysis but detection imperfect)
  - Deep: Partial (deeper analysis but same accuracy limitations)

### Pattern 10: CURATED_LIST_WEB

- **Description:** Awesome-list equivalent for web -- links ARE the content
- **Detection signals:** >15 items with external links, minimal prose between
  items, list-heavy structure, title contains "awesome" or "curated" or
  "resources"
- **Severity:** INFO (not negative -- different content type)
- **Action:** Treat as link source, not knowledge source. Trigger link scoring
  pipeline. Suggest Expedition mode for following high-scored links.
- **Tier detection:**
  - Quick: Yes (structural counts, URL/title patterns)
  - Standard: Yes
  - Deep: Yes

### Pattern 11: REGISTRY

- **Description:** Directory of entities -- content is the structured index, not
  narrative
- **Detection signals:** Sortable/filterable lists, pagination, search box,
  structured entries (name + URL + description pattern), minimal editorial prose
- **Severity:** INFO (not negative -- different content type)
- **Action:** Extract registry data structure; do not analyze as narrative
  content. Trigger link scoring for registered entries.
- **Tier detection:**
  - Quick: Yes (DOM structure signals)
  - Standard: Yes
  - Deep: Yes

### Absence Pattern Detection Summary

| Pattern           | Quick Scan | Standard | Deep    |
| ----------------- | ---------- | -------- | ------- |
| DEAD_BLOG         | Yes        | Yes      | Yes     |
| VENDOR_BROCHURE   | Yes        | Yes      | Yes     |
| SPA_SHELL         | Partial    | Yes      | Yes     |
| PAYWALLED_HARD    | Yes        | Yes      | Yes     |
| PAYWALLED_SOFT    | Partial    | Yes      | Yes     |
| CAPTIVE_JS        | No         | Yes      | Yes     |
| AGGREGATOR        | Partial    | Yes      | Yes     |
| LINK_FARM         | Yes        | Yes      | Yes     |
| GENERATED_CONTENT | Partial    | Partial  | Partial |
| CURATED_LIST_WEB  | Yes        | Yes      | Yes     |
| REGISTRY          | Yes        | Yes      | Yes     |

---

## 4. Creator View Template (Decision #9)

Seven sections, conversational prose. The Creator View is the primary output of
`/website-analysis` for Standard and Deep tiers.

### 4.0 Style Guide

- **Conversational prose, not tables.** Written as you would explain a site to a
  colleague, not as a compliance report.
- **Anti-goal: must NOT read like a technical manual.** No jargon-heavy,
  impersonal, bullet-point-only output.
- **Direct address.** "You are doing X. They approach Y differently. Here is why
  that matters." Not "The website implements X."
- **Depth over brevity.** Each section should be substantive -- 5-15 lines of
  real analysis, not 2-line summaries.
- **Opinionated when warranted.** The Challenge and Warning sections exist to
  push back. Do not soften genuine insights.
- **Bands over numbers.** Present categorical bands with scores in parentheses.
  Never bare numbers as headlines.

### 4.1 Section 1: What's Relevant To Your Work

**Purpose:** Lead with creator-specific relevance, not site description. Map
site content to the creator's active projects, questions, and knowledge gaps.

**Tone:** Decisive, not hedged. "This site has X that applies to Y" not "This
site might be relevant if..."

**Example phrases:**

- "This site's approach to [topic] maps directly to your [active project]. They
  solved [problem] using [technique] -- worth comparing to your [approach]."
- "Nothing here connects to your current sprint, but their [approach] is worth
  parking for when you tackle [future work]."

**Home context sources (MUST load before writing this section):**

1. `SESSION_CONTEXT.md` -- current sprint, active work, immediate priorities
2. `ROADMAP.md` -- project direction, planned features, vision
3. `CLAUDE.md` -- conventions, stack, architecture constraints
4. `.claude/skills/` directory listing -- active skills inventory
5. Active project memories from MEMORY.md -- project initiatives, decisions
   (Decisions #28, #35)

### 4.2 Section 2: What This Site Understands

**Purpose:** Characterize the site's knowledge domain, depth, and perspective
using the 13 value axes as analytical backbone.

**Tone:** Analytical but accessible. Present the 13 value axes as a narrative,
not a table.

**Example phrases:**

- "This site knows [domain] deeply -- their content depth is Excellent (4/5),
  with specific [examples/benchmarks/implementations] that most sites in this
  space lack."
- "Their editorial stance is clearly [empirical/opinionated/advocacy]. The
  author writes from first-hand experience building [thing], which gives the
  content an authenticity that aggregator sites cannot match."
- "The site's epistemological stance is [empirical/opinionated/aggregatory/
  documentary] -- they [gather data/express opinions/collect from others/record
  what exists]."

**Must include:**

- Primary audience and assumed expertise level
- Epistemological stance assessment
- Top 3-5 value axes as narrative highlights (not all 13 listed mechanically)

### 4.3 Section 3: Voice and Editorial POV (website-specific)

**Purpose:** Characterize the site's editorial stance, implied author identity,
and how this affects the reliability of its claims.

**Tone:** Observational, not judgmental. The goal is to understand the voice,
not to evaluate it.

**Example phrases:**

- "This is clearly a practitioner's voice -- first-person experience language
  throughout ('I tested', 'we built'), with specific failure stories that only
  come from hands-on work."
- "Institutional voice. The 'we' is the company, not the authors. Claims are
  measured and hedged. Useful for understanding official positions, less useful
  for ground truth."
- "Vendor voice detected. Product name appears in every third paragraph. Content
  quality is actually solid beneath the marketing veneer, but every claim should
  be verified against independent sources."

**Voice detection hierarchy (in priority order):**

1. First-person experience language --> authentic practitioner voice
2. Institutional voice markers ("our research", "the company") --> institutional
3. Aggregator signals ("according to", "sources say") --> secondary aggregation
4. Vendor voice ("our solution", "request a demo") --> marketing
5. Generated content markers (uniform paragraphs, hedging without substance) -->
   potentially generated

**Why this matters:** A site's POV determines whether its claims should be
synthesized as ground truth, as one perspective, or as marketing material.

### 4.4 Section 4: Where Your Approach Differs

**Purpose:** Explicit comparison between this site's thinking and the creator's
documented approach.

**Tone:** Comparative, not competitive. The goal is productive differentiation.

**Example phrases:**

- "You use [approach]. They use [different approach]. The difference is
  [fundamental/productive/stylistic]. Worth examining because [reason]."
- "Their [pattern/methodology] is ahead of yours in [specific way]. They solved
  [problem] that you are still working around."

**Classification of differences:**

| Classification  | Meaning                                                | Action                               |
| --------------- | ------------------------------------------------------ | ------------------------------------ |
| **Productive**  | Different approach with potential advantages           | Consider adoption or hybrid          |
| **Fundamental** | Irreconcilable difference in philosophy or constraints | Acknowledge; do not try to reconcile |
| **Stylistic**   | Same outcome, different expression                     | Note but low priority                |

**Sources for comparison:** CLAUDE.md conventions, SESSION_CONTEXT.md patterns,
previously analyzed sites, MEMORY.md project decisions.

### 4.5 Section 5: The Challenge

**Purpose:** What makes this site hard to use as a knowledge source?

**Tone:** Direct and specific. One primary challenge, not five.

**Example phrases:**

- "The challenge is [paywall/JS-requirement/outdated content/aggregation without
  attribution]. This means [specific impact on usefulness]."
- "No significant challenges identified. The site is well-structured,
  accessible, and its content is straightforward to extract and verify."

**Rules:**

- Only when warranted. If nothing genuinely challenges usability, say so.
- Never forced. Do not manufacture challenges for completeness.
- Relate challenge to extraction mode (if extraction failed, explain why).
- One primary challenge, not a laundry list.

### 4.6 Section 6: The Warning (OPTIONAL -- website-specific)

**Purpose:** Surface genuine risks. NOT every site has a Warning -- omit the
section entirely if no genuine risk exists.

**Tone:** Measured but direct. Distinguish Warning from Challenge: Challenge is
about usability; Warning is about risk.

**Example phrases:**

- "Warning: This site's ToS explicitly prohibits automated extraction. Content
  was analyzed via manual review signals only."
- "Warning: Multiple claims in the [section] contradict peer-reviewed research
  on [topic]. Specifically: [claim] vs [established finding]."

**Warning categories (only surface when a genuine risk exists):**

- ToS restrictions that limit how extracted knowledge can be used
- Known misinformation or contradictions with established sources
- Vendor bias that may distort technical claims
- GDPR exposure (personal data in content)
- SEO manipulation signals (keyword stuffing, cloaking)

### 4.7 Section 7: Knowledge Candidates

**Purpose:** Specific, extractable knowledge items identified during analysis.
This section feeds the value-map.json artifact and the Extract routing option.

**Tone:** Actionable and ranked. Each candidate should be immediately
understandable.

**Example phrases:**

- "1. **CSS Reset Methodology** [ACTIVE-SPRINT] -- Their box-sizing approach
  solves the exact problem you have in the SoNash layout system. E0 effort: read
  and apply."
- "2. **Performance Budget Framework** [PARK] -- Brilliant approach to Core Web
  Vitals budgeting, but your current sprint is focused elsewhere. Park for when
  you tackle performance work."

**Must include per candidate:**

- Type (concept / tool / example / dataset / pattern / methodology)
- Confidence level (High / Med / Low)
- Extraction effort (E0 read/study, E1 experiment, E2 significant adaptation)
- Fit badge ([ACTIVE-SPRINT], [PARK], [EVERGREEN], or none)

**Brilliant-but-off-sprint callout:** After the ranked listing, include a
dedicated paragraph identifying candidates with high objective score but low
personal fit. Frame as "worth parking, not discarding."

---

## 5. Engineer View Dimensions (Decision #25)

Six dimensions, 4-band scoring. The Engineer View is secondary to the Creator
View -- it answers "what technical decisions shaped what this site can offer
me?" not "is this site well-built?"

### Dimension 1: Performance

**What to measure:** Core Web Vitals proxies detectable without Lighthouse.

**How to measure:**

- Page load size (Content-Length header)
- Number of external resources (scripts, stylesheets, images from meta.json
  structured_counts)
- First meaningful content presence in static HTML (SSR indicator)
- Image optimization signals (srcset, lazy loading, WebP/AVIF formats)

**4-band scoring:**

| Score  | Band       | Threshold                                                              |
| ------ | ---------- | ---------------------------------------------------------------------- |
| 80-100 | Excellent  | Page size <500KB, SSR detected, images optimized, <10 external scripts |
| 60-79  | Healthy    | Page size <1MB, some optimization, <20 external scripts                |
| 40-59  | Needs Work | Page size <3MB, no SSR, unoptimized images                             |
| 0-39   | Critical   | Page size >3MB, excessive scripts, no optimization signals             |

### Dimension 2: Security Headers

**What to measure:** HTTP security headers that indicate security posture.

**How to measure (Deep mode: curl -sI):**

- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- HTTPS enforcement (HTTP -> HTTPS redirect)

**4-band scoring:**

| Score  | Band       | Threshold                                  |
| ------ | ---------- | ------------------------------------------ |
| 80-100 | Excellent  | HSTS + CSP + 3+ other headers + HTTPS      |
| 60-79  | Healthy    | HTTPS + HSTS + 1-2 other headers           |
| 40-59  | Needs Work | HTTPS only, no additional security headers |
| 0-39   | Critical   | No HTTPS or missing basic security headers |

### Dimension 3: Accessibility

**What to measure:** WCAG signals detectable from DOM analysis.

**How to measure:**

- Image alt text presence ratio
- Heading hierarchy correctness (single H1, logical nesting)
- ARIA landmark presence
- Color contrast (requires screenshot analysis or CSS inspection)
- Form label associations
- Skip navigation links

**4-band scoring:**

| Score  | Band       | Threshold                                                          |
| ------ | ---------- | ------------------------------------------------------------------ |
| 80-100 | Excellent  | >90% alt text, correct heading hierarchy, ARIA landmarks, skip nav |
| 60-79  | Healthy    | >70% alt text, mostly correct headings, some ARIA                  |
| 40-59  | Needs Work | >40% alt text, heading issues, minimal ARIA                        |
| 0-39   | Critical   | <40% alt text, broken heading hierarchy, no ARIA                   |

### Dimension 4: SEO

**What to measure:** Meta tags and structured data that indicate SEO maturity.

**How to measure:**

- Open Graph completeness (og:title, og:description, og:image, og:type)
- JSON-LD structured data presence and correctness
- Canonical URL declaration
- Meta description presence and quality (50-160 chars)
- Sitemap.xml presence
- robots.txt configuration quality

**4-band scoring:**

| Score  | Band       | Threshold                                                          |
| ------ | ---------- | ------------------------------------------------------------------ |
| 80-100 | Excellent  | Full OG + JSON-LD + canonical + sitemap + quality meta description |
| 60-79  | Healthy    | OG tags + canonical + meta description; no JSON-LD                 |
| 40-59  | Needs Work | Partial OG, no structured data, basic meta                         |
| 0-39   | Critical   | No OG, no structured data, missing or generic meta description     |

### Dimension 5: Technical Stack

**What to measure:** Framework and CMS detection to understand what built the
site and how it constrains the content.

**How to measure:**

- CMS detection via Wappalyzer-style patterns (7,200+ signatures)
- Framework fingerprints: `__NEXT_DATA__` (Next.js), `window.__nuxt__` (Nuxt),
  `data-reactroot` (React), `ng-version` (Angular), `__svelte_*` (SvelteKit),
  `data-gatsby-*` (Gatsby)
- Hosting signals: `CF-Ray` (Cloudflare), `X-Served-By` (Fastly), `x-vercel-id`
  (Vercel), `x-nf-request-id` (Netlify), `X-Amz-Cf-Id` (AWS CloudFront)
- Meta generator tag
- Build tool signals (webpack chunks, Vite modules)

**4-band scoring:**

| Score  | Band       | Threshold                                              |
| ------ | ---------- | ------------------------------------------------------ |
| 80-100 | Excellent  | Modern stack, SSR/SSG, CDN hosting, clear architecture |
| 60-79  | Healthy    | Reasonable stack, some modern practices                |
| 40-59  | Needs Work | Outdated stack or indicators of technical debt         |
| 0-39   | Critical   | Legacy technology, no clear architecture               |

### Dimension 6: Mobile Readiness

**What to measure:** Mobile optimization signals detectable from HTML and
headers.

**How to measure:**

- Viewport meta tag presence and configuration
- Responsive design signals (CSS media queries, flexible layouts)
- Touch-friendly elements (button sizes, tap targets)
- Mobile-specific meta tags (`mobile-web-app-capable`)
- AMP presence (if applicable)

**4-band scoring:**

| Score  | Band       | Threshold                                                   |
| ------ | ---------- | ----------------------------------------------------------- |
| 80-100 | Excellent  | Proper viewport + responsive + touch-friendly + mobile meta |
| 60-79  | Healthy    | Viewport set + mostly responsive                            |
| 40-59  | Needs Work | Viewport set but poor responsive design                     |
| 0-39   | Critical   | No viewport meta or non-responsive layout                   |

---

## 6. Scoring and Verdicts (Decision #13)

### 6.1 Four-Band Health Scale

Primary display is band with score in parentheses. Never present a bare numeric
score as the headline.

| Score  | Band       | Interpretation                    | Display example   |
| ------ | ---------- | --------------------------------- | ----------------- |
| 80-100 | Excellent  | High-quality across dimension     | `Excellent (88)`  |
| 60-79  | Healthy    | Acceptable; targeted improvements | `Healthy (62)`    |
| 40-59  | Needs Work | Significant gaps                  | `Needs Work (35)` |
| 0-39   | Critical   | Immediate concerns                | `Critical (12)`   |

### 6.2 Creator Verdicts

The primary verdict for website analysis. Determines recommended engagement
level.

| Score | Verdict | Interpretation                                        |
| ----- | ------- | ----------------------------------------------------- |
| 80+   | Study   | Deep engagement recommended; rich knowledge source    |
| 60-79 | Explore | Worth exploring; selective deep-dives on strong axes  |
| 40-59 | Extract | Cherry-pick specific insights or knowledge candidates |
| 0-39  | Note    | Record existence; low learning priority               |

### 6.3 Summary Band Categories

Three summary categories (vs. repo-analysis's six):

| Category         | Weight | Coverage                                              |
| ---------------- | ------ | ----------------------------------------------------- |
| Content Quality  | 50%    | Value axes composite (13 axes, normalized to 0-100)   |
| Technical Health | 20%    | Engineer dimensions composite (6 dimensions)          |
| Creator Value    | 30%    | Knowledge candidates quality + personal fit + novelty |

**Value axes composite formula:** Average of all 13 axis scores (1-5 scale),
normalized to 0-100: `(average_axis_score / 5) * 100`.

**Creator verdict score formula:**
`(Content Quality * 0.50) + (Technical Health * 0.20) + (Creator Value * 0.30)`

**Critical floor metric:** The lowest summary category score. A site with an 85
average but a 20 Technical Health is flagged:
`Study (82) | Critical floor: Technical Health (20)`.

### 6.4 Display Format

```
Creator Verdict: Study (82) -- deep engagement recommended
  Content Quality:  Excellent (88)
  Technical Health: Critical (20)
  Creator Value:    Excellent (92)
  Critical floor:   Technical Health (20)
```

---

## 7. Compliance Pre-flight (Decision #14)

Runs before ANY extraction. MUST complete before Phase 0 proceeds.

### 7.1 Pre-flight Procedure

```
1. Fetch robots.txt via WebFetch (cache result for session)
2. Parse for Anthropic user agents:
   - ClaudeBot (web crawling)
   - Claude-User (user-initiated browsing)
   - Claude-SearchBot (search indexing)
3. Check for Disallow rules against target URL path
4. Fetch target URL headers (HEAD request or first extraction response)
5. Check cf-mitigated header (Decision #30)
6. Check X-Robots-Tag header
7. Check for RSS/Atom feeds via eval (link[rel=alternate][type*=rss]) (Decision #34)
8. Check for llms.txt at site root
9. Classify: HARD_BLOCK | WARN | PROCEED
```

### 7.2 HARD_BLOCK Conditions (stop skill entirely)

- `Disallow: /` for `User-agent: *` or `User-agent: ClaudeBot` or `Claude-User`
  or `Claude-SearchBot` matching the target URL path
- `X-Robots-Tag: noindex, nofollow` on target page
- Site explicitly in llms.txt disallow list
- Known cease-and-desist history (manual flag -- not automatable)

**On HARD_BLOCK:** Write minimal `analysis.json` with:

- `compliance.status: "HARD_BLOCK"`
- `compliance.notes` explaining the specific reason
- All other fields set to null or empty
- Stop skill execution. Do not proceed to Phase 0.

### 7.3 WARN Conditions (require user acknowledgment)

- `cf-mitigated: challenge` header detected (Cloudflare bot mitigation)
- ToS pattern matches: "no automated access", "no scraping", "machine-readable
  use prohibited"
- GDPR-sensitive content signals (user-generated data pages, personal
  information)
- Paywall detection (soft paywall -- partial content available)
- Rate-limit signals in headers (`Retry-After`, `X-RateLimit-*`)

**On WARN:** Surface specific warning to user with reason. Require explicit
acknowledgment ("proceed despite warning") before continuing. Log the
acknowledgment in the state file.

### 7.4 PROCEED Conditions

- robots.txt allows access (or robots.txt not found)
- No X-Robots-Tag restrictions
- No Cloudflare challenge detected
- No paywall or ToS concerns detected

**On PROCEED:** Log compliance assessment in `analysis.json.compliance` and
continue to Phase 0.

### 7.5 Cloudflare Detection (Decision #30)

- Check response headers for `cf-mitigated: challenge` -- the authoritative
  Cloudflare detection header
- Also check for `CF-Ray` header (indicates Cloudflare but not necessarily
  challenge)
- If `cf-mitigated: challenge` detected: WARN, not HARD_BLOCK
- Do NOT attempt escalation tiers (FlareSolverr is end-of-life). Fail fast and
  informatively.
- superpowers-chrome with real Chrome has the best chance of passing Cloudflare
  challenges

### 7.6 RSS/Atom Feed Detection (Decision #34)

- Check via eval:
  `document.querySelectorAll('link[rel=alternate][type*=rss], link[rel=alternate][type*=atom]')`
- If feeds found: surface as option to user ("RSS feed detected. Use as cleaner
  content source? [y/N]")
- Do not auto-switch to RSS extraction
- WordPress sites: expect default-on feeds (50-70% of blog/news sites have them)
- Feeds provide cleaner content for blog/news type sites (no navigation chrome,
  structured metadata)

### 7.7 Compliance Logging

All compliance decisions logged in `analysis.json.compliance`:

```json
{
  "status": "PROCEED",
  "robots_txt": "allowed",
  "cf_mitigated": false,
  "x_robots_tag": "none",
  "llms_txt": "not_found",
  "rss_available": true,
  "rss_url": "https://example.com/feed.xml",
  "notes": "robots.txt found, no restrictions for Claude user agents"
}
```

---

## 8. Link Scoring (Decisions #21, #22)

### 8.1 Seven-Component Scoring Formula

Weights sum to 1.0. Configurable via `--link-weights` flag override.

| Component                     | Weight | Description                                          |
| ----------------------------- | ------ | ---------------------------------------------------- |
| Context relevance (TF-IDF)    | 0.25   | Semantic relevance of surrounding text to page topic |
| Anchor quality                | 0.20   | Descriptive vs. generic anchor text quality          |
| Position / semantic container | 0.15   | Where the link appears in the page structure         |
| URL pattern                   | 0.15   | Path structure signals content type                  |
| Link type                     | 0.10   | Type classification modifier                         |
| Novelty                       | 0.10   | New domain vs. previously seen domain                |
| Alive check (HEAD request)    | 0.05   | HTTP 200 vs. redirect vs. 404                        |

**Context relevance note:** When analyzing a site without a specific query, use
the page's own content as the reference corpus for TF-IDF computation. The top
keywords from the page become the relevance baseline.

### 8.2 Semantic Container Scoring (Position Component)

| Container                       | Score   | Rationale                              |
| ------------------------------- | ------- | -------------------------------------- |
| `<article>` content             | 1.0     | Highest signal -- link in article body |
| `<main>` content                | 0.8     | Main content area                      |
| `<section>` content             | 0.5     | Sectioned content                      |
| `<aside>` content               | 0.1     | Sidebar/supplementary                  |
| `<nav>`, `<header>`, `<footer>` | DISCARD | Boilerplate navigation -- do not score |

### 8.3 Link Type Classification

Three-tier priority system:

| Tier   | Types                                             | Score Modifier |
| ------ | ------------------------------------------------- | -------------- |
| HIGH   | Tutorial, Reference, Academic Paper, Tool/Library | +0.3           |
| MEDIUM | Long-form Article, Community Discussion, Video    | 0.0 (baseline) |
| LOW    | Social Media Post, Marketing Page, Press Release  | -0.2           |

**URL pattern signals for link type:**

| URL Pattern                                | Inferred Type  |
| ------------------------------------------ | -------------- |
| `/paper/`, `/research/`, `/pdf/`, DOI URLs | Academic Paper |
| `/docs/`, `/reference/`, `/api/`           | Reference      |
| `/tutorial/`, `/guide/`, `/how-to/`        | Tutorial       |
| GitHub/GitLab URLs (non-issue)             | Tool/Library   |
| Twitter/X, LinkedIn, Facebook              | Social Media   |
| `/press/`, `/newsroom/`, `/announcement/`  | Press Release  |

### 8.4 `--link-weights` Override Spec (Decision #21)

Users can override default weights via flag:

```
/website-analysis URL --link-weights="context:0.30,anchor:0.15,position:0.15,url:0.10,type:0.15,novelty:0.10,alive:0.05"
```

**Rules:**

- Weights must sum to 1.0 (validate before scoring)
- Unspecified weights retain defaults
- No config file in v1 -- flag only

### 8.5 High-Link-Density Trigger (Decision #22)

When a page has >40 unique external links (Web Almanac 2025: 90th percentile is
25 links, so >40 targets the top <10% of pages):

```
This page links to [N] external domains. Consider:
  - Expedition: follow the most relevant links for deeper analysis
  - Cross-site synthesis: analyze the top 5-12 linked domains for thematic patterns
  - Link map: export the link graph as a knowledge map
```

Threshold configurable but 40 is the default. Applies to curated lists,
directories, and resource pages.

---

## 9. URL-to-Slug Algorithm (Decision #23)

Windows MAX_PATH compliant. Used for output directory naming.

### Step-by-step conversion:

```
1. Parse URL: extract hostname + path (strip protocol, query string, fragment)
2. Lowercase the entire string
3. Replace path separators (/) with double-hyphens (--)
4. Replace all non-alphanumeric characters (except hyphens) with single hyphens
5. Collapse runs of 3+ consecutive hyphens to single hyphen (preserve `--` path separators)
6. Strip leading/trailing hyphens
7. Truncate to 80 characters at a word boundary
8. If truncated OR known collision risk:
   append "-" + SHA-256(original full URL)[0:6] as suffix
9. Result example: example-com--blog--post-title
                   example-com--blog--long-post-title-that-was-truncat-ab12cd
```

### Windows MAX_PATH Calculation

```
Windows MAX_PATH = 260 characters
Workspace prefix:  ~80 chars (C:\Users\<user>\Workspace\dev-projects\<project>\)
.research/ prefix: ~30 chars (.research/website-analysis/)
Site slug:         max 80 chars
Nested files:      ~50 chars (expedition-20260406.meta.json)
Buffer:            ~20 chars
Total:             ~260 chars (fits MAX_PATH)
```

### Collision Handling

- First invocation for a slug: no suffix needed
- If directory already exists with different source URL: always append SHA-256
  suffix
- SHA-256 computed from the FULL original URL (including query string and
  fragment) to ensure uniqueness

---

## 10. Expedition Mode (Decisions #2, #17, #18)

Multi-hop HITL navigation across domains. The primary differentiator for
knowledge discovery beyond single-page analysis.

### 10.1 HITL UX Template

Present at each hop:

```
========== EXPEDITION: [current-page-title] ==========
Depth [D]/[max] | Pages [P]/[max] | Domain: [current-domain]

Continue from here:
  1. [HIGH]     Link title -- why this is relevant (score: 0.87)
  2. [HIGH]     Link title -- why this is relevant (score: 0.81)
  3. [MEDIUM]   Link title -- why this is relevant (score: 0.72)
  4. [HIGH]     Link title -- why this is relevant (score: 0.68)
  5. [WILDCARD] Link title -- unexpected connection (serendipity pick)

Or: [s]top expedition | [b]ack to [parent-title] | [v]iew full tree
```

**Key UX decisions:**

- 5 options: 4 high-relevance + 1 wildcard (epsilon-greedy serendipity)
- Ranked list format (easier to parse in terminal than cards)
- Always include back-to-parent option
- Always show progress: depth/max, pages/max, current domain
- Frame options as recommendations ("Continue from here") not suggestions ("You
  might also explore") -- 13x engagement difference (Perplexity 40% vs Google
  PAA 3% interaction rate)

### 10.2 Budget and Limits

| Parameter             | Default                       | Rationale                                                 |
| --------------------- | ----------------------------- | --------------------------------------------------------- |
| `depth_max`           | 3 hops                        | Each hop is new site context; 3 is cognitively manageable |
| `pages_max`           | 15                            | Balances coverage with cost                               |
| `tokens_per_page`     | ~2,500                        | Estimate for average content page with metadata           |
| `wall_clock_per_page` | 10-15 seconds                 | Static + scoring pipeline                                 |
| `alive_check_timeout` | 5 seconds                     | HEAD request timeout                                      |
| `options_per_step`    | 4 high-relevance + 1 wildcard | Epsilon-greedy strategy                                   |

**Domain-adaptive depth:** 3 hops for open web (default). Academic or curated
domains (arXiv, GitHub Awesome lists, Wikipedia) may support 5+ hops. The
thematic saturation signal (3 consecutive pages yielding no new themes) is the
better stopping rule than a fixed depth limit.

### 10.3 Three-File State Pattern

```
.research/website-analysis/<site-slug>/
├── expedition-{timestamp}.meta.json    # L1: Session metadata (full rewrite)
├── expedition-{timestamp}.snap.json    # L2: Current tree snapshot (full rewrite)
└── expedition-{timestamp}.jsonl        # L3: Event log (append-only, never rewritten)
```

**expedition-{timestamp}.meta.json:**

```json
{
  "schema_version": "1.0",
  "session_id": "exp-{timestamp}",
  "seed_url": "https://example.com",
  "started_at": "ISO8601",
  "updated_at": "ISO8601",
  "depth_max": 3,
  "pages_max": 15,
  "pages_visited": 0,
  "current_depth": 0,
  "current_url": "https://example.com",
  "status": "active|paused|complete",
  "themes_found": [],
  "domains_visited": ["example.com"]
}
```

**expedition-{timestamp}.snap.json (flat array with parent pointers):**

```json
{
  "schema_version": "1.0",
  "session_id": "exp-{timestamp}",
  "snapshot_at": "ISO8601",
  "nodes": [
    {
      "id": "node-001",
      "url": "https://example.com",
      "title": "Example Site",
      "depth": 0,
      "parent_id": null,
      "visited_at": "ISO8601",
      "score": 1.0,
      "status": "analyzed|visited|skipped",
      "themes": ["react", "performance"],
      "knowledge_candidates_count": 3
    }
  ]
}
```

**Why flat array (not nested JSON):** Append-only JSONL events add nodes without
rewriting the tree structure. Parent pointer traversal is O(n) but n is small
(max 15 nodes). Mirrors Chromium's flat-list history storage design.

**expedition-{timestamp}.jsonl event types:**

```jsonl
{"event": "node_visit", "node_id": "node-001", "url": "https://example.com", "depth": 0, "timestamp": "ISO8601"}
{"event": "link_selection", "node_id": "node-001", "selected_url": "https://next.com", "selected_rank": 2, "timestamp": "ISO8601"}
{"event": "snapshot", "nodes_count": 5, "timestamp": "ISO8601"}
{"event": "budget_warning", "pages_remaining": 5, "timestamp": "ISO8601"}
{"event": "expedition_paused", "reason": "user_request", "timestamp": "ISO8601"}
{"event": "expedition_resumed", "from_node": "node-003", "timestamp": "ISO8601"}
{"event": "expedition_complete", "reason": "depth_max|pages_max|saturation|user_stop", "timestamp": "ISO8601"}
```

### 10.4 Resume Protocol

Six-step resume on re-invocation:

1. On skill invocation for a URL, scan `.research/website-analysis/<site-slug>/`
   for `expedition-*.meta.json`
2. If found: read `meta.json` (status check) + `snap.json` (tree reconstruction)
3. Parse JSONL event log for events after last snapshot
4. Reconstruct current tree state in memory
5. Present path summary: "Previous expedition found: [N] pages, depth [D], last
   visited [URL]. Resume from [current node] or start fresh?"
6. Wait for user decision before proceeding

**Stale expedition handling:** If `meta.json.updated_at` is >7 days old, warn
about staleness: "This expedition is [N] days old. Site content may have
changed. Resume (preserving tree) or start fresh?"

### 10.5 Epsilon-Greedy Selection Strategy

For each hop's 5-option presentation:

1. Score all links on the current page using the 7-component formula (Section 8)
2. Rank by composite score
3. Select top 4 as "high-relevance" options
4. Select 1 "wildcard" option from rank 5-15 range using epsilon-greedy:
   - 80% of the time: pick randomly from positions 5-10
   - 20% of the time: pick randomly from positions 10-15 (deeper serendipity)
5. If fewer than 5 scoreable links exist, reduce options to available count
   (minimum 2: 1 high-relevance + 1 wildcard)

### 10.6 Circular Visit Detection

Maintain a visited URL set in `snap.json` nodes. Before presenting a link as an
option:

- Check if URL (normalized: strip trailing slash, lowercase) is already in
  visited set
- If visited: skip and present next-ranked unvisited link
- In the expedition tree view, mark visited nodes differently from unvisited

---

## 11. Site Mode (Decisions #2, #16, #31)

Multi-page analysis of one domain. Two input methods.

### 11.1 Explicit URL List Mode

```
/website-analysis --urls=URL1,URL2,URL3
```

- Analyze each URL sequentially
- Each page gets its own Phase 0 (Quick Scan)
- Combined Creator View covers all pages as a unified analysis
- Single `analysis.json` with `meta.pages_analyzed` reflecting total count
- Per-page findings in `findings.jsonl` with distinct `source_url` per finding

### 11.2 Auto-Discovery Mode

```
/website-analysis URL --site
```

1. Start from the provided root URL
2. Complete Phase 0 (Quick Scan) on root page
3. Score all internal links using the link scoring formula (Section 8)
4. Select top-scored internal links as next pages to analyze
5. Proceed through pages, re-scoring links at each page for next candidates

### 11.3 Approval Gate Pattern (Decision #31)

**No hard page cap.** Instead, pause for approval every 5 pages showing
progress:

```
========== SITE MODE: Page Gate (5/5 pages analyzed) ==========

Progress so far:
  - Themes found: [theme1, theme2, theme3]
  - Knowledge candidates: [N] identified
  - Links scored: [N] internal, [N] external
  - Top unanalyzed pages:
    1. /docs/api-reference (score: 0.85)
    2. /blog/architecture (score: 0.78)
    3. /about/team (score: 0.62)

Continue to next 5 pages? [y/N]
```

User decides to continue or wrap up. On wrap-up, proceed directly to Phase 2
(Creator View) with content analyzed so far.

### 11.4 Site Mode Output

All per-page data merged into single per-site artifact set:

- `analysis.json` covers the entire site
- `findings.jsonl` contains per-page findings with `source_url` field
- `links.json` aggregates all scored links across pages (deduplicated by URL)
- `sitemap.json` populated with all discovered/analyzed pages
- `SITE-ANALYSIS.md` Creator View covers the site holistically

---

## 12. Routing Menu (Decision #24)

After Standard/Deep analysis completes, present 7 options:

### Option 1: Extract Knowledge

**Behavior:**

1. Present ranked knowledge candidates from `value-map.json` with fit badges
2. User selects candidates to extract
3. For each selected candidate: a. Write decision to `extraction-journal.jsonl`
   (append) b. Update `value-map.json` candidate status to `selected`
4. Auto-regenerate `EXTRACTIONS.md` from `extraction-journal.jsonl`

**Journal entry format:**

```jsonl
{
  "schema_version": "1.0",
  "source_type": "website",
  "source": "https://example.com",
  "candidate": "CSS Reset Methodology",
  "candidate_type": "methodology",
  "status": "selected",
  "decision": "extract",
  "decision_date": "2026-04-06",
  "extracted_to": null,
  "notes": "User selected for extraction."
}
```

### Option 2: Start Expedition

**Behavior:** Launch Expedition mode (Section 10) using the analyzed page as the
seed URL. Expedition state files created in the same site-slug directory.

### Option 3: Deep-plan This

**Behavior:** Inject the analysis as research context into `/deep-plan`. The
`SITE-ANALYSIS.md` and `analysis.json` are formatted as a DIAGNOSIS.md research
context section.

### Option 4: Save to Memory

**Behavior:** Persist key findings to MCP memory or conversation context.
Surface the top 3-5 insights and ask which to persist.

### Option 5: Explore Insights

**Behavior:** Enter a conversational mode where the user can ask deeper
questions about the Creator View analysis. The full analysis artifacts remain
loaded as context.

### Option 6: Done

**Behavior:**

1. Confirm all artifacts are written to disk
2. Display artifact summary (file count, location)
3. Update state file to `status: "complete"`
4. Run invocation tracking (SKILL.md invocation section)

### Option 7: Cross-site Synthesis (Decisions #19, #20)

**Condition:** Only offered when 3+ sites exist in
`.research/website-analysis/`.

**Check:** `ls .research/website-analysis/*/analysis.json | wc -l >= 3`

**Behavior:** Suggest `/website-synthesis` with list of analyzed sites. User
confirms which sites to include in synthesis.

---

## 13. Agent Allocation (Decision #29)

### Standard Mode

| Agent                 | Role                                                                | Always?                   |
| --------------------- | ------------------------------------------------------------------- | ------------------------- |
| Orchestrator (inline) | Phase management, state updates, extraction pipeline                | Yes                       |
| Agent 1 (spawned)     | Creator View analysis (loads home context, writes SITE-ANALYSIS.md) | If content is substantial |
| Agent 2 (spawned)     | Engineer View analysis (dimensions, scoring)                        | If content is substantial |

Maximum: orchestrator + 2 spawned agents.

### Deep Mode

| Agent                 | Role                                | Always?                |
| --------------------- | ----------------------------------- | ---------------------- |
| Orchestrator (inline) | Phase management, state updates     | Yes                    |
| Agent 1 (spawned)     | Creator View analysis               | Yes                    |
| Agent 2 (spawned)     | Engineer View analysis              | Yes                    |
| Agent 3 (spawned)     | Link scoring + value map generation | If >20 scoreable links |

Maximum: orchestrator + 3 spawned agents.

### Staged Wave Execution

```
VALIDATE:    Inline orchestrator -- tool availability check
PREFLIGHT:   Inline orchestrator -- compliance check
Phase 0:     Inline orchestrator -- Quick Scan (no spawn needed)
GATE:        Inline orchestrator -- present Quick Scan, ask to proceed
Phase 1:     Inline orchestrator -- content extraction
Phase 1b:    Inline orchestrator -- multi-page (Site mode only)
Phase 2-3:   Agent Wave -- up to 2-3 concurrent agents
             Each writes its artifacts before returning
             Orchestrator verifies file existence (does not trust return values)
Phase 4:     Inline orchestrator -- value map aggregation
ROUTING:     Inline orchestrator -- present menu
```

**Hard cap:** 4 concurrent agents (same as repo-analysis). Wave staging required
for pools larger than 4.

**Agent failure handling (MUST):**

1. After each agent completes, verify output file exists
2. If file is empty (0 bytes -- Windows agent output bug): capture
   task-notification result text, write to output file
3. If agent failed entirely: log failure, re-dispatch with narrower scope
4. If retry also fails: report to user, continue with available data
5. NEVER silently accept missing analysis data

---

## 14. State File Schema (Decision #6)

**File naming:** `.claude/state/website-analysis.<site-slug>.state.json`

Each analysis gets its own state file keyed by site slug. Examples:

- `website-analysis.joshwcomeau-com--css--custom-css-reset.state.json`
- `website-analysis.developer-mozilla-org--en-us--docs.state.json`
- `website-analysis.react-dev--learn.state.json`

```json
{
  "schema_version": "1.0",
  "skill": "website-analysis",
  "version": "1.0",
  "slug": "<site-slug>",
  "target_url": "https://example.com/page",
  "target_domain": "example.com",
  "status": "in-progress|complete|failed|hard-blocked",
  "phase": 0,
  "depth": "quick|standard|deep",
  "mode": "page|site|expedition",
  "phases_completed": [],
  "phases_failed": [],
  "extraction_mode": "superpowers-chrome|webfetch-playwright|webfetch-only",
  "compliance_status": "PROCEED|WARN|HARD_BLOCK",
  "compliance_acknowledged": false,
  "pages_analyzed": 0,
  "output_dir": ".research/website-analysis/<site-slug>/",
  "expedition_session_id": null,
  "agents_spawned": 0,
  "agents_completed": 0,
  "startedAt": "ISO8601",
  "completedAt": null,
  "resumable": true
}
```

**Field definitions:**

| Field                     | Type    | Description                                    |
| ------------------------- | ------- | ---------------------------------------------- |
| `skill`                   | string  | Always `"website-analysis"`                    |
| `version`                 | string  | Skill version for compatibility checking       |
| `slug`                    | string  | Site slug derived from URL (Section 9)         |
| `target_url`              | string  | Original URL provided by user                  |
| `target_domain`           | string  | Domain extracted from URL                      |
| `status`                  | string  | Current status                                 |
| `phase`                   | number  | Current phase number (0-4)                     |
| `depth`                   | string  | Requested depth tier                           |
| `mode`                    | string  | Operating mode                                 |
| `phases_completed`        | array   | List of completed phase names                  |
| `phases_failed`           | array   | List of failed phases with reason              |
| `extraction_mode`         | string  | Which extraction pipeline was selected         |
| `compliance_status`       | string  | Pre-flight result                              |
| `compliance_acknowledged` | boolean | Whether user acknowledged WARN                 |
| `pages_analyzed`          | number  | Pages analyzed so far (Site/Expedition mode)   |
| `output_dir`              | string  | Output artifact directory                      |
| `expedition_session_id`   | string  | Expedition session ID (null if not expedition) |
| `agents_spawned`          | number  | Count of agents spawned this run               |
| `agents_completed`        | number  | Count of agents that finished                  |
| `startedAt`               | string  | ISO 8601 analysis start time                   |
| `completedAt`             | string  | ISO 8601 completion time (null if in-progress) |
| `resumable`               | boolean | Whether this analysis can be resumed           |

**State update protocol:** Update the state file after EVERY phase transition.
On resume, read the state file and skip completed phases.

---

## 15. Tool Fallback Matrix (Decision #27)

### Primary Pipeline (superpowers-chrome available, Decisions #1, #7)

| Step | Tool                             | Output                                   | Tier      |
| ---- | -------------------------------- | ---------------------------------------- | --------- |
| 1    | `use_browser` navigate URL       | HTML + MD + PNG + console (auto-capture) | Quick+    |
| 2    | `use_browser` eval (metadata JS) | title, meta, OG, JSON-LD, counts         | Quick+    |
| 3    | WebFetch URL with prompt         | processed content (model-synthesized)    | Standard+ |
| 4    | curl -sI URL                     | HTTP response headers                    | Deep only |

### Fallback Pipeline (superpowers-chrome unavailable)

| Step | Tool                               | Output                         | Tier      |
| ---- | ---------------------------------- | ------------------------------ | --------- |
| 1    | WebFetch URL                       | processed content              | Quick+    |
| 2    | Playwright MCP navigate + run_code | metadata + counts + screenshot | Quick+    |
| 3    | curl -sI URL                       | HTTP response headers          | Deep only |

### Capability Mapping

| Capability             | Primary Tool                           | Fallback Tool                  | Degradation                                            |
| ---------------------- | -------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| Content extraction     | superpowers-chrome navigate (MD)       | WebFetch (processed)           | WebFetch is model-processed, not raw; different signal |
| Metadata extraction    | superpowers-chrome eval (JS)           | Playwright MCP eval (run_code) | Equivalent capability                                  |
| Screenshot capture     | superpowers-chrome (auto per navigate) | Playwright MCP screenshot      | Equivalent capability                                  |
| Processed content      | WebFetch (explicit prompt)             | WebFetch (same)                | No degradation                                         |
| HTTP headers           | curl -sI                               | curl -sI                       | No degradation (same tool)                             |
| Visual design analysis | Screenshot from navigate               | Screenshot from Playwright     | Equivalent                                             |
| JS-rendered content    | superpowers-chrome (real Chrome)       | Playwright MCP (headless)      | Real Chrome better at Cloudflare bypass                |

### Detection Protocol

At skill invocation (VALIDATE phase):

1. Check if `use_browser` MCP tool is available in current session
2. If available: set `extraction_mode: "superpowers-chrome"` in state file
3. If unavailable: set `extraction_mode: "webfetch-playwright"`, log warning:
   "superpowers-chrome not available. Using WebFetch + Playwright MCP fallback.
   Some extraction capabilities may be reduced."
4. If Playwright MCP also unavailable: set `extraction_mode: "webfetch-only"`,
   log warning: "Both superpowers-chrome and Playwright MCP unavailable. Using
   WebFetch only. Metadata extraction and screenshots will be limited."

### Tool Comparison Summary (from EXTRACTION_TEST.md)

| Tool               | Strengths                                                                         | Weaknesses                                                      |
| ------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| WebFetch           | Excellent processed content, handles JS-heavy SPAs, good metadata                 | Model-processed (not raw), output is synthesis not reproduction |
| superpowers-chrome | Auto-capture (HTML+MD+PNG+console), real Chrome for Cloudflare, eval for metadata | Requires MCP server running                                     |
| Playwright MCP     | Good structured metadata, JS-rendered content, screenshot                         | High token cost (~114k/session), no built-in stealth            |
| curl + pandoc      | Raw HTTP headers                                                                  | Cannot handle complex HTML (CSS-in-JS, styled-components)       |

---

## Appendix: Decision Coverage Map

All 36 decisions from DECISIONS.md mapped to their implementation location.

| Decision | Topic                                         | Location                                            |
| -------- | --------------------------------------------- | --------------------------------------------------- |
| #1       | Extraction pipeline                           | REFERENCE.md Section 15                             |
| #2       | Skill modes                                   | SKILL.md Modes section, REFERENCE.md Sections 10-11 |
| #3       | Tiered depth (Quick/Standard/Deep)            | SKILL.md Process Overview                           |
| #4       | File structure (SKILL.md + REFERENCE.md)      | Meta-decision (this file exists)                    |
| #5       | Output location (.research/website-analysis/) | REFERENCE.md Section 1.0                            |
| #6       | State file pattern                            | REFERENCE.md Section 14                             |
| #7       | superpowers-chrome mode                       | REFERENCE.md Section 15                             |
| #8       | Cross-entity tracking                         | REFERENCE.md Sections 1.12-1.13                     |
| #9       | Creator View sections                         | REFERENCE.md Section 4                              |
| #10      | Value axes (13)                               | REFERENCE.md Section 2                              |
| #11      | Absence patterns (11)                         | REFERENCE.md Section 3                              |
| #12      | Output artifacts                              | REFERENCE.md Section 1                              |
| #13      | Scoring bands                                 | REFERENCE.md Section 6                              |
| #14      | Compliance gates                              | REFERENCE.md Section 7                              |
| #15      | Quick Scan composition                        | SKILL.md Quick Scan section                         |
| #16      | Site mode multi-page                          | REFERENCE.md Section 11                             |
| #17      | Expedition HITL                               | REFERENCE.md Section 10                             |
| #18      | Expedition state                              | REFERENCE.md Sections 1.11, 10.3                    |
| #19      | Cross-site synthesis trigger                  | REFERENCE.md Section 12 Option 7                    |
| #20      | Cross-site synthesis as separate skill        | REFERENCE.md Section 12 Option 7                    |
| #21      | Link scoring weights                          | REFERENCE.md Section 8                              |
| #22      | High-link-density trigger                     | REFERENCE.md Section 8.5                            |
| #23      | URL-to-slug algorithm                         | REFERENCE.md Section 9                              |
| #24      | Routing menu                                  | REFERENCE.md Section 12                             |
| #25      | Engineer View dimensions                      | REFERENCE.md Section 5                              |
| #26      | Tables storage (JSON)                         | REFERENCE.md Section 1.6                            |
| #27      | Tool unavailability fallback                  | REFERENCE.md Section 15                             |
| #28      | Home context loading                          | REFERENCE.md Section 4.1                            |
| #29      | Agent allocation                              | REFERENCE.md Section 13                             |
| #30      | Cloudflare handling                           | REFERENCE.md Section 7.5                            |
| #31      | Site mode page budget                         | REFERENCE.md Section 11.3                           |
| #32      | Per-use retro (not formal)                    | SKILL.md Routing Menu serves this purpose           |
| #33      | Invocation tracking                           | SKILL.md Invocation Tracking section                |
| #34      | RSS/feed detection                            | REFERENCE.md Section 7.6                            |
| #35      | Creator context injection                     | REFERENCE.md Section 4.1                            |
| #36      | Screenshot usage                              | REFERENCE.md Section 2 Axis 6 note                  |

---

## Version History

| Version | Date       | Description                                                    |
| ------- | ---------- | -------------------------------------------------------------- |
| 1.0     | 2026-04-06 | Initial implementation. 15 sections covering all 36 decisions. |
