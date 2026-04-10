# Deep Read — opendatalab/MinerU

**Skill version:** repo-analysis v4.3 **Depth:** standard **Generated:**
2026-04-10

## Purpose

Catalog of internal artifacts beyond source code — the knowledge that lives in
MinerU's documentation, reference pages, and embedded metadata. The dimension
wave agents read code; this phase reads what the code is explained with.

## Artifacts discovered

### Documentation site (mkdocs, bilingual)

- `docs/en/` + `docs/zh/` — parallel English/Chinese trees
- `mkdocs.yml` — site config
- `docs/en/index.md` — landing page
- `docs/en/quick_start/index.md` — install + hardware matrix
- `docs/en/quick_start/docker_deployment.md`
- `docs/en/quick_start/extension_modules.md` — install variants (core, vllm,
  lmdeploy, pipeline, http-client)
- `docs/en/usage/index.md`
- `docs/en/usage/quick_usage.md`
- `docs/en/usage/cli_tools.md` — all 6 CLI tools + full env-var reference
- `docs/en/usage/advanced_cli_parameters.md` — CUDA_VISIBLE_DEVICES patterns,
  vllm/lmdeploy passthrough
- `docs/en/usage/model_source.md`
- `docs/en/reference/output_files.md` — **structured output schema**
  (middle.json format, span/line/block hierarchy)
- `docs/en/reference/changelog.md` — 2.5 → 3.0 version history with per-release
  detail
- `docs/en/demo/index.md` — single iframe demo (low value)
- `docs/en/faq/index.md` — two entries + AI assistant deferral (low value)
- `docs/zh/usage/acceleration_cards/{Ascend,AMD,Biren,Cambricon,Enflame,Hygon,IluvatarCorex,Kunlunxin,METAX,MooreThreads,Tecorigin,THead,VastAI}.md`
  — 13 Chinese-only hardware-specific guides (English translations absent)

### Root-level artifacts

- `README.md` (~35 KB, 500+ lines) — capability overview, changelog excerpt,
  integration matrix
- `README_zh-CN.md` (~33 KB) — Chinese version
- `SECURITY.md` — disclosure process
- `MinerU_CLA.md` — contributor license agreement (CLA)
- `pyproject.toml` — 8 optional-dependency groups: `test`, `vlm`, `vllm`,
  `lmdeploy`, `mlx`, `pipeline`, `gradio`, `core`, `all` (layered install
  pattern)

### Referenced external resources (catalog for Phase 4b)

- arXiv 2409.18839 — MinerU 1.x technical report
- arXiv 2509.22186 — MinerU 2.5 technical report (model architecture, training,
  data engineering, evaluation)
- OmniDocBench (v1.5) — benchmark used for 86.2 accuracy claim
- `mineru-mcp` — separate PyPI package implementing MCP server (not in this
  repo)
- `mineru-vl-utils`, `mineru-vl-utils`, `qwen-vl-utils` — split utility packages

## What each artifact contains that the code doesn't

### `docs/en/reference/output_files.md` — the structured output spec

This is the highest-value documentation asset in the repo and worth reading in
full. It specifies the `middle.json` intermediate representation produced by the
pipeline backend: `pdf_info` array of per-page structures, with a 4-level block
hierarchy (Level 1 blocks `table`/`image` → Level 2 blocks → Lines → Spans).
Every field is typed. Every block type is enumerated (`image_body`,
`image_caption`, `image_footnote`, `table_body`, `table_caption`,
`table_footnote`, `text`, `title`, `index`, `list`, `interline_equation`). The
per-backend section of this file explicitly flags that the VLM backend output
has breaking changes in version 2.5 and is not backward-compatible with the
pipeline backend — a specification-as-contract discipline most projects skip.

**Knowledge it provides that the code doesn't:** the semantic meaning of each
block type, the debug file catalog (layout.pdf, span.pdf, model.json,
middle.json), the bbox coordinate system (`[x0, y0, x1, y1]`), and the reading
order numbering convention.

### `docs/en/usage/cli_tools.md` — the environment variable catalog

Unlike most repos where env vars are buried in `os.environ.get()` calls, MinerU
maintains a prose catalog of every tunable:

- `MINERU_TOOLS_CONFIG_JSON` — config file location
- `MINERU_FORMULA_ENABLE` / `MINERU_FORMULA_CH_SUPPORT` — formula parsing
  toggles
- `MINERU_TABLE_ENABLE` / `MINERU_TABLE_MERGE_ENABLE` — table parsing toggles
- `MINERU_PDF_RENDER_TIMEOUT` / `MINERU_PDF_RENDER_THREADS` — rendering bounds
- `MINERU_PROCESSING_WINDOW_SIZE` — **sliding window size for the long-doc
  memory bound** (default 64)
- `MINERU_API_MAX_CONCURRENT_REQUESTS` — concurrency gate (default 3)
- `MINERU_API_ENABLE_FASTAPI_DOCS` — whether `/docs` is exposed
- `MINERU_API_OUTPUT_ROOT` — output dir
- `MINERU_LOCAL_API_STARTUP_TIMEOUT_SECONDS` — health-wait bound (default 300)
- `MINERU_API_TASK_RETENTION_SECONDS` — task TTL

**Knowledge it provides:** the full operational-tuning surface without having to
grep the source. A prose env-var catalog is a form of documentation-as-
contract.

