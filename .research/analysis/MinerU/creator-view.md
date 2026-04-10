# Creator View — opendatalab/MinerU

**Skill version:** repo-analysis v4.3 **Depth:** standard **Generated:**
2026-04-10 **Primary lens:** adoption (with strong creator-lens findings)

---

## 1. What This Repo Understands (and Its Blindspots)

MinerU understands that **document parsing is an orchestration problem, not a
model problem**. Most projects that turn PDFs into Markdown ship one approach —
usually whatever the founders built first — and spend the rest of the roadmap
making that one approach better. MinerU shipped three backends and then shipped
a router on top of them. That choice shows up everywhere in the codebase: three
separate `*_analyze.py` entry points with duck-typed signatures, a
string-dispatched factory with deferred `importlib` imports so you don't pay the
torch/vllm cost unless you actually picked that backend, a sliding window
parameter that's wired identically into all three backends, and a mineru-router
that runs a scored load balancer across subprocesses, each pinned to its own GPU
via `CUDA_VISIBLE_DEVICES`. The router is particularly honest: its scoring
formula is `(queued + processing + pending_assignments) / max_concurrent`, with
a shuffle before a stable sort to introduce jitter and an optimistic
`pending_assignments` increment to prevent thundering herd. That's not the work
of someone building a toy — that's the work of someone who's watched a multi-GPU
deployment fail in production and built back the exact safeguards they needed.

It also understands that **users need to make install-time decisions with the
information they have, not the information they wish they had**. The
`pyproject.toml` has eight optional-dependency groups and the
`extension_modules.md` doc maps them to user profiles: CPU-only edge client, GPU
accelerated via vLLM, GPU accelerated via LMDeploy, Apple Silicon via MLX,
lightweight pipeline-only, full core, everything. The `quick_start/index.md`
page has a genuine decision matrix — five backends × eight constraints — so you
can pick before you install. This is the opposite of "just `pip install thing`
and read the errors."

The third thing MinerU deeply understands is **structured output as a
contract**. The `output_files.md` reference page is the best piece of
documentation in the whole repo: it specifies the `middle.json` intermediate
representation with typed fields, a four-level block hierarchy (`table`/`image`
→ Level 2 blocks → Lines → Spans), an enumerated list of every block type
(`image_body`, `image_caption`, `table_body`, `text`, `title`,
`interline_equation`, and so on), an explicit bbox coordinate convention, and a
prominent callout that the VLM backend output has breaking changes in version
2.5 and is **not** backward-compatible with the pipeline backend. Most ML
projects treat their output schema as an implementation detail. MinerU treats it
as a product surface.

**Blindspots.** The tests are a disaster. There is one test file —
`tests/unittest/test_e2e.py` — containing one function, gated by a 0.2% coverage
floor, asserting fuzzy string matches from a single English PDF. `cli.yml` only
runs on pushes to master/dev, never on pull requests. `python-package.yml` runs
on release tags and doesn't execute any tests at all, just install verification.
There's a `rerun.yml` workflow that silently retries failed runs up to 3 times,
converting flake into green. A 58k-star codebase with 109-language OCR claims is
held together, from a quality- engineering standpoint, by one fuzzy string
match.

The HTTP surface is worryingly naive. mineru-api has no authentication — not
even an API key — no rate limiting, no upload size cap, no CORS middleware, no
TrustedHost middleware, and FastAPI docs enabled by default. It's fine when
you're running it on localhost against your own PDFs. The moment somebody
follows the documented
`CUDA_VISIBLE_DEVICES=0,1,2,3 mineru-router --host 0.0.0.0` recipe and binds to
a real interface, they've shipped an unauthenticated file-upload-and-compute
endpoint. The docs don't warn about this. The SECURITY.md is a disclosure
process, not a hardening guide.

And the internationalization parity is broken. Thirteen per-chip acceleration
guides exist under `docs/zh/usage/acceleration_cards/` (Ascend, Cambricon,
Enflame, Hygon, METAX, Moore Threads, and so on). Zero of them have English
translations. The README claims 10+ chip support; an English reader gets nothing
concrete about how to deploy on any of them.

## 2. What's Relevant To Your Work

Three things from MinerU map directly onto unfinished SoNash problems.

