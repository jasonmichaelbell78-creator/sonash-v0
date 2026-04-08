# Deep Read: unstructured-io/unstructured

**Analyzed:** 2026-04-07 | **Skill:** repo-analysis v4.3

---

## Internal Artifacts Found

### Documentation (beyond README)

| Artifact                        | Read                    | Knowledge Found                                                                                                                           |
| ------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `CONTRIBUTING.md`               | Yes                     | PR checklist, conventional commits, squash-and-merge, comment convention `# NOTE(<user>): <comment>`                                      |
| `CHANGELOG.md`                  | Yes (recent 20 entries) | Active development velocity — 16 releases in v0.22.x series. Formula markdown, table chunking, PDF memory optimization, telemetry opt-out |
| `scripts/performance/README.md` | Yes                     | Benchmarking against fixed test docs (stored in S3), py-spy profiling, memray memory profiling, speedscope visualization                  |
| `unstructured/embed/README.md`  | Yes                     | Embedding module deprecated — moved to `unstructured-ingest` repo. Module will be removed                                                 |
| `CODE_OF_CONDUCT.md`            | Yes                     | Contributor Covenant 2.1                                                                                                                  |

### Architecture Documents

| Artifact                                          | Read         | Knowledge Found                                                                                                                                                                                                    |
| ------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `unstructured/partition/auto.py` (390 lines)      | Yes          | **Core routing hub.** `partition()` auto-detects file type via libmagic, routes to type-specific partitioner. Strategy selection: AUTO, FAST, OCR_ONLY, HI_RES                                                     |
| `unstructured/file_utils/model.py` (591 lines)    | Yes          | **FileType enum.** Rich enum with partitioner shortname, importable deps, extra name, extensions, MIME types. The registry pattern — each file type declares everything needed to partition it                     |
| `unstructured/documents/elements.py` (1111 lines) | Yes          | **Element type hierarchy.** Dataclass-based with rich metadata (coordinates, data source, permissions). DataSourceMetadata, CoordinatesMetadata. Element types: Title, Text, ListItem, Table, Image, Formula, etc. |
| `unstructured/documents/ontology.py` (622 lines)  | Yes          | **V2 ontology** (Pydantic-based). HTML intermediate representation with ElementTypeEnum. TODO comment from "Pluto" suggests this is under active redesign. 14 element categories                                   |
| `unstructured/partition/strategies.py`            | Yes          | Strategy validation and auto-determination. Graceful fallback chain: HI_RES → OCR_ONLY → FAST with dependency checks                                                                                               |
| `unstructured/partition/pdf.py` (1465 lines)      | Yes (header) | Most complex partitioner. Uses pdfminer, pypdf, pi-heif, unstructured-inference. Graphics vs text operator ratio to detect complex PDFs. Coordinate space tracking                                                 |
| `unstructured/chunking/base.py` (1801 lines)      | Yes (header) | Title-based and basic chunking. Configurable max chars (default 500), multi-page support, token counting via tiktoken, table isolation during chunking                                                             |
| `unstructured/staging/base.py` (830 lines)        | Yes (header) | Serialization/deserialization. Formula markdown export with auto/display_math/plain modes. 200MB decompressed size limit. Output adapters for various platforms                                                    |
| `unstructured/cleaners/core.py` (490 lines)       | Yes (header) | Text cleaning pipeline: non-ASCII, bullets, ligatures, ordered bullets, whitespace. Pattern-based using compiled regex                                                                                             |

### Testing & Quality

| Artifact                               | Read    | Knowledge Found                                                                   |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| `test_unstructured/` (113 files)       | Scanned | Mirrors source structure exactly. Unit tests for every module                     |
| `test_unstructured_ingest/` (11 files) | Scanned | Integration tests with expected markdown output snapshots for 40+ connector types |
| `.coveragerc`                          | Noted   | Coverage configuration present                                                    |
| `test_unstructured/benchmarks/`        | Noted   | Performance benchmarks as tests                                                   |

### DevOps & Security

| Artifact                  | Read         | Knowledge Found                                                                                      |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `.pre-commit-config.yaml` | Yes          | black (line-length=100), ruff, flake8, check-added-large-files, check-toml/yaml/json/xml             |
| `.grype.yaml`             | Yes          | Vulnerability scanning with CVE-2024-11053 ignored                                                   |
| `Dockerfile`              | Yes (header) | wolfi-base (Chainguard), tesseract + tessdata, libreoffice, poppler, uv-based install, non-root user |
| `renovate.json5`          | Noted        | Automated dependency updates                                                                         |

### Examples

| Artifact                    | Read   | Knowledge Found                                                                                                   |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `example-docs/` (124 files) | Listed | Comprehensive test corpus: PDFs, DOCX, XLSX, HTML, EML, WAV audio, HEIC images, CSV, ORG, RST, PPTX, EPUB formats |

---

## Key Insights Not Visible From Code Alone

1. **Embedding module is being sunset** — moved to `unstructured-ingest`. This
   suggests the architectural boundary: `unstructured` =
   extraction/partitioning, `unstructured-ingest` = connectors + embedding +
   pipeline.

2. **Ontology V2 is under active redesign** — TODO comment from "Pluto" suggests
   simplification. Current V2 uses Pydantic models as HTML intermediate
   representation, but the team knows this is over-engineered.

3. **Performance profiling is S3-backed** — Benchmark results stored in S3 with
   architecture/instance type/git hash tagging. This is production-grade
   benchmarking infrastructure.

4. **The repo has 40+ connector integrations via expected-output snapshots** —
   The ingest test directory contains golden-file snapshots for Salesforce,
   Notion, Confluence, Jira, Google Drive, HubSpot, Slack, Discord, Reddit, and
   many more. This is the strongest signal of real-world connector coverage.

5. **Formula handling is sophisticated** — Auto-detection of LaTeX-like
   notation, Unicode-to-LaTeX normalization, multiple markdown export styles.
   This suggests deep investment in academic/scientific document processing.

6. **Telemetry controversy resolved** — v0.22.0 flipped telemetry to opt-in by
   default. Previous opt-out only recognized exact string "true". This suggests
   community pressure on privacy.

---

## Artifacts Cataloged for Phase 4b

- External docs site: https://docs.unstructured.io
- Related repos: `Unstructured-IO/unstructured-ingest`,
  `Unstructured-IO/unstructured-inference`
- Performance benchmarking S3 results
- 40+ connector type snapshot tests (golden files)