### `docs/en/quick_start/index.md` — the hardware decision matrix

The "Prerequisites" section is a real decision matrix: 5 columns (pipeline,
hybrid-auto, vlm-auto, hybrid-http-client, vlm-http-client), 8 rows (Backend
Features, Accuracy, OS, CPU support, GPU acceleration, Min VRAM, RAM, Disk,
Python version). A user can pick their backend before installing. This is the
pattern most multi-mode tools skip.

**Knowledge it provides:** quantified VRAM floors (4GB/8GB/2GB), disk bounds
(20GB+ SSD vs 2GB), Python version constraints (3.10-3.12 on Windows due to
`ray` Python 3.13 gap — a specific footnote the code alone cannot tell you).

### `docs/en/quick_start/extension_modules.md` — the layered install pattern

Five install recipes map to five user profiles:

- `mineru[core]` — everything except vllm/lmdeploy
- `mineru[core,vllm]` — GPU acceleration via vLLM (Volta+, 8GB VRAM)
- `mineru[core,lmdeploy]` — GPU acceleration via LMDeploy
- `mineru` (lightweight) — CPU-only client connecting to a remote OpenAI-compat
  server via `vlm-http-client`
- `mineru[pipeline]` — lightweight client for `hybrid-http-client` mode

Each recipe names its target hardware and its trade-offs. This is the
documentation side of the pyproject.toml's `optional-dependencies` design —
Sections 14 — how to map a user's constraints to an install command.

### `docs/en/reference/changelog.md` — version narrative

Every release entry is prose with capability deltas, not git log output. Links
to issues (#4300, #4283, #4168) and CVE references (CVE-2025-64512 in 2.7.1 via
`pdfminer.six` update). Performance improvements are quantified ("OCR speed
improved 200%~300%", "MLX delivers 100%-200% speed improvement"). Breaking
changes are called out ("VLM backend output has significant changes in version
2.5 and is not backward-compatible"). The changelog doubles as a feature
capability index — you can find when sliding window was added, when
thread-safety was implemented, when DOCX native parsing arrived.

### `docs/en/usage/advanced_cli_parameters.md` — multi-GPU deployment recipes

Explicit working command recipes for common multi-GPU patterns:

- Two openai-server instances on different ports via CUDA_VISIBLE_DEVICES
- Two mineru-api instances on different ports
- mineru-router managing 4 GPUs with one command

Also documents the vllm/lmdeploy passthrough: all officially supported
engine-level parameters flow through MinerU's CLI to the underlying engine. This
is a small documentation discipline with a big operational payoff — users don't
need to wrap or fork MinerU to pass arbitrary engine flags.

### `docs/zh/usage/acceleration_cards/Ascend.md` — hardware-specific deployment depth

Chinese-only (English translation absent) but substantial: vendor-specific
installation instructions, driver/kernel requirements, known issues. 13 such
files exist, one per supported Chinese AI chip. This represents real
vendor-specific engineering effort but creates a documentation gap for
non-Chinese readers. A user on METAX hardware reading the English docs gets
nothing; the same user reading Chinese docs gets a full deployment guide.

**Knowledge it provides:** that the "10+ domestic chip support" claim is not a
marketing line — there's genuine per-chip work. Also that the project's i18n
parity is incomplete.

## Feed-forward to Creator View

Phase 4 Creator View Section 2 ("What's Relevant To Your Work") should draw on:

1. **`output_files.md` schema discipline** — how MinerU specifies its
   intermediate representation. Relevant to any SoNash feature that produces
   structured parse outputs and needs a stable consumer contract.
2. **Env-var prose catalog** — a documentation pattern for tunable behavior.
   Applicable to SoNash's hook system and skill env overrides.
3. **Hardware decision matrix** — a pattern for multi-mode tools. Applicable to
   any SoNash feature where the user has to pick between backends (e.g., whisper
   vs oEmbed vs transcript API in media-analysis).
4. **Layered install via optional-dependencies** — the `core`/`vllm`/`lmdeploy`
   pattern. Applicable to SoNash's skill packaging where some skills have heavy
   optional dependencies.
5. **Changelog-as-capability-index** — a pattern where the changelog doubles as
   feature discovery. Applicable to SoNash's session history.
6. **Async task API (from code + cli_tools docs)** — `POST /tasks` with status
   polling. Relevant to resumable extraction in the CAS pipeline.
7. **mineru-router load balancing (from code + advanced_cli_parameters docs)** —
   the multi-GPU routing design. Relevant only if SoNash ever needs multi-worker
   orchestration for agent dispatch.

## Catalog for Phase 4b Content Evaluation

- **arXiv 2409.18839** — MinerU 1.x technical report. Relevance: methodology for
  document layout analysis. Evaluate whether SoNash's own document extraction
  work (PDF ingest in CAS) could benefit.
- **arXiv 2509.22186** — MinerU 2.5 technical report. Relevance: VLM+OCR fusion
  approach, training data engineering.
- **OmniDocBench v1.5** — benchmark. Relevance: if SoNash ever needs to measure
  its own extraction quality, this is the canonical benchmark in the space.
- **mineru-mcp package** — separate MCP server. Relevance: reference
  implementation of an MCP wrapper around an HTTP API. Worth reading if SoNash
  ever wraps its own services as MCP tools.