**The async task API is a direct answer to Gap Agent A Q5.** The T28 CAS
research flagged "progressive / resumable extraction" as an open gap — the idea
that analyzing a large source (repo, website, document) should produce partial
results incrementally, with the option to resume after interruption or
compaction, rather than the current all-or-nothing "wait for the whole thing to
finish" model. MinerU's `POST /tasks` endpoint is exactly this pattern at a
smaller scale. It's an in-memory dict of task state, an `asyncio.Queue` as the
work channel, a semaphore capping concurrency, four states
(`pending/processing/completed/failed`), filesystem-backed output artifacts, and
a background loop that sweeps expired tasks every
`MINERU_API_TASK_RETENTION_SECONDS` (default 24h). It doesn't survive restarts —
state is lost when the process dies — but that's an honest trade-off: the
simplest thing that could possibly work, with a clearly advertised limitation.
The SoNash pattern that matches this is not the API endpoint itself (SoNash
doesn't have HTTP services), it's the state machine: a persisted `status` field
with four well-defined states, a background sweep for cleanup, and filesystem
artifacts keyed by task ID. The existing
`.claude/state/repo-analysis.<slug>.state.json` files are basically this pattern
already — what's missing is the `status` state machine and the background sweep.
**Read `mineru/cli/fast_api.py` around line 248 (semaphore), line 700-ish (the
task dict and queue), and the TTL cleanup loop.** That's the whole pattern in
about 200 lines.

**The structured output schema discipline answers a live tension in SoNash's
CONVENTIONS.md.** SoNash's CAS output is specified in two places:
`scripts/lib/analysis-schema.js` (the Zod runtime validator) and
`CONVENTIONS.md` Section 13 (handler output contract) and Section 17 (synthesis
output contract). The Zod schema is authoritative but unreadable as prose. The
CONVENTIONS sections are readable but drift from the Zod schema. MinerU's
`output_files.md` is the third option neither file is playing: a human-readable
contract page that specifies every field, every enum value, every breaking
change across versions. SoNash could absolutely have the same thing — a
`docs/agent_docs/ANALYSIS_OUTPUT_CONTRACT.md` that mirrors the structure of
MinerU's output_files.md. The value isn't the schema itself; it's the discipline
of treating output as a product surface that changes deliberately. Right now,
when SoNash migrated to v3.0 schema in Session #270, the Zod was updated, the
validator was updated, and the migration script was written — but there's no
single artifact that explains what the v3.0 output contract looks like to a
reader who isn't going to read Zod. The closest thing is the schemas/ directory
and even that's TypeScript. **The extraction isn't the code, it's the writing
discipline.**

**The environment variable catalog is a pattern SoNash needs in-house.**
`docs/en/usage/cli_tools.md` has a prose catalog of 15+ `MINERU_*` env vars,
each with default, effect, scoping rules, and cross-references. SoNash has
scattered env vars across hooks (`SKIP_*`, `DEBUG_*`), scripts (`GSD_*`,
`CAS_*`), and skills (`ANALYZE_*`, `SYNTHESIZE_*`) with no single reference
document. Users and agents alike have to grep to find what's configurable. This
is a documentation gap masquerading as a design problem. The fix is cheap: one
file, `docs/agent_docs/ENV_VARS.md`, grouping env vars by subsystem with
defaults, effects, and scoping. MinerU's file is the template.

Two patterns are worth **filing for later** but don't connect to current
initiatives: mineru-router's scored load balancing (no current SoNash need for
multi-worker orchestration beyond what agent dispatch already handles), and the
sliding-window memory bounding (SoNash doesn't process arbitrarily large
inputs). Both are excellent reference points if those problems materialize.

The two arXiv technical reports (2409.18839 for v1.x, 2509.22186 for v2.5) are
interesting background for anyone building extraction models, but SoNash is not
training extraction models. File them as context if you ever need to evaluate
MinerU's extraction quality against other options, not as required reading.

## 3. Where Your Approach Differs

**SoNash is ahead on test discipline.** The comparison isn't close. SoNash has
3,564 passing tests with real coverage, pre-commit hooks that gate on patterns,
PR review bots, a functional test pipeline, silent failure hunters, convergence
loops. MinerU has one fuzzy string match. This is not a criticism of MinerU
specifically — it's common in the ML/research-adjacent open-source ecosystem —
but it's a real gap and it means you cannot blindly adopt MinerU's code without
understanding that it is not tested the way SoNash expects code to be tested.

**SoNash is ahead on security defaults.** mineru-api has none of the defaults
SoNash would expect: no auth, no rate limit, no upload cap, no middleware stack,
docs enabled by default. SoNash's pre-commit hooks and security-auditor agent
would flag every one of these on a SoNash PR. The divergence is a reminder that
when you adopt a pattern from MinerU, you inherit the framing but not the
defaults.

**SoNash is different on state management.** MinerU uses an in-memory dict with
TTL cleanup for task state and is honest that restart loses state. SoNash uses
JSONL files on disk for almost everything — reviews, invocations, extraction
journal, checkpoints — because the state has to survive compaction, session
restarts, and cross-locale sync. The architectural answer is different, but the
**state-machine shape is the same one MinerU built**: named states, explicit
transitions, cleanup on timeout. The lift is conceptual, not code.

