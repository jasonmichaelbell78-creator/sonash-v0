# Deep Read: DS4SD/docling

**Analyzed:** 2026-04-07 | **Skill:** repo-analysis v4.3

---

## Internal Artifacts Found

### Documentation (MkDocs site — 40+ pages)

| Artifact                               | Read    | Knowledge Found                                                                                                                                                                                                                                         |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/concepts/architecture.md`        | Yes     | Backend (format parsing) + Pipeline (orchestration) + DoclingDocument (output). Dashed-outline = extensible base classes                                                                                                                                |
| `docs/concepts/docling_document.md`    | Yes     | **Key artifact.** Pydantic-based unified doc repr. Two categories: content items (texts, tables, pictures, key_value_items) + content structure (body tree, furniture, groups). Hierarchy via JSON pointers. Reading order via body tree child ordering |
| `docs/concepts/chunking.md`            | Yes     | BaseChunker + HybridChunker. chunk() + contextualize() API. Integrates with LlamaIndex/LangChain. Two approaches: export-to-markdown-then-chunk OR native Docling chunker                                                                               |
| `docs/concepts/serialization.md`       | Yes     | Serializer hierarchy: BaseDocSerializer → MarkdownDocSerializer, HTMLDocSerializer. Per-component serializers (text, table, picture, list). SerializerProvider abstraction                                                                              |
| `docs/concepts/plugins.md`             | Yes     | **pluggy-based plugin system.** Third-party OCR engines, layout models, table structure models via setuptools entrypoints. `allow_external_plugins` flag required for third-party                                                                       |
| `docs/usage/mcp.md`                    | Yes     | Separate `docling-mcp` package. MCP server for Claude Desktop, LM Studio. Tools for LlamaIndex, Llama Stack, Pydantic AI, smolagents                                                                                                                    |
| `docs/usage/vision_models.md`          | Yes     | VlmPipeline for end-to-end VLM conversion. DocTags output (preferred), Markdown, HTML. Local models via Transformers or MLX. GraniteDocling, SmolDocling                                                                                                |
| `docs/usage/enrichments.md`            | Yes     | Post-processing enrichments: code understanding, formula understanding, picture classification, picture description. Each toggleable via pipeline options                                                                                               |
| `docs/usage/processing_audio_media.md` | Yes     | ASR pipeline via Whisper Turbo. Auto-selects mlx-whisper on Apple Silicon. WAV/MP3/M4A/MP4/AVI support. Outputs same DoclingDocument                                                                                                                    |
| `docs/usage/supported_formats.md`      | Noted   | Full format matrix                                                                                                                                                                                                                                      |
| `docs/integrations/` (20+ files)       | Scanned | LangChain, LlamaIndex, CrewAI, Haystack, spaCy, NVIDIA, InstructLab, Apify + 12 more                                                                                                                                                                    |
| `docs/v2.md`                           | Noted   | Migration guide from v1                                                                                                                                                                                                                                 |

### Architecture Files

| Artifact                                    | Read         | Knowledge Found                                                                                                                                           |
| ------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docling/document_converter.py`             | Yes          | Core entry point. FormatOption = backend + pipeline_cls + options. InputFormat enum routes to backends. Thread-safe pipeline cache                        |
| `docling/document_extractor.py`             | Yes (header) | Structured information extraction — separate from conversion. VLM-based extraction pipeline                                                               |
| `docling/datamodel/base_models.py`          | Yes          | InputFormat enum (17 formats), ConversionStatus, BaseFormatOption. docling_core types imported                                                            |
| `docling/pipeline/standard_pdf_pipeline.py` | Yes (header) | Thread-safe, production-ready. Per-run isolation, deterministic run IDs, bounded queues, back-pressure, minimal shared state. Factory-based model loading |
| `docling/backend/` (25+ files)              | Listed       | One backend per format. Abstract base → format-specific. Multiple PDF backends (docling_parse v2/v4, pypdfium2, managed_pdfium)                           |
| `docling/models/`                           | Listed       | Layout models, OCR models, table models, VLM models, extraction models. Factory pattern. Plugin system                                                    |

### Process & Quality

| Artifact                  | Read    | Knowledge Found                              |
| ------------------------- | ------- | -------------------------------------------- |
| `CITATION.cff`            | Yes     | Academic citation format. arXiv:2408.09869   |
| `CONTRIBUTING.md`         | Noted   | Standard contribution guide                  |
| `MAINTAINERS.md`          | Noted   | IBM Research Zurich maintainers              |
| `.pre-commit-config.yaml` | Noted   | Pre-commit configured                        |
| `tests/` (55 files)       | Scanned | Per-backend tests, pipeline tests, ASR tests |

---

## Key Insights Not Visible From Code Alone

1. **Multi-package architecture by design.** Core types live in `docling-core`,
   PDF parsing in `docling-parse`, IBM models in `docling-ibm-models`, MCP in
   `docling-mcp`. This is intentional — each package has a clear boundary,
   unlike unstructured's monolith.

2. **DoclingDocument is the linchpin.** Everything converts TO DoclingDocument,
   everything exports FROM DoclingDocument. It's a tree structure (not a flat
   list like unstructured's Elements), with body/furniture separation and
   reading order via tree traversal.

3. **Plugin system via pluggy is production-grade.** Third-party developers can
   register OCR engines, layout models, table structure models via setuptools
   entrypoints. This is the extension mechanism unstructured doesn't have.

4. **Structured information extraction is a separate pipeline.**
   `document_extractor.py` is distinct from `document_converter.py` — conversion
   gives you document structure, extraction gives you specific data points
   (e.g., extract all dates, extract all named entities). VLM-based.

5. **Thread safety is a first-class concern.** The PDF pipeline docstring
   explicitly describes per-run isolation, bounded queues, back-pressure, and
   deterministic shutdown. This is production engineering, not research code.

6. **20+ framework integrations maintained.** Not just "we support LangChain" —
   there are dedicated docs pages for each integration with code examples.
