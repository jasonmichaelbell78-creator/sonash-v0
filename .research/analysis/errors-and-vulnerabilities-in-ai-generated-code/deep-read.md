# Deep Read — Errors and Vulnerabilities in AI-Generated Code

**Date:** 2026-04-09 | **Phase:** 2b

## Document Structure

6-page structured reference table. No sections beyond the table itself — each
row is a self-contained error category entry with 7 columns: Error Category,
Description, Examples, Impact/Risks, Mitigation Strategy, Source.

## Internal Artifacts Found

No internal artifacts beyond the table — this is a flat reference document, not
a multi-section paper. No appendices, no methodology section, no data tables.

## Citations Cataloged (53 references)

The document cites 53 sources across the 18 categories. Citations are numbered
[1]-[53] plus several "Source_N" references. These span:

- Academic papers on AI code generation quality
- Security vulnerability databases and CVE references
- Industry reports on AI-assisted development risks
- Tool documentation (SonarQube, Snyk, TruffleHog)

No individual citation URLs are provided in the extracted text — they would
require consulting the bibliography page (not included in the 6 extracted
pages).

## Key Knowledge Not Visible From Summary

- **Specific CWE references:** CWE-22 (path traversal) explicitly called out in
  the Injection/XSS row. Other CWEs likely referenced in citations.
- **"Vibe Engineering" term:** Used in Requirements Ambiguity row — refers to
  planning/documentation before AI code generation. Aligns with our deep-plan
  approach.
- **"Dep-Hallucinator" tool:** Mentioned in Supply Chain row — a tool
  specifically designed to detect AI-hallucinated package names. Worth
  investigating.
- **ESBMC formal verification:** Mentioned in Memory Safety row — a model
  checker for C/C++. Not directly relevant (we're TypeScript) but shows the
  formal verification approach to AI code safety.