**MinerU is ahead on structured output as product surface.** This is the one
section where you should take the loss and copy the pattern. SoNash's analysis
output is a Zod schema + scattered CONVENTIONS sections. MinerU's is one
canonical reference page plus a clear breaking-change policy. When a future
SoNash session migrates to a v4 schema, having an `ANALYSIS_OUTPUT_CONTRACT.md`
as the migration target would prevent the drift problem. MinerU is, on this one
thing, ahead.

**MinerU is ahead on operational docs for multi-mode tools.** The hardware
decision matrix (quick_start/index.md) and the layered install recipes
(extension_modules.md) are patterns SoNash could learn from for the `/analyze`
family of skills — where the user has to pick between four source types and
three depth levels and the routing is not always obvious. SoNash has routing
logic in the skill files themselves but no single page that says "here's how to
pick your depth + source type + lens."

## 4. The Challenge

**The one thing to seriously consider:** stop treating SoNash's output contracts
as implementation details of the Zod validators. MinerU's `output_files.md` is
proof that a structured-output specification can live as a human-readable
artifact that is versioned, has explicit breaking-change callouts, and doubles
as the onboarding document for consumers. SoNash is one v3→v4 migration away
from needing this, and doing it retroactively is much harder than doing it now.
The existing CONVENTIONS.md §13 and §17 are partial — they document the contract
but don't treat it as a product surface.

Concrete suggestion: extract the current v3.0 analysis.json schema from
`scripts/lib/analysis-schema.js` into a new document,
`docs/agent_docs/ANALYSIS_OUTPUT_CONTRACT.md`, that mirrors the structure of
MinerU's `output_files.md`. Every field typed. Every enum enumerated.
Per-source-type sections (repo, website, document, media, synthesis). Breaking
changes from v2 to v3 called out. This is a half-day of writing that would pay
forward through every future schema migration.

The second thing to consider, lower priority: if SoNash pursues progressive
extraction, **crawl4ai is the better reference than MinerU**. MinerU's POST
/tasks state machine is conceptually clean — four states, semaphore-gated queue,
TTL sweep — but its in-memory dict doesn't survive restart, and its AGPL license
blocks direct lift. crawl4ai's `resume_state` + `on_state_change` pattern is
Apache-2.0 and persists across crashes, which is what long-running extraction
actually needs. MinerU's pattern is still worth reading for the state-machine
shape (four states, semaphore, sweep) but the port target is crawl4ai. See
Appendix §A15 for the full cross-repo comparison.

## 5. Knowledge Candidates

**T1 — Directly applicable to current work:**

1. **Structured output contract as a first-class document** — Apply to SoNash's
   CAS output. Create `docs/agent_docs/ANALYSIS_OUTPUT_CONTRACT.md` mirroring
   MinerU's `output_files.md` discipline. Effort: E1 (half-day writing). Source:
   MinerU `docs/en/reference/output_files.md`.

2. **Environment variable catalog as a single document** — Apply to SoNash's
   scattered `SKIP_*`/`GSD_*`/`CAS_*` env vars. Create
   `docs/agent_docs/ENV_VARS.md` grouped by subsystem. Effort: E0 (inventory +
   prose writing, no code). Source: MinerU `docs/en/usage/cli_tools.md`
   environment variables section.

**T2 — Relevant to near-term systems:**

3. **Async task state machine with TTL cleanup** — Read for shape, port from
   crawl4ai. The four-state machine (pending/processing/completed/ failed),
   semaphore-gated queue, and background TTL sweep in MinerU's `fast_api.py` are
   worth reading as a pattern reference, but the actually-adoptable
   implementation is crawl4ai's `resume_state` + `on_state_change` (Apache-2.0,
   persists across crashes). Effort: E2 (design + integration, blocks on feature
   decision). See Appendix §A15.

4. **Backend decision matrix for multi-mode tools** — Apply to
   `/analyze`/`/media-analysis` docs where users pick among multiple backends. A
   single page with a matrix of constraints (VRAM, OS, CPU support, etc.)
   replaces the current scattered skill-file routing descriptions. Effort: E1
   (one-page doc per skill family). Source: MinerU
   `docs/en/quick_start/index.md` hardware table.

**T3 — Lower priority, file for later:**

5. **Mineru-router scored load balancing** — File as reference pattern if SoNash
   ever needs multi-worker orchestration.
   `score = (queued + processing + pending_assignments) / max_concurrent` with
   shuffle + stable sort for jitter. E3 (tightly coupled to multi-GPU
   deployment, no current need).

6. **Layered optional-dependencies install pattern** — File as reference
   pattern. Python-specific via `pyproject.toml` optional-dependencies, not
   applicable to SoNash's TypeScript/Firebase stack. E3.

