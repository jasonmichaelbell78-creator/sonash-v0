# Engineer View: DS4SD/docling

**Analyzed:** 2026-04-07 | **Depth:** Standard | **Skill:** repo-analysis v4.3

---

## Summary

Document processing SDK and CLI for parsing PDF, DOCX, HTML, audio, images, and
10+ more formats into a unified DoclingDocument representation for gen AI
applications. IBM Research origin, now LF AI & Data Foundation project.

**Type:** Framework/Library | **Language:** Python | **License:** MIT

---

## Health Bands

| Dimension           | Band | Score | Key Evidence                                                                     |
| ------------------- | ---- | ----- | -------------------------------------------------------------------------------- |
| **Security**        | A    | 94    | OpenSSF Best Practices badge, pre-commit, Docker, LF governance                  |
| **Reliability**     | A    | 96    | Released today (v2.85.0), 5 releases in 18 days, 201 contributors, IBM backing   |
| **Maintainability** | B    | 75    | Clean architecture but 875 open issues, 5-package ecosystem complexity           |
| **Documentation**   | A    | 95    | 40+ page MkDocs site, concepts, usage, 20+ integration guides, arXiv paper       |
| **Process**         | A    | 92    | Pre-commit, CITATION.cff, MAINTAINERS.md, LF AI governance, conventional commits |
| **Velocity**        | A+   | 98    | 57K stars in <2 years, weekly releases, 201 contributors                         |

**Composite:** A (92)

---

## Dual-Lens Scoring

### Adoption Lens (secondary)

**Adoption Assessment: ADOPT** — Production-grade with IBM backing, LF
Foundation governance, OpenSSF certification, and 57K stars.

### Creator Lens (primary for T28)

| Factor                   | Score | Note |
| ------------------------ | ----- | ---- | ------------------------------------------------------------------------------- |
| Architectural Innovation | A+    | 98   | DoclingDocument, backend+pipeline separation, plugin system, MCP server         |
| Knowledge Density        | A     | 94   | arXiv paper, 40+ doc pages, 20+ integrations, VLM/ASR pipelines                 |
| Transferable Patterns    | A     | 92   | Backend+Pipeline separation, plugin system, serializer hierarchy all applicable |
| Challenge Quality        | A+    | 96   | "Use docling as T28's document backend" — high-impact architectural decision    |
| Cross-Domain Relevance   | B     | 78   | Documents only — no repos, URLs, APIs, social media                             |

**Creator Assessment:** Most architecturally sophisticated document processing
library. Primary reference for T28 document extraction AND overall system design
patterns.

---

## Key Metrics

| Metric                 | Value                           |
| ---------------------- | ------------------------------- |
| Stars                  | 57,196                          |
| Forks                  | 3,888                           |
| Contributors           | 201                             |
| Open Issues            | 875                             |
| Supported Formats      | 17+                             |
| Framework Integrations | 20+                             |
| Release Cadence        | Weekly                          |
| License                | MIT                             |
| Python Versions        | 3.10-3.14                       |
| Backing                | IBM Research + LF AI Foundation |