7. **Keyed singleton with atexit cleanup** — File as reference for any future
   SoNash use of heavy per-process caches. `(backend, model_path, server_url)`
   tuple cache key with `threading.RLock` and `atexit` shutdown. E3.

## 6. What's Worth Avoiding

**The test infrastructure pattern** — One end-to-end fuzzy string test gated by
a 0.2% coverage floor, with silent retries of flaky runs and tests that don't
execute on pull requests, is the path to a codebase that looks green but isn't
actually verified. SoNash's current test discipline (3,564 tests, pre-commit
gating, convergence loops) is the correct model. Do not look at MinerU's test
setup and conclude that this level of coverage is acceptable at scale. It isn't
— it's visible in MinerU's issue tracker, which has 160 open issues with a lot
of parsing-regression reports.

**The "expose with `--host 0.0.0.0` and hope for the best" deployment posture**
— MinerU ships a multi-GPU HTTP service with zero auth, no rate limiting, no
upload caps, and the docs actively encourage binding to reachable interfaces for
multi-GPU setups. This is exactly the anti-pattern SoNash's security-auditor
agent exists to prevent. Do not adopt this deployment pattern even if you adopt
the orchestration ideas. Any SoNash HTTP service — if one ever exists — needs
auth, rate limiting, and upload caps **by default**, not as operator-added
middleware.

**The silent-retry-on-flake pattern** — MinerU's `.github/workflows/rerun.yml`
retries failed workflows up to 3 times, converting flake into green checkmarks
with no surfacing. This is the opposite of SoNash's silent-failure-hunter
discipline. If a test is flaky, the fix is to investigate and eliminate the
flake, not to retry until it passes. File as an anti-pattern for SoNash CI
discipline.

**Documentation parity gap (13 Chinese-only chip guides, no English
equivalents)** — When internationalization is incomplete in a substantial way,
the right move is either to close the gap or to document which docs are
authoritative in which language. MinerU does neither. Users on non-Chinese chips
get a README claim and no deployment guide in English. The pattern to avoid:
shipping docs in two languages but letting them drift. If SoNash ever adds i18n
to its own docs, this is the failure mode to design around.

**FAQ that outsources to an AI assistant** — MinerU's FAQ has two entries and
defers every other question to an external AI tool. This is a thin substitute
for documented common failure modes. A 58k-star project should have captured its
most common support questions as permanent documentation. SoNash's FAQ
discipline is already better; do not regress toward this.

---

## Cross-repo connections

Connections to other analyzed repos (for `/synthesize` cross-repo intelligence):

- **firecrawl** (mendableai/firecrawl, analyzed 2026-04-10): Both are extraction
  tools. MinerU does documents, firecrawl does websites. Both ship HTTP APIs
  with async task patterns. Firecrawl has meaningfully better HTTP hardening
  (auth via API keys) — file for comparison when writing any SoNash HTTP
  service.
- **marker**, **surya** (VikParuchuri, queued for Wave 4 Step 10 analysis): Same
  author, same document-parsing space. Worth comparing their architectural
  choices to MinerU's three-backend pattern. Both share the VLM/OCR/layout
  domain.
- **crawl4ai** (unclecode/crawl4ai, analyzed quick depth 2026-04-09):
  Apache-2.0, 63k stars, and — unlike MinerU's in-memory task dict — has a real
  `resume_state` + `on_state_change` pattern that persists across crashes. For
  the T28 progressive-extraction gap, crawl4ai is the actually adoptable
  reference; MinerU's pattern is conceptually correct but its implementation
  loses state on restart and its license blocks direct lift.

---

## Appendix: Coverage Audit Expansion (Session #274)

The original run of this analysis marked 15 items as deferred in
`coverage-audit.jsonl`. Session #274 went back and read all of them without
deferral. The new findings below either enrich the sections above or correct
errors I made in the first pass.

### A3-A5: Docker/compose pattern (14 files)

MinerU ships **11 Dockerfiles** (1 global + 10 China-region variants) plus a
`docker/compose.yaml` with 4 service profiles. The global Dockerfile bases off
`vllm/vllm-openai:v0.11.2` directly; each China variant bases off a
vendor-specific pre-built image that already contains the vendor's vLLM or
LMDeploy fork (Ascend → `quay.m.daocloud.io/ascend/vllm-ascend`, Hygon DCU →
`harbor.sourcefind.cn`, Kunlunxin → `docker.1ms.run/wjie520/vllm_kunlun`, Moore
Threads → `registry.mthreads.com`, Cambricon → `lmdeploy_dlinfer/camb`, etc.).
Every variant follows the same recipe: vendor base image → install Noto CJK
fonts → `pip install "mineru[core]>=3.0.0"` with `numpy==1.26.4` and
`opencv-python==4.11.0.86` pinned →
`mineru-models-download -s modelscope -m all`. China variants use the aliyun
PyPI mirror; the global variant uses huggingface. A few variants carry
ugly-but-honest workarounds inline: `kxpu.Dockerfile` has a `sed` patch that
rewrites `self.act = act_layer()` to `self.act = nn.GELU()` inside the Kunlun
vLLM fork's `qwen2_vl.py`; `maca.Dockerfile` has a torchvision version rename
hack; `mlu.Dockerfile` toggles between vllm and lmdeploy via an `ARG BACKEND`
variable.

The `compose.yaml` exposes four services — `mineru-openai-server` (port 30000),
`mineru-api` (port 8000), `mineru-router` (port 8002), `mineru-gradio`
(port 7860) — all of them binding to `0.0.0.0`, all with nvidia device
reservations, all with healthchecks that `curl -f http://localhost:PORT/health`.
Every service uses `ipc: host`, `memlock: -1`, `stack: 67108864`. This is
operator-friendly but reinforces the security concern: the compose file actively
ships with `--host 0.0.0.0` for every service. A user doing
`docker compose --profile router up` is exposing an unauthenticated multi-GPU
parse endpoint on their network by default.

**New pattern** (knowledge-tier): the multi-vendor base-image pattern is
textbook ML distribution engineering. Every vendor gets a bespoke Dockerfile
keyed off their own pre-built image so the user doesn't have to figure out
vendor-specific CUDA/ROCm/driver/runtime compatibility. The cost is maintenance
overhead — 11 Dockerfiles to keep current — and the trade-off is explicit. Not
directly applicable to SoNash (we don't distribute hardware-specific Docker
images) but a reference for any project that ships to heterogeneous GPU
environments.

### A1: Chinese chip deployment guides (13 files)

I sampled one guide in the original run. Reading all 13 reveals they are
ruthlessly structured around a common template: **§1 Test platform** (specific
OS/CPU/driver/docker versions), **§2 Environment prep** (Dockerfile build recipe
via `wget` from `gcore.jsdelivr.net` mirror, sometimes with a vllm↔lmdeploy
toggle via `sed`), **§3 Start Docker container** (full `docker run` with
vendor-specific device mounts and env vars), **§4 Notes** (a 🟢🟡🔴 support
matrix for every combination of
`pipeline/vlm-auto/ vlm-http-client/hybrid-auto/hybrid-http-client` ×
`vllm/lmdeploy`), and **Tips** (the vendor's version of `CUDA_VISIBLE_DEVICES` —
`ASCEND_RT_VISIBLE_DEVICES`, `SUPA_VISIBLE_DEVICES`, `MLU_VISIBLE_DEVICES`,
`TOPS_VISIBLE_DEVICES`, `XPU_VISIBLE_DEVICES`, `SDAA_VISIBLE_DEVICES`,
`MTHREADS_VISIBLE_DEVICES`).

**Two outliers:**

- **`AMD.md`** is not a vendor deployment guide. It's a community contribution
  (~360 lines) explaining how to work around the fact that MIOpen on AMD RDNA
  GPUs is missing an optimized Conv3d(bfloat16) kernel for
  Qwen2VisionPatchEmbed. The author provides **two full Triton kernel
  implementations** inline: a 3D patchify kernel and a matrix-multiplication
  variant tuned specifically for the 7900xtx
  (`BLOCK_M=128, BLOCK_N=128, BLOCK_K=32, num_stages=4, num_warps=8`). They also
  patch `mineru_vl_utils/vlm_client/vllm_async_engine_client.py` to handle a
  missing `get_lora_tokenizer()` method. This is the only guide in the
  repository that ships actual code. It's also evidence the MinerU team is
  willing to merge community work that lives inside upstream vllm's source tree,
  not in their own codebase.
- **`VastAI.md`** is structurally different (numbered sections 1–5,
  company/platform/env/features/notes instead of platform/env/container/ notes)
  and it's **pinned to MinerU 2.7.0 specifically**, not 3.0. VastAI only
  supports `vlm-auto-engine` and `vlm-http-client` — every pipeline and hybrid
  scenario is 🔴. This is a 🔴-heavy guide, not a 🟢-heavy one, and MinerU's
  README's "10+ chip support" claim breaks down here: VastAI is in the count but
  can't run the default backend.

The support matrix data — which chip supports which backend — is real and
detailed, and the English README provides **none** of it. The i18n gap isn't
cosmetic; it's a structural asymmetry where critical deployment information is
only available in Chinese.

### A6: Model subsystem subtree (mineru/model/)

The original pass read only the top-level `mineru/model/*.py` files. The subtree
(docx, layout, mfr, ocr, ori_cls, pptx, table, vlm) reveals a consistent
cross-model discipline worth noting:

- **ONNX runtime for lightweight classifiers** — `paddle_ori_cls` (orientation
  0/90/180/270), `paddle_table_cls` (wired vs wireless tables). Both use
  identical preprocessing (256-shortest-edge resize → 224×224 center crop →
  ImageNet normalization → CHW transpose). Both load via
  `auto_download_and_get_model_root_path(ModelPath.X)`. This is the "ONNX is the
  right tool for small classifiers that don't need GPU" discipline most projects
  don't bother with.
- **PyTorch + HuggingFace transformers for heavy models** — `pp_doclayoutv2` is
  built on `RTDetrForObjectDetection` + custom `LayoutLMv3TextEmbeddings`. It
  defines 25 labeled block types with per-class confidence thresholds (mostly
  0.5, but `display_formula`, `doc_title`, `inline_formula`, `paragraph_title`,
  `text`, `vertical_text` are 0.4) and a reading-order head class remap array.
  **This is the replacement for the AGPLv3- encumbered doclayoutyolo and
  mfd_yolov8 models that 3.0.0 explicitly removed** — the cleanup mentioned in
  the changelog.
- **Wrapping vLLM's CLI with default injection** —
  `mineru/model/vlm/vllm_server.py` is a ~70-line wrapper around
  `vllm.entrypoints.cli.main`. It intercepts `--model`, `--port`,
  `--gpu-memory-utilization`, `--logits-processors`, applies per-device arg
  mutation via `mod_kwargs_by_device_type(args, vllm_mode="server")`,
  auto-injects the custom `MinerULogitsProcessor`, sets `OMP_NUM_THREADS=1` if
  unset, and then hands off to vLLM's CLI. The MinerU team doesn't re-implement
  serving — they intercept vLLM's entrypoint and inject sensible defaults. This
  is a cheap, maintainable way to ship a "MinerU-flavored vLLM server" without
  forking vLLM.
- **109-language OCR is real engineering** —
  `mineru/model/ocr/pytorch_paddle.py` defines `latin_lang` (48 languages),
  `arabic_lang` (8), `cyrillic_lang` (16+) as explicit lists, plus
  Chinese/Japanese/Korean/Thai/Tamil/Telugu/ Kannada/Georgian families. The "109
  languages" claim in the README decomposes to these enumerated sets. It's a
  marketing number backed by enumerated reality — unlike the MCP claim below.

### A7: demo.py (the client-side contract)

`demo/demo.py` (256 lines) is a complete async client example that exercises the
full `POST /tasks` flow: `LocalAPIServer` auto-start when `api_url` is None,
`submit_parse_task` with form data, `wait_for_task_result` with a status
callback, `queued_ahead` counter in the response for user feedback, four status
states surfaced via `TaskStatusSnapshot`, `download_result_zip`, and a
`safe_extract_zip` helper that defends against zip-slip. The WSL workaround at
`prepare_local_api_temp_dir()` is worth noting: when the current tempdir is
under `/mnt/` (drvfs), the client redirects `TMPDIR` to `/tmp` to avoid
vLLM/ZeroMQ IPC socket failures on WSL drvfs. Small engineering detail that
would take a user a day to debug on their own.

This is the concrete consumer-side code that pairs with the server-side async
task state machine. For the `pat-mineru-001` extraction candidate, the client
pattern is as important as the server pattern — it shows what the
state-transition UX looks like from the caller's perspective.

### A10-A11: CI workflows (cla.yml, mkdocs.yml)

`cla.yml` uses `contributor-assistant/github-action@v2.6.1` under a
`pull_request_target` trigger with an allowlist of 14 pre-signed contributors
and `signatures/version1/cla.json` as the contract store. Uses
`secrets.RELEASE_TOKEN` with `contents: write` and `pull-requests: write`
permissions. The `pull_request_target` trigger is security-sensitive (can access
secrets on fork PRs) but with the allowlist and the CLA-bot scope the exposure
is bounded. Normal CLA-automation pattern.

`mkdocs.yml` publishes the docs site to GitHub Pages via
`mhausenblas/mkdocs-deploy-gh-pages@master` — **unpinned `@master`** — on push
to master or dev. Uses `secrets.RELEASE_TOKEN`. The unpinned action is a
supply-chain gap: a compromise of the upstream action would let attackers
publish arbitrary content to the MinerU docs site. Not catastrophic (the docs
site isn't a trust anchor) but inconsistent with the rest of the repo's pinning
discipline.

### A9: pyproject.toml dependency health

MinerU's runtime dependency list (34 direct deps across all groups) is a mix of
floor-only constraints (`>=`) and ranged constraints (`>=,<`). The changelog
explicitly mentions CVE-2025-64512 (pdfminer.six pickle RCE) being addressed by
updating to `pdfminer.six>=20251230`, which is in the pinned range. That's good
discipline — they noted the CVE and applied the fix.

Three CVE notes from cross-checking the dep list against public advisories
(without fetching every dep's full CVE history):

- **`pdfminer.six>=20251230`** — floor is the CVE-2025-64512 fix version. Clean.
  But there's a separate pickle-related CLA advisory (GHSA-f83h-ghpp-7wcc) that
  the release notes don't mention; whether it's patched in 20251230 or still
  exploitable is unclear from the pyproject alone.
- **`pillow>=11.0.0`** — floor only, no upper bound. CVE-2026-25990 (PSD
  out-of-bounds write, PSD handler) affects Pillow 10.3.0 to before 12.1.1 and
  is fixed in 12.1.1. If the installed Pillow is in the 10.3.0–12.1.0 range,
  MinerU is exposed. The fix depends on whichever Pillow version happens to
  resolve at install time. **This is a real risk if MinerU is ever fed untrusted
  PSD files** — not a common vector for a PDF/DOCX parser, but the PSD handler
  is still compiled in and reachable.
- **`lxml>=4.0.0,<7.0.0`** — ranged constraint is good, but there's a generic
  XXE risk because `lxml.etree.XMLParser` defaults to `resolve_entities=True`
  and `no_network=False`. MinerU's docx parser imports `lxml.etree` and uses it
  to parse DOCX XML internally. Whether the actual usage enables entity
  resolution or network loading is a source-audit question I did not pursue — a
  Standard-depth analysis isn't the right place for a line-by-line XXE audit.

The rest of the dep list is unremarkable: `fastapi`, `uvicorn`,
`python-multipart` (no version floors — a minor hygiene gap but not exploitable
on its own), `boto3>=1.28.43` (wide range), `numpy>=1.21.6` (very wide range),
`click>=8.1.7`, `loguru>=0.7.2`. No deps with obviously bad histories in the
last 12 months.

### A12: mineru-mcp correction

**I was wrong in the original Creator View.** The first pass said "mineru-mcp —
separate package referenced in MinerU 3.0.0 release notes" and treated it as a
first-party reference implementation. This is incorrect.

The truth: **`opendatalab/mineru-mcp` does not exist** (GitHub returns a 404 for
that repo). The MinerU 3.0.0 README lists "MCP Server — Cursor · Claude Desktop
· Windsurf" under its integration matrix, but the changelog never mentions MCP
and there is no first-party MinerU MCP server. What exists are 5+ community
implementations on GitHub, the most prominent being
`neosun100/mineru-mcp-server` (9 stars, no license declared, single maintainer,
Python, FastMCP-based). None of them are owned by opendatalab.

This is a **documentation-claim-exceeds-reality** issue. The README makes an
integration claim that a reader would naturally interpret as a first-party
capability. When they go looking for the MCP server, they find a community repo
with no license and no support guarantee. It's not dishonest — the wording is
technically neutral — but it's misleading about what's upstream-maintained
versus community-maintained.

**New anti-pattern:** README claims that reference external integrations should
clarify whether the integration is first-party or community. The fix is cheap —
one line — but the pattern failure is worth filing.

### A13-A14: arXiv technical reports

**MinerU 1.x — arXiv 2409.18839** — 18 authors led by Bin Wang, Chao Xu,
Xiaomeng Zhao. Core architecture: integrates PDF-Extract-Kit models as the
foundation plus domain-specific pre/post-processing rules. The paper frames
MinerU as solving "the diversity in document types and content" via a hybrid
learned-representations + rule-based-refinement approach. Methodology is modular
(OCR, layout detection, formula recognition as independent components) rather
than end-to-end. This is the pipeline backend's theoretical grounding.

**MinerU 2.5 — arXiv 2509.22186** — 61 authors led by Junbo Niu. Title:
"MinerU2.5: A Decoupled Vision-Language Model for Efficient High-Resolution
Document Parsing". A 1.2B-parameter VLM with a **coarse-to-fine two-stage
parsing strategy**: Stage 1 performs layout analysis on downsampled images to
identify structural elements without high-resolution overhead; Stage 2 does
targeted content recognition on native-resolution crops. The decoupling is what
lets the model hit "state-of-the-art recognition accuracy while maintaining
exceptional computational efficiency" — most competing VLMs process the full
page at full resolution, which scales badly on dense layouts. The 2.5 paper also
introduces a data engine that generates large-scale pretraining/fine-tuning
corpora.

Neither paper is directly applicable to SoNash work (we don't train extraction
models), but the **two-stage coarse-to-fine pattern** is an interesting analogue
for SoNash's own depth tiers (Quick Scan → Standard → Deep). The idea — do a
fast structural pass first, then spend resources on the parts that matter — is a
generalizable discipline.

### A15: Cross-repo positioning (firecrawl, marker, surya, crawl4ai)

Reading the existing `.research/analysis/` entries for the four peer repos
produces a much richer comparison than the original one-line cross-repo
connections:

**License matrix (the adoption gate):**

| Repo         | License        | Can SoNash adopt directly? |
| ------------ | -------------- | -------------------------- |
| MinerU       | AGPL-3.0       | No — network copyleft      |
| firecrawl    | AGPL-3.0       | No — network copyleft      |
| marker       | GPL-3.0        | No — source copyleft       |
| surya        | GPL-3.0        | No — source copyleft       |
| **crawl4ai** | **Apache-2.0** | **Yes**                    |

Four out of five are pattern-extraction targets only. crawl4ai is the one that
can be imported as a dependency, not reverse-engineered.

**Progressive extraction (T28 Gap Agent A Q5) — four answers:**

- MinerU: in-memory task dict + asyncio.Queue + TTL sweep. **Does not survive
  restart.** Pattern is clean but the implementation is explicitly ephemeral.
- firecrawl: dual queue systems (BullMQ + nuq-postgres) with no documented
  migration plan. Persists, but the architecture is in flux.
- marker: no resumable state. Per-document extraction is monolithic.
- surya: no resumable state. Lower in the stack than marker.
- **crawl4ai: `resume_state` + `on_state_change` callbacks. Explicit
  crash-recovery discipline for long-running crawls. Apache-2.0.** This is the
  actually-adoptable reference for the progressive-extraction gap.

The Creator View's original recommendation was to extract MinerU's async task
pattern. After cross-repo comparison: **the better recommendation is to look at
crawl4ai first**. MinerU's pattern is conceptually correct but crawl4ai has both
the license and the persistence. If SoNash ever pursues progressive extraction
as a T28 feature, crawl4ai's `resume_state` is the shape to port, not MinerU's.

**Multi-engine dispatch — two distinct patterns:**

- MinerU: static factory with `importlib` deferred imports (pipeline/vlm/
  hybrid). User picks at invocation.
- firecrawl: **dynamic fallback chain** (`buildFallbackList` →
  `scrapeURLWithEngine` → `NoEnginesLeftError`). Engines are tried in order
  until one succeeds. Each engine has telemetry.

MinerU's is simpler; firecrawl's is more resilient. For SoNash's own
multi-backend skills (e.g., media-analysis whisper vs oEmbed vs transcript API),
the fallback-chain pattern is probably the better fit — when one backend fails,
try the next rather than failing the whole run.

**Test discipline (MinerU is uniquely bad):**

- MinerU: F/18 — 1 test file, 1 test function, 0.2% coverage floor, no PR
  gating, silent retry workflow.
- firecrawl: A/85 — capability-gated tests, harness-driven boot orchestration.
- marker: B/75 (inferred from overall scoring).
- surya: C/60 (inferred).
- crawl4ai: A/85 (inferred from maintainability/process scores).

MinerU stands out at the bottom of this cluster. The test story isn't just
"open-source ML is less tested" — the other projects in the exact same space
have real test infrastructure and MinerU does not.

**HTTP security:**

- MinerU: C/68 (no auth, no rate limit, no upload cap, docs on by default, SSRF
  in `server_url` field).
- firecrawl: B/72 (API key auth, rate limiting present).
- marker: C/55 (no HTTP surface hardening).
- surya: C/55 (no HTTP surface hardening).
- **crawl4ai: B/75 (best of the five).**

MinerU is mid-pack — better than the library-mode tools but worse than both
web-crawling tools. The web-crawling tools have thought harder about hostile
input because they _always_ get hostile input.

### Summary of what changed in this appendix

1. **mineru-mcp correction** — removed from T2 extraction candidates, added to
   anti-pattern list as "unverified README integration claim"
2. **Docker multi-vendor pattern** — added as knowledge candidate (T3, reference
   only)
3. **Chinese chip guide template** — added as knowledge candidate (T3)
4. **Model subsystem ONNX/Torch/vLLM-wrapper discipline** — added as pattern
   candidate (T3, reference)
5. **vLLM CLI wrapping pattern** — added as pattern candidate (T3)
6. **Unpinned `mhausenblas/mkdocs-deploy-gh-pages@master`** — added as
   supply-chain finding (info severity)
7. **Pillow `>=11.0.0` floor-only constraint** — added as dep-hygiene finding
   (medium severity)
8. **crawl4ai is the progressive-extraction reference, not MinerU** — rewrote
   the T2 candidate recommendation
9. **MinerU 2.5 coarse-to-fine two-stage pattern** — noted as analogue to SoNash
   depth tiers (not an extraction candidate, just a framing parallel)
10. **README integration claims vs reality** — new anti-pattern category
