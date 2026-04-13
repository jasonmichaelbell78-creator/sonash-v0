# Extraction Candidates — Cross-Entity Summary

Auto-generated from `extraction-journal.jsonl` by
`scripts/cas/generate-extractions-md.js`. Do not edit directly — run
`node scripts/cas/generate-extractions-md.js` to rebuild.

**Total:** 309 candidates across 32 sources | **By decision:** defer: 285,
investigate: 2, extract: 20, skip: 2

---

## Table of Contents

| Source                                                                                                                                                                                                                   | Type     | Total | Pattern | Knowledge | Anti-Pattern | Content |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----- | ------- | --------- | ------------ | ------- |
| [ArchiveBox/ArchiveBox](#archivebox-archivebox-repo)                                                                                                                                                                     | repo     | 7     | 3       | 2         | 2            | 0       |
| [aws-solutions-library-samples/guidance-for-media-extraction-and-dynamic-content-policy-framework-on-aws](#aws-solutions-library-samples-guidance-for-media-extraction-and-dynamic-content-policy-framework-on-aws-repo) | repo     | 8     | 6       | 0         | 2            | 0       |
| [codecrafters-io/build-your-own-x](#codecrafters-io-build-your-own-x-repo)                                                                                                                                               | repo     | 12    | 2       | 4         | 2            | 4       |
| [Dicklesworthstone/bulk_transcribe_youtube_videos_from_playlist](#dicklesworthstone-bulk-transcribe-youtube-videos-from-playlist-repo)                                                                                   | repo     | 12    | 4       | 3         | 3            | 2       |
| [DS4SD/docling](#ds4sd-docling-repo)                                                                                                                                                                                     | repo     | 13    | 4       | 5         | 3            | 1       |
| [Errors and Vulnerabilities in AI-Generated Code.pdf](#errors-and-vulnerabilities-in-ai-generated-code-pdf-document)                                                                                                     | document | 6     | 0       | 4         | 2            | 0       |
| [HKUDS/CLI-Anything](#hkuds-cli-anything-repo)                                                                                                                                                                           | repo     | 17    | 7       | 3         | 3            | 4       |
| [iawia002/lux](#iawia002-lux-repo)                                                                                                                                                                                       | repo     | 5     | 1       | 1         | 3            | 0       |
| [jdepoix/youtube-transcript-api](#jdepoix-youtube-transcript-api-repo)                                                                                                                                                   | repo     | 10    | 4       | 3         | 2            | 1       |
| [jina-ai/reader](#jina-ai-reader-repo)                                                                                                                                                                                   | repo     | 14    | 6       | 3         | 3            | 2       |
| [karpathy/autoresearch](#karpathy-autoresearch-repo)                                                                                                                                                                     | repo     | 12    | 5       | 3         | 2            | 2       |
| [ksharlandjiev/bedrock-summarize-audio-video-text](#ksharlandjiev-bedrock-summarize-audio-video-text-repo)                                                                                                               | repo     | 10    | 5       | 1         | 2            | 2       |
| [mendableai/firecrawl](#mendableai-firecrawl-repo)                                                                                                                                                                       | repo     | 21    | 5       | 5         | 4            | 7       |
| [opendatalab/MinerU](#opendatalab-mineru-repo)                                                                                                                                                                           | repo     | 19    | 3       | 7         | 7            | 2       |
| [outline/outline](#outline-outline-repo)                                                                                                                                                                                 | repo     | 15    | 9       | 2         | 4            | 0       |
| [public-apis/public-apis](#public-apis-public-apis-repo)                                                                                                                                                                 | repo     | 10    | 3       | 1         | 2            | 4       |
| [safishamsi/graphify](#safishamsi-graphify-repo)                                                                                                                                                                         | repo     | 9     | 3       | 3         | 3            | 0       |
| [teng-lin/notebooklm-py](#teng-lin-notebooklm-py-repo)                                                                                                                                                                   | repo     | 13    | 6       | 1         | 2            | 4       |
| [tobi/qmd](#tobi-qmd-repo)                                                                                                                                                                                               | repo     | 18    | 10      | 5         | 3            | 0       |
| [unclecode/crawl4ai](#unclecode-crawl4ai-repo)                                                                                                                                                                           | repo     | 7     | 3       | 2         | 2            | 0       |
| [unstructured-io/unstructured](#unstructured-io-unstructured-repo)                                                                                                                                                       | repo     | 13    | 5       | 4         | 3            | 1       |
| [VikParuchuri/marker](#vikparuchuri-marker-repo)                                                                                                                                                                         | repo     | 5     | 1       | 2         | 2            | 0       |
| [ViktorAxelsen/MemSkill](#viktoraxelsen-memskill-repo)                                                                                                                                                                   | repo     | 12    | 6       | 0         | 2            | 4       |
| [zedeus/nitter](#zedeus-nitter-repo)                                                                                                                                                                                     | repo     | 6     | 0       | 3         | 3            | 0       |
| [https://docs.composio.dev/docs](#https-docs-composio-dev-docs-website)                                                                                                                                                  | website  | 4     | 4       | 0         | 0            | 0       |
| [https://gist.github.com/farzaa/c35ac0cfbeb957788650e36aabea836d](#https-gist-github-com-farzaa-c35ac0cfbeb957788650e36aabea836d-website)                                                                                | website  | 6     | 6       | 0         | 0            | 0       |
| [https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f](#https-gist-github-com-karpathy-442a6bf555914893e9891c11519de94f-website)                                                                            | website  | 5     | 5       | 0         | 0            | 0       |
| [https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea](#https-gist-github-com-kieranklaassen-4f2aba89594a4aea4ad64d753984b2ea-website)                                                                | website  | 5     | 5       | 0         | 0            | 0       |
| [https://gist.github.com/Maharshi-Pandya/4aeccbe1dbaa7f89c182bd65d2764203](#https-gist-github-com-maharshi-pandya-4aeccbe1dbaa7f89c182bd65d2764203-website)                                                              | website  | 2     | 2       | 0         | 0            | 0       |
| [https://sidbharath.com/blog/claude-code-the-complete-guide/](#https-sidbharath-com-blog-claude-code-the-complete-guide-website)                                                                                         | website  | 6     | 1       | 3         | 2            | 0       |
| [https://www.youtube.com/watch?v=OSZdFnQmgRw](#https-www-youtube-com-watch-v-oszdfnqmgrw-media)                                                                                                                          | media    | 5     | 1       | 2         | 1            | 1       |
| [https://www.youtube.com/watch?v=qINuQwL4E-k](#https-www-youtube-com-watch-v-qinuqwl4e-k-media)                                                                                                                          | media    | 2     | 1       | 1         | 0            | 0       |

---

<a id="archivebox-archivebox-repo"></a>

## ArchiveBox/ArchiveBox (repo)

| Candidate                                         | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| MCP auto-discovery from CLI metadata              | pattern      | defer    | 2026-04-12 | high    | E1     | high      | -            | Zero-schema MCP server introspecting Click CLI. ~200 lines. Principle portable to JASON-OS Domain 02a (Node/TS adaptatio |
| Hook execution model (ordering + bg/fg lifecycle) | pattern      | defer    | 2026-04-12 | high    | E1     | high      | -            | Event-family naming, 2-digit ordering, foreground/background with SIGTERM. Complements SoNash hook governance.           |
| CLAUDE.md as structured developer philosophy      | pattern      | defer    | 2026-04-12 | medium  | E0     | high      | -            | 498-line CLAUDE.md with grep-friendly naming, minimize-unique-names, NO MOCKS testing. Compare against SoNash 135-line C |
| Coverage-as-dead-code-detector                    | knowledge    | defer    | 2026-04-12 | medium  | E0     | medium    | -            | JSON+jq pipeline for 0% coverage files. Passive coverage during dev server. Relevant to T21 orphan detection.            |
| Claude Code CI integration                        | knowledge    | defer    | 2026-04-12 | medium  | E1     | medium    | -            | claude.yml GitHub Actions workflow. AI-in-CI pattern for JASON-OS CI/CD domain.                                          |
| SOLO_MAINTAINER_GOVERNANCE                        | anti-pattern | defer    | 2026-04-12 | medium  | E0     | high      | -            | 27K stars, 0/29 changesets reviewed. Architectural docs in prose not contracts. Bus-factor warning.                      |
| CONFIGURED_NOT_ENFORCED_TYPING                    | anti-pattern | defer    | 2026-04-12 | low     | E0     | medium    | -            | Pyright configured, 48% coverage, heavy Any/cast. Type checker as decoration not gate.                                   |

<a id="aws-solutions-library-samples-guidance-for-media-extraction-and-dynamic-content-policy-framework-on-aws-repo"></a>

## aws-solutions-library-samples/guidance-for-media-extraction-and-dynamic-content-policy-framework-on-aws (repo)

| Candidate                                           | Type                 | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| --------------------------------------------------- | -------------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Frame sampling + smart dedup pipeline               | architecture-pattern | extract  | 2026-04-07 | high    | E1     | high      | -            | moviepy frame extraction + FAISS/OpenSearch similarity dedup. Configurable FPS, 10min chunks. Claims 50% frame reduction |
| Multi-granularity hierarchy (frame->shot->scene)    | architecture-pattern | extract  | 2026-04-07 | high    | E1     | high      | -            | Three-level temporal decomposition. Each level has summaries, timestamps, metadata. Structures video content analysis.   |
| Toggleable per-frame ML feature extraction          | pattern              | extract  | 2026-04-07 | medium  | E0     | high      | -            | Each ML feature independently enabled via config. Adding new capabilities = adding new function to pipeline. Extensibili |
| FAISS local dedup (no cloud dependency)             | pattern              | extract  | 2026-04-07 | medium  | E1     | high      | -            | Local vector similarity using FAISS. Same dedup quality as OpenSearch, no cloud dependency. Direct port candidate for T2 |
| Subtitle-to-frame timestamp alignment               | pattern              | defer    | 2026-04-07 | medium  | E1     | medium    | -            | Map subtitle segments to frame timestamps. Non-obvious multimodal alignment engineering.                                 |
| Evaluation Service prompt template system           | pattern              | defer    | 2026-04-07 | low     | E0     | medium    | -            | Templates for moderation, summarization, IAB classification against extracted metadata.                                  |
| OpenSearch dependency for similarity (anti-pattern) | anti-pattern         | extract  | 2026-04-07 | medium  | E0     | medium    | -            | FAISS alternative exists in same repo. Don't add search cluster for video dedup when local works.                        |
| No tests (anti-pattern)                             | anti-pattern         | extract  | 2026-04-07 | low     | E0     | medium    | -            | 52 Python files, 1 test. AWS reference architectures skip tests. Don't follow this pattern.                              |

<a id="codecrafters-io-build-your-own-x-repo"></a>

## codecrafters-io/build-your-own-x (repo)

| Candidate                                        | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ------------------------------------------------ | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Build Your Own React (Pomber)                    | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | https://pomb.us/build-your-own-react/. Canonical React-from-scratch tutorial. Fiber, reconciliation, hooks. Directly app |
| Didact: DIY React                                | content      | defer    | 2026-04-06 | medium  | E0     | high      | -            | https://github.com/hexacta/didact. Virtual DOM diffing focus. Complementary to Pomber. Understanding re-render behavior. |
| Write Yourself a Git                             | content      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | https://wyag.thb.lt. Python git-from-scratch. Understanding object model helps design better hook/worktree infrastructur |
| Regex Matching Can Be Simple and Fast (Russ Cox) | content      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | https://swtch.com/~rsc/regexp/regexp1.html. NFA/DFA theory. Directly applicable to check-pattern-compliance.js regex per |
| 31-Category Tutorial Taxonomy                    | pattern      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 390 links across 31 domains. 16 individually evaluated in content-eval.jsonl. Cross-reference against 72-skill index.    |
| Curated Link Format Pattern                      | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | Standard awesome-list format. Low extraction value.                                                                      |
| Skill Retirement Process Design                  | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | Case study: 486K stars, 462 open issues, 1 commit/90d. What happens when a curated collection grows without retirement/a |
| Build from Scratch Framing for Domain 01         | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | Feynman principle applied to system understanding. Structure JASON-OS Internal Archaeology (Domain 01) as 'how each syst |
| Celebrity Stagnation Lifecycle                   | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | Community enthusiasm → commercial acquisition → maintenance bottleneck → dormancy. Cross-ref: overlaps with public-apis  |
| Shell/CLI Tutorial Collection                    | knowledge    | defer    | 2026-04-06 | low     | E0     | medium    | -            | 7 shell tutorials (C, Go, Rust). Canonical references if JASON-OS needs custom command dispatch. Defer until architectur |
| Single-File-Everything Anti-Pattern              | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 390 links in one README.md. Watch for same impulse in EXTRACTIONS.md, MEMORY.md, SKILL_INDEX.md — when a single file bec |
| Inline License Without LICENSE File              | anti-pattern | defer    | 2026-04-06 | low     | E0     | medium    | -            | CC0 in README but no LICENSE file. GitHub API can't detect it. Always include machine-readable LICENSE if publishing.    |

<a id="dicklesworthstone-bulk-transcribe-youtube-videos-from-playlist-repo"></a>

## Dicklesworthstone/bulk_transcribe_youtube_videos_from_playlist (repo)

| Candidate                                       | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| faster-whisper local transcription pipeline     | pattern      | defer    | 2026-04-07 | high    | E1     | high      | -            | Complete local Whisper lifecycle: CUDA detection, large-v3, beam_size=10, vad_filter, segment iteration with tqdm, metad |
| Whisper tuned params (beam_size=10, vad_filter) | knowledge    | defer    | 2026-04-07 | high    | E0     | high      | -            | beam_size=10 (vs default 5) for accuracy. vad_filter=True prevents hallucination-on-silence. Production tuning.          |
| Caption-first + Whisper-fallback architecture   | knowledge    | defer    | 2026-04-07 | high    | E0     | high      | -            | Cross-repo insight: both bedrock and this repo skip captions. pytubefix has yt.captions. Caption-first for ~80% of video |
| Async download + sync GPU transcription         | pattern      | defer    | 2026-04-07 | medium  | E0     | high      | -            | asyncio.Semaphore(4) for concurrent downloads, sequential GPU transcription. Network parallelizes, GPU doesn't.          |
| faster-whisper library                          | content      | defer    | 2026-04-07 | high    | E0     | high      | -            | CTranslate2 Whisper. 4x faster than OpenAI whisper. GPU+CPU. THE local transcription engine for T27.                     |
| CUDA/GPU detection + CPU fallback               | pattern      | defer    | 2026-04-07 | medium  | E1     | medium    | -            | numba.cuda.is_available(), Anaconda toolkit paths, float16 vs auto compute. Real-world GPU setup.                        |
| SpaCy + compromise.js two-stage NLP             | pattern      | defer    | 2026-04-07 | medium  | E1     | medium    | -            | Server-side SpaCy for sentence splitting, client-side compromise.js for paragraph restructuring. Two NLP stages.         |
| API vs local cost tradeoff                      | knowledge    | defer    | 2026-04-07 | medium  | E0     | medium    | -            | $0.006/min API (less accurate) vs free local (more accurate, needs GPU). 1h = $0.36 vs $0.                               |
| compromise.js client-side NLP                   | content      | defer    | 2026-04-07 | medium  | E0     | medium    | -            | 75KB browser NLP. Sentence/paragraph detection. 11K+ stars.                                                              |
| Monolithic single-file tool anti-pattern        | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | 280 lines, no CLI, no config file. Works for personal use, impossible to integrate. T27 must be modular.                 |
| Skip-captions-always anti-pattern               | anti-pattern | defer    | 2026-04-07 | high    | E0     | high      | -            | Both bedrock and this repo transcribe every video from scratch. Check captions first (~80% have them).                   |
| Hard-coded source config anti-pattern           | anti-pattern | defer    | 2026-04-07 | low     | E0     | medium    | -            | Module-level variables including API keys. No CLI args, no env vars.                                                     |

<a id="ds4sd-docling-repo"></a>

## DS4SD/docling (repo)

| Candidate                                           | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| --------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| DoclingDocument tree structure                      | knowledge    | defer    | 2026-04-07 | high    | E1     | high      | -            | Pydantic tree-structured unified document repr. Body/furniture separation, reading order via tree, JSON pointers. T28 ou |
| Backend + Pipeline separation pattern               | pattern      | defer    | 2026-04-07 | high    | E1     | high      | -            | Backends parse formats, pipelines orchestrate stages. T28 should separate source extraction from analysis orchestration. |
| Plugin system via pluggy                            | pattern      | defer    | 2026-04-07 | high    | E2     | high      | -            | Third-party extensibility via setuptools entrypoints. Only needed when T28 has external consumers.                       |
| docling-mcp as extraction backend                   | content      | defer    | 2026-04-07 | high    | E1     | high      | -            | MCP server wrapping docling conversion. T28 could use as document extraction backend.                                    |
| ASR pipeline → unified output                       | knowledge    | defer    | 2026-04-07 | high    | E0     | high      | -            | Whisper Turbo → DoclingDocument. Same output as PDF/DOCX. Proves unified extraction output thesis.                       |
| Use docling instead of building document extractors | knowledge    | defer    | 2026-04-07 | high    | E0     | high      | -            | Delegate document extraction to docling via MCP. Build only what docling doesn't cover (repos, APIs, social).            |
| Serializer hierarchy pattern                        | pattern      | defer    | 2026-04-07 | medium  | E1     | medium    | -            | BaseDocSerializer → per-format serializers. Per-component serializers. T28 export layer reference.                       |
| Enrichment pipeline (toggleable)                    | pattern      | defer    | 2026-04-07 | medium  | E1     | medium    | -            | Optional post-processing: code, formula, picture enrichment. Pattern for T28 analysis depth options.                     |
| Thread-safe pipeline design                         | knowledge    | defer    | 2026-04-07 | medium  | E0     | low       | -            | Per-run isolation, bounded queues, back-pressure. Production engineering reference.                                      |
| InputFormat enum (17 types)                         | knowledge    | defer    | 2026-04-07 | low     | E0     | medium    | -            | Compare with unstructured FileType. Simpler enum paired with FormatOption mapping.                                       |
| Don't replicate multi-package split prematurely     | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | 5 packages for 57K-star library. T28 has one user — start monolithic.                                                    |
| Don't build plugin system before you have plugins   | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | pluggy exists because of real third-party contributors. Build hardcoded extractors first.                                |
| Don't adopt DoclingDocument wholesale               | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | Optimized for single-doc repr. T28 needs cross-source analysis schema. Study pattern, design own.                        |

<a id="errors-and-vulnerabilities-in-ai-generated-code-pdf-document"></a>

## Errors and Vulnerabilities in AI-Generated Code.pdf (document)

| Candidate                                        | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ------------------------------------------------ | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 18-category AI error taxonomy                    | knowledge    | defer    | 2026-04-09 | high    | E0     | high      | -            | Structured reference table. Cross-reference against CODE_PATTERNS.md for coverage gaps.                                  |
| Hallucinated dependencies (slopsquatting)        | knowledge    | defer    | 2026-04-09 | high    | E0     | high      | -            | AI suggests non-existent packages. No current SoNash mitigation. Verify against npm registry.                            |
| Intentional vs unintentional debt classification | knowledge    | defer    | 2026-04-09 | medium  | E0     | high      | -            | TDMS could classify debt by AI-origin vs human-origin. New dimension for debt tracking.                                  |
| Context momentum / hallucinated logic            | knowledge    | defer    | 2026-04-09 | medium  | E0     | high      | -            | Early AI misinterpretations steer project wrong. We mitigate with /clear and SESSION_CONTEXT.md but no explicit detectio |
| Structural entropy (code bloat)                  | anti-pattern | defer    | 2026-04-09 | low     | E0     | high      | -            | AI generates verbose, redundant code. CLAUDE.md guardrail covers this but pattern check doesn't gate it.                 |
| Deployment fragility (happy path only)           | anti-pattern | defer    | 2026-04-09 | low     | E0     | medium    | -            | AI code works locally, fails in production. Enforce reproducible builds, observability.                                  |

<a id="hkuds-cli-anything-repo"></a>

## HKUDS/CLI-Anything (repo)

| Candidate                                | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ---------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| HARNESS.md 7-Phase SOP                   | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | Systematic methodology for wrapping GUI apps as agent-native CLIs. Directly applicable to JASON-OS Domain 02a.           |
| SKILL.md Command Catalog Format          | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | 37 SKILL.md files. Flat command references vs sonash workflow definitions. Design space comparison for skill format evol |
| .claude-plugin/marketplace.json          | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | First public Claude Code plugin format reference. Compare against sonash .claude-plugin/ structure.                      |
| Registry + CLI-Hub Distribution          | pattern      | defer    | 2026-04-06 | medium  | E1     | medium    | -            | registry.json (35 CLIs) → static hub → pip install. Agent-discoverable via meta-skill. Model for JASON-OS skill distribu |
| ReplSkin Terminal UI                     | pattern      | defer    | 2026-04-06 | medium  | E1     | medium    | -            | Python prompt_toolkit branded REPL. Pattern portable, code Python-specific. Reference for JASON-OS interactive modes.    |
| Codec Allowlist Pattern                  | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | frozenset-based subprocess arg validation. Similar to existing sonash security patterns.                                 |
| Skill Generator (Jinja2)                 | pattern      | defer    | 2026-04-06 | medium  | E2     | medium    | -            | Auto-generates SKILL.md from CLI introspection. Pattern portable to Node/TS.                                             |
| Agent-Native Software Methodology        | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | Core insight: wrap GUI software systematically for agents. HARNESS.md is the how-to. Foundational for JASON-OS Domain 02 |
| Build-vs-Integrate Decision for JASON-OS | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | Should JASON-OS invoke CLI-Anything harnesses (Python) or generate Node/TS wrappers using same methodology? Critical arc |
| Quality Treadmill Case Study             | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 28K stars in 29d, 35 harnesses, 0 CI enforcement. Growth outpacing gates. Opposite of build-your-own-x stagnation.       |
| MCP Backend Pattern                      | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | guides/mcp-backend.md. Wrap MCP servers as CLI backends via ClientSession + stdio_client. You have 3 MCP servers. Direct |
| Skill Auto-Generation Guide              | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | guides/skill-generation.md. Introspect Click decorators → Jinja2 → SKILL.md. Could inform /skill-creator automation.     |
| Mermaid Harness                          | content      | defer    | 2026-04-06 | medium  | E0     | high      | -            | Lightest-weight harness. No local binary (mermaid.ink cloud). Ready to use for agent-driven diagrams.                    |
| Exa Harness                              | content      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | AI search + structured extraction via Exa API. Alternative/complement for /deep-research searchers.                      |
| No-CI-for-Tests Anti-Pattern             | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 74 test files, zero CI enforcement. Tests as documentation, not quality gates. Don't regress on pre-commit enforcement.  |
| Monorepo Without Shared Testing          | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 35 packages, 0 conftest.py, no shared runner. Plan shared testing if JASON-OS distributes skills as packages.            |
| Growing Faster Than Quality Gates        | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 28K stars/29d with no automated enforcement. Same trajectory as celebrity stagnation, faster.                            |

<a id="iawia002-lux-repo"></a>

## iawia002/lux (repo)

| Candidate                                        | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                        |
| ------------------------------------------------ | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | -------------------------------------------------------------------------------------------- |
| init()-based plugin registry with domain routing | pattern      | defer    | 2026-04-12 | medium  | E0     | medium    | -            | Go init() + global map + blank imports. 46 extractors, zero boilerplate. Principle portable. |
| CI workflow generation from template             | knowledge    | defer    | 2026-04-12 | medium  | E1     | medium    | -            | Node script generates 45 workflows from template. Meta-CI pattern for JASON-OS.              |
| HARDCODED_CREDENTIALS_IN_SOURCE                  | anti-pattern | defer    | 2026-04-12 | medium  | E0     | high      | -            | Twitter bearer token + Weibo cookie in git. Never do this.                                   |
| DISABLED_TLS_VERIFICATION                        | anti-pattern | defer    | 2026-04-12 | low     | E0     | high      | -            | InsecureSkipVerify: true globally. MITM vulnerability.                                       |
| DOCUMENTATION_ABSENT_FOR_CONTRIBUTORS            | anti-pattern | defer    | 2026-04-12 | low     | E0     | medium    | -            | 46 extractors, 23-line CONTRIBUTING, no arch docs.                                           |

<a id="jdepoix-youtube-transcript-api-repo"></a>

## jdepoix/youtube-transcript-api (repo)

| Candidate                                              | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ------------------------------------------------------ | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| youtube-transcript-api as T27 primary extraction layer | tool         | defer    | 2026-04-07 | high    | E0     | high      | -            | pip install. One-line caption fetch. 7K stars, MIT, 100% coverage. First adoption recommendation in series.              |
| Innertube API reverse-engineering approach             | knowledge    | defer    | 2026-04-07 | high    | E0     | high      | -            | Undocumented /youtubei/v1/player API with ANDROID client context. No API key. 8 years maintained.                        |
| Context-aware error hierarchy pattern                  | pattern      | defer    | 2026-04-07 | high    | E1     | high      | -            | 15+ exception types with CAUSE_MESSAGE. RequestBlocked.cause adapts based on proxy config. Gold standard error handling. |
| IP ban workaround operational guide                    | content      | defer    | 2026-04-07 | high    | E0     | high      | -            | Production guide to YouTube IP blocks: proxy config, Webshare residential rotation, retries.                             |
| Three-layer T27 extraction architecture                | knowledge    | defer    | 2026-04-07 | high    | E0     | high      | -            | Cross-repo synthesis: L1=youtube-transcript-api (instant/free/~80%), L2=pytubefix captions (backup), L3=faster-whisper ( |
| Proxy rotation infrastructure                          | pattern      | defer    | 2026-04-07 | medium  | E1     | medium    | -            | ProxyConfig ABC with Generic + Webshare implementations. Rotating residential IPs, retry-on-429.                         |
| Manual vs auto-generated transcript priority           | knowledge    | defer    | 2026-04-07 | medium  | E0     | medium    | -            | find_transcript() checks manual first. Quality hierarchy baked into architecture.                                        |
| SRT/WebVTT timestamp formatting                        | pattern      | defer    | 2026-04-07 | low     | E0     | medium    | -            | Clean subtitle format generation. SRT (comma) vs WebVTT (dot) separator.                                                 |
| Don't build own transcript fetcher (anti-pattern)      | anti-pattern | defer    | 2026-04-07 | high    | E0     | high      | -            | 399 commits over 8 years maintaining YouTube API compatibility. Use the library.                                         |
| Ignore IP blocking for bulk (anti-pattern)             | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | YouTube blocks bulk requests. Plan proxy infrastructure from the start.                                                  |

<a id="jina-ai-reader-repo"></a>

## jina-ai/reader (repo)

| Candidate                                                       | Type                 | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                     |
| --------------------------------------------------------------- | -------------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Multi-provider fallback generator (iterProviders)               | pattern              | defer    | 2026-04-12 | medium  | E1     | high      | -            | Generator yields provider clients in preference order (Jina internal -> Serper Google -> Serper Bing). for...of loop cat  |
| x-\* request header protocol                                    | pattern              | defer    | 2026-04-12 | medium  | E1     | medium    | -            | 11+ x-\* headers control runtime fetch behavior (x-target-selector, x-wait-for-selector, x-timeout, x-cache-tolerance, x- |
| Tiered fetch fallback chain with sideLoad body hint             | architecture-pattern | defer    | 2026-04-12 | medium  | E2     | medium    | -            | cachedScrap() executes: Firestore cache -> curl-impersonate fetch -> (if thin <42 tokens or non-200) proxy retry -> Pupp  |
| curl-impersonate as Docker LD_PRELOAD base layer                | pattern              | defer    | 2026-04-12 | high    | E3     | medium    | -            | Two-stage Dockerfile: FROM lwthiker/curl-impersonate:0.6-chrome-slim-bullseye -> FROM node:22. Copy libcurl-impersonate.  |
| Multi-target deployment via --args override                     | architecture-pattern | defer    | 2026-04-12 | medium  | E2     | low       | -            | One Docker image deployed 6 times to Cloud Run by varying --args build/stand-alone/<entry>.js at deploy time. Inside con  |
| Readability + Turndown + Puppeteer extraction pipeline          | architecture-pattern | defer    | 2026-04-12 | low     | E2     | medium    | -            | Reference stack: Puppeteer renders -> linkedom parses -> @mozilla/readability narrows to article body -> Turndown (with   |
| r.jina.ai hosted service as fetch backend                       | knowledge            | defer    | 2026-04-12 | high    | E0     | high      | -            | The running hosted service at https://r.jina.ai/<url> handles SPA, PDFs, JS-rendered pages, cookies, proxies. Free tier   |
| curl-impersonate + TLS fingerprint concept                      | knowledge            | defer    | 2026-04-12 | high    | E0     | medium    | -            | Anti-bot defenses fingerprint the full TLS/TCP stack, not just User-Agent. Real Chrome vs headless Chrome differ at the   |
| Commercial OSS without tests as an architectural stance         | knowledge            | defer    | 2026-04-12 | medium  | E0     | medium    | -            | Reader runs at commercial scale with zero automated tests. Quality floor is TypeScript strict + lint + live observabilit  |
| Blog: Reader for search-grounding to improve factuality of LLMs | content              | defer    | 2026-04-12 | low     | E0     | medium    | -            | Jina blog post explaining the rationale for s.jina.ai: LLMs hallucinate less when grounded on actual fetched web content  |
| Colab notebook: full-site crawling methodology                  | content              | defer    | 2026-04-12 | low     | E0     | medium    | -            | The only practical multi-URL example using r.jina.ai. Demonstrates URL enumeration, rate limiting, result merging. Usefu  |
| DeepWiki-as-architecture-docs                                   | anti-pattern         | defer    | 2026-04-12 | medium  | E0     | high      | -            | README 'How it works' section is literally an image badge linking to deepwiki.com. Zero first-party architecture exposit  |
| Public repo + private submodule requirement                     | anti-pattern         | defer    | 2026-04-12 | medium  | E0     | high      | -            | Public repo imports from SSH-only private thinapps-shared submodule containing rate-limit, secrets, DAOs, decorators. RE  |
| Zero tests in a 10k-star production service                     | anti-pattern         | defer    | 2026-04-12 | low     | E0     | high      | -            | No .test.ts, no .spec.ts, no describe(). firebase-functions-test is devDep but never imported. CI is deploy-only behind   |

<a id="karpathy-autoresearch-repo"></a>

## karpathy/autoresearch (repo)

| Candidate                                             | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| program.md Agent Instruction Pattern                  | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | 114-line autonomous research protocol: setup, experiment loop, keep/discard, crash recovery, NEVER STOP, simplicity crit |
| Fixed-Budget Experimentation                          | pattern      | defer    | 2026-04-06 | high    | E0     | high      | -            | Fixed 5-min time budget makes all experiments comparable. ~12/hour, ~100 overnight. Apply to any time-bounded agent work |
| 3-File Architecture (Immutable/Editable/Instructions) | pattern      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | prepare.py (don't touch) + train.py (agent edits) + program.md (human edits). Clean editable-zone contract.              |
| Autonomous Crash Recovery Protocol                    | pattern      | defer    | 2026-04-06 | medium  | E0     | medium    | -            | Read stack trace, attempt fix, revert if unfixable. Simpler than checkpoint+resume for low-cost tasks.                   |
| Results TSV Logging Convention                        | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | commit/metric/memory/status/description. Already have JSONL equivalent. Low extraction value.                            |
| Simplicity Criterion for JASON-OS                     | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | 'Removing something and getting equal or better results is a great outcome.' Growth discipline for 72-skill ecosystem.   |
| Protocol vs Workflow Design Space                     | knowledge    | defer    | 2026-04-06 | high    | E0     | high      | -            | program.md (protocol: one agent, one metric, infinite loop) vs SKILL.md (workflow: multi-agent, multi-phase, convergence |
| Autonomy Spectrum Design                              | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | NEVER STOP (autoresearch) vs explicit approval gates (CLAUDE.md #2). JASON-OS needs: autonomous within phases, gated bet |
| analysis.ipynb Results Methodology                    | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | Framework: load TSV, keep/discard rates, progress plot with running minimum, rank improvements by delta. Apply to review |
| Hidden Multi-Agent Architecture                       | content      | defer    | 2026-04-06 | high    | E0     | high      | -            | .gitignore: worktrees/ + queue/ + generated CLAUDE.md/AGENTS.md. Multi-agent infrastructure exists but isn't shared. Mir |
| No-License-on-Purpose Trap                            | anti-pattern | defer    | 2026-04-06 | low     | E0     | medium    | -            | Karpathy can get away with no license. You can't. Always include LICENSE if publishing JASON-OS.                         |
| Single-Metric Optimization Trap                       | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | val_bpb works because the problem has one metric. Don't flatten multi-objective problems into one number.                |

<a id="ksharlandjiev-bedrock-summarize-audio-video-text-repo"></a>

## ksharlandjiev/bedrock-summarize-audio-video-text (repo)

| Candidate                                             | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| YouTube audio extraction pipeline                     | pattern      | defer    | 2026-04-07 | medium  | E1     | high      | -            | pytubefix download + moviepy audio extraction to MP3. Full lifecycle in ~30 lines. Reference for T27.                    |
| Amazon Transcribe async job lifecycle                 | knowledge    | defer    | 2026-04-07 | medium  | E0     | high      | -            | Start job -> poll -> fetch transcript -> cleanup. Speaker labels, S3 output routing. T27 speech-to-text reference.       |
| PII tokenize/untokenize round-trip pattern            | pattern      | defer    | 2026-04-07 | high    | E1     | high      | -            | Comprehend PII -> token replacement (T1/T2) -> persist map -> LLM with tokens -> untokenize. Privacy-preserving summariz |
| Chain of Responsibility + Factory handler composition | pattern      | defer    | 2026-04-07 | medium  | E1     | medium    | -            | Reader/processor/writer taxonomy with set_next() chaining and factory auto-discovery. Clean pipeline composition model.  |
| AST-based handler auto-discovery                      | pattern      | defer    | 2026-04-07 | medium  | E2     | medium    | -            | HandlerFactory walks handler tree, parses Python ASTs for AbstractHandler subclasses, registers for lazy import. Zero-co |
| JSONPath model-agnostic invocation config             | pattern      | defer    | 2026-04-07 | low     | E1     | medium    | -            | Env-driven model request/response mapping via JSONPath. Same code for Claude v2, Claude 3, Titan.                        |
| pytubefix caption + search + async capabilities       | content      | defer    | 2026-04-07 | high    | E0     | high      | -            | 1.5K stars, MIT. Built-in SRT caption extraction, playlist/channel enumeration, search API with filters, AsyncYouTube. C |
| Amazon Transcribe API reference                       | content      | defer    | 2026-04-07 | medium  | E0     | high      | -            | Handler demonstrates full async Transcribe lifecycle with speaker diarization.                                           |
| AWS-coupled extraction anti-pattern                   | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | 5+ AWS service deps create vendor lock-in. Prefer local-first (Whisper, Tesseract, spaCy). Repo itself has commented-out |
| Blocking poll anti-pattern                            | anti-pattern | defer    | 2026-04-07 | low     | E0     | medium    | -            | time.sleep(30) polling loop for Transcribe. Fine for CLI, must not copy into agent pipelines.                            |

<a id="mendableai-firecrawl-repo"></a>

## mendableai/firecrawl (repo)

| Candidate                                           | Type                 | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                     |
| --------------------------------------------------- | -------------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| scrapeURL engine-fallback chain                     | architecture-pattern | defer    | 2026-04-10 | high    | E1     | high      | -            | Pluggable extraction engines coordinated by a fallback-list builder. buildFallbackList → scrapeURLWithEngine → (success?  |
| Capability-gated test pattern                       | pattern              | defer    | 2026-04-10 | high    | E0     | high      | -            | Gate tests by runtime capability (env vars) not by CI fence. Same test file runs in all environments; gate decides wheth  |
| Harness-as-boot-orchestrator                        | pattern              | defer    | 2026-04-10 | medium  | E1     | medium    | -            | Single harness.ts script owns service boot order (API + workers + emulator) before test runner. CLAUDE.md mandates it; n  |
| Version-parallel controller trees                   | architecture-pattern | defer    | 2026-04-10 | low     | E1     | low       | -            | Parallel v0/v1/v2 controller directories with their own test fixtures. New features land on v2; v0 stays alive for compa  |
| Redlock distributed cache serialization             | pattern              | defer    | 2026-04-10 | medium  | E1     | low       | -            | Use redlock.using([key], ttlMs, ...) to serialise cache updates across multiple pods. Prevents race conditions on shared  |
| Multi-agent orchestration via openai_swarm          | knowledge            | defer    | 2026-04-10 | high    | E0     | high      | -            | Reference implementation of multi-agent coordination around a single scraping task. Worth reading to inform SoNash agent  |
| Deep Research API usage pattern                     | knowledge            | defer    | 2026-04-10 | medium  | E0     | high      | -            | How firecrawl's Deep Research API is invoked in practice (apartment-finder example). Interactive preference gathering →   |
| GitHub repo analysis via firecrawl Map API          | knowledge            | defer    | 2026-04-10 | medium  | E0     | high      | -            | examples/gemini-github-analyzer uses firecrawl's Map API to walk a GitHub repo. Direct domain overlap with SoNash's /rep  |
| Docs-to-OpenAPI extraction                          | knowledge            | defer    | 2026-04-10 | medium  | E0     | high      | -            | examples/turning_docs_into_api_specs — convert a documentation site into an OpenAPI spec via scraping. Informs SoNash do  |
| Commercial-OSS feature tiering via .env             | knowledge            | defer    | 2026-04-10 | low     | E0     | medium    | -            | Fire-engine is hosted-only; self-hosted users get documented limited CAPTCHA handling. Pattern: tier features by backing  |
| scrapeURL engine-fallback README                    | content              | defer    | 2026-04-10 | high    | E0     | high      | -            | Mermaid signal flow diagram for the engine fallback chain. The whole extraction thesis in four nodes. Worth re-reading w  |
| 58-example cookbook pattern                         | content              | defer    | 2026-04-10 | medium  | E1     | high      | -            | The examples/ directory as product-marketing-in-code. 58 self-contained apps, each pairing firecrawl with a specific LLM  |
| openai_swarm_firecrawl example                      | content              | defer    | 2026-04-10 | high    | E0     | high      | -            | Concrete multi-agent coordination code. Direct reference for SoNash's agent team boundary design.                         |
| gemini-github-analyzer example                      | content              | defer    | 2026-04-10 | medium  | E0     | high      | -            | Repo-walking via firecrawl Map API, same domain as SoNash repo-analysis.                                                  |
| deep-research-apartment-finder example              | content              | defer    | 2026-04-10 | medium  | E0     | high      | -            | Deep Research API usage pattern from a Python CLI.                                                                        |
| turning_docs_into_api_specs example                 | content              | defer    | 2026-04-10 | medium  | E0     | high      | -            | Docs-to-OpenAPI extraction pattern. Informs SoNash document-analysis.                                                     |
| CLAUDE.md minimal-actionable exemplar               | content              | defer    | 2026-04-10 | medium  | E0     | medium    | -            | 19-line CLAUDE.md that beats most 200-line variants. Test-first, E2E preferred, capability-gating, harness usage. Worth   |
| Zero architecture prose docs                        | anti-pattern         | defer    | 2026-04-10 | medium  | E0     | medium    | -            | 1162 files, one mermaid diagram, no docs/ directory. Queue layout, auth flow, service boundaries all have to be inferred  |
| Two queue systems coexisting without migration plan | anti-pattern         | defer    | 2026-04-10 | low     | E0     | low       | -            | BullMQ (Redis) and nuq-postgres (custom Postgres queue) both active in services/. Rationale undocumented. Suggests in-pr  |
| Hand-rolled polyglot SDK parity                     | anti-pattern         | defer    | 2026-04-10 | low     | E0     | low       | -            | Seven SDKs (JS, Python, Rust, Go, Java, Elixir, playwright-service) re-implement the wire contract manually. Parity enfo  |
| Hidden feature flags via env vars                   | anti-pattern         | defer    | 2026-04-10 | low     | E0     | medium    | -            | Firecrawl branches behaviour through SELF*HOST.md env vars (USE_DB_AUTHENTICATION, PROXY_SERVER, SEARXNG*\*) with no docu |

<a id="opendatalab-mineru-repo"></a>

## opendatalab/MinerU (repo)

| Candidate                                             | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                     |
| ----------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Structured output contract page                       | knowledge    | defer    | 2026-04-10 | medium  | E1     | high      | -            | docs/en/reference/output_files.md is an exemplary human-readable output spec: typed fields, enumerated block types, brea  |
| Environment variable catalog                          | knowledge    | defer    | 2026-04-10 | low     | E0     | high      | -            | docs/en/usage/cli*tools.md has prose catalog of 15+ MINERU*\* env vars with default/effect/scoping. Template for docs/age |
| Async task state machine with TTL cleanup             | pattern      | defer    | 2026-04-10 | medium  | E2     | high      | -            | mineru/cli/fast_api.py implements POST /tasks with four states (pending/processing/completed/failed), asyncio.Queue, sem  |
| Backend decision matrix for multi-mode tools          | knowledge    | defer    | 2026-04-10 | low     | E1     | medium    | -            | docs/en/quick_start/index.md has pre-install decision matrix: 5 backends × 8 constraints. Apply to /analyze and /media-a  |
| Three-backend dispatch with deferred imports          | pattern      | defer    | 2026-04-10 | medium  | E2     | low       | -            | mineru/cli/common.py uses string-dispatched factory with importlib deferred imports so users don't pay torch/vllm cost u  |
| Single fuzzy-match e2e test with low coverage floor   | anti-pattern | defer    | 2026-04-10 | medium  | E0     | high      | -            | 58k-star codebase with 1 test file, 1 test function, 0.2% coverage floor, no PR gating, silent retry workflow masking fl  |
| Unarmored HTTP service with insecure defaults         | anti-pattern | defer    | 2026-04-10 | medium  | E0     | high      | -            | mineru-api/router ship with no auth, no rate limit, no upload size cap, no CORS/TrustedHost middleware, FastAPI docs ena  |
| Silent retry workflow converts flake into green       | anti-pattern | defer    | 2026-04-10 | low     | E0     | medium    | -            | .github/workflows/rerun.yml retries failed runs up to 3 times with no flake-rate surfacing. Opposite of silent-failure-h  |
| No PR test gating (push-only workflows)               | anti-pattern | defer    | 2026-04-10 | low     | E0     | medium    | -            | cli.yml runs only on pushes to master/dev, never on pull requests. Contributors cannot see test results before merge. Gu  |
| Changelog-as-capability-index discipline              | knowledge    | defer    | 2026-04-10 | low     | E0     | low       | -            | docs/en/reference/changelog.md has prose entries with issue refs, CVE refs, quantified perf improvements, explicit break  |
| Wrap upstream CLI instead of reimplementing           | pattern      | defer    | 2026-04-10 | medium  | E1     | medium    | -            | mineru/model/vlm/vllm_server.py is 70 lines wrapping vllm.entrypoints.cli.main: intercepts sys.argv, parses out model/po  |
| Multi-vendor Dockerfile template                      | knowledge    | defer    | 2026-04-10 | low     | E3     | low       | -            | 11 Dockerfiles (1 global + 10 China vendor variants) following strict template: vendor base image -> Noto CJK fonts -> p  |
| Per-chip deployment guide template                    | knowledge    | defer    | 2026-04-10 | low     | E1     | low       | -            | 13 per-chip deployment guides follow consistent template: test platform -> Dockerfile recipe -> docker run -> support ma  |
| Coarse-to-fine two-stage parsing framing              | knowledge    | defer    | 2026-04-10 | medium  | E0     | medium    | -            | MinerU 2.5 paper (arxiv 2509.22186) introduces a 1.2B VLM with stage-1 layout analysis on downsampled images + stage-2 c  |
| README integration claim unbacked by first-party code | anti-pattern | defer    | 2026-04-10 | medium  | E0     | high      | -            | MinerU README lists MCP Server - Cursor/Claude Desktop/Windsurf as an integration. Reality: opendatalab/mineru-mcp does   |
| Unpinned GitHub Action reference                      | anti-pattern | defer    | 2026-04-10 | low     | E0     | medium    | -            | .github/workflows/mkdocs.yml uses mhausenblas/mkdocs-deploy-gh-pages@master (unpinned) while cla.yml pins contributor-as  |
| Floor-only version constraint with known CVE exposure | anti-pattern | defer    | 2026-04-10 | medium  | E0     | medium    | -            | pyproject.toml pins pillow>=11.0.0 with no upper bound. CVE-2026-25990 (Pillow PSD OOB write) affects 10.3.0 to <12.1.1.  |
| MinerU 1.x technical report                           | content      | skip     | 2026-04-10 | low     | E0     | low       | -            | arxiv 2409.18839 - 18 authors, PDF-Extract-Kit + pre/post-processing rules. Background reading only. Low direct relevanc  |
| MinerU 2.5 technical report                           | content      | defer    | 2026-04-10 | medium  | E0     | medium    | -            | arxiv 2509.22186 - 61 authors, 1.2B VLM, coarse-to-fine two-stage parsing. Low direct relevance but the two-stage framin  |

<a id="outline-outline-repo"></a>

## outline/outline (repo)

| Candidate                                           | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| --------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| MCP OAuth scope-filtered tool registration          | pattern      | defer    | 2026-04-12 | high    | E2     | high      | -            | Production MCP server filtering tools by OAuth scopes. 7 tool modules. Uses @modelcontextprotocol/sdk with Zod. JASON-OS |
| Command pattern (transport-agnostic business logic) | knowledge    | defer    | 2026-04-12 | high    | E1     | high      | -            | ~20 commands in server/commands/ (~8700 lines). Both API routes and MCP tools delegate to same commands. Transport-agnos |
| PluginManager hook type registry                    | pattern      | defer    | 2026-04-12 | high    | E2     | high      | -            | 10 hook types, priority ordering, auto-discovery via glob, plugin.json manifests. Structural client/server/shared split  |
| buildAPIContext() MCP-to-API bridge                 | pattern      | defer    | 2026-04-12 | high    | E1     | high      | -            | Bridge function constructing Koa APIContext from MCP request context. Enables MCP tool reuse of existing API infrastruct |
| @Encrypted field-level decorator                    | pattern      | defer    | 2026-04-12 | medium  | E1     | medium    | -            | Sequelize decorator for transparent AES field encryption. Applied at model layer. Relevant to SoNash M4.5 Security & Pri |
| TestServer ephemeral-port integration testing       | pattern      | defer    | 2026-04-12 | medium  | E1     | medium    | -            | Custom test utility starting real Koa server on port 0. Tests exercise actual transport, middleware, serialization.      |
| Abstract generic Store<T> with request dedup        | pattern      | defer    | 2026-04-12 | medium  | E1     | medium    | -            | MobX base store with generic typing, observable data Map, request deduplication via Symbol-keyed promise tracking.       |
| PersistenceExtension race condition prevention      | knowledge    | defer    | 2026-04-12 | medium  | E0     | medium    | -            | SELECT FOR UPDATE in Y.js persistence to prevent concurrent write races. General lesson in collaborative editing safety. |
| Content-as-code onboarding templates                | pattern      | defer    | 2026-04-12 | low     | E0     | medium    | -            | 4 markdown templates in server/onboarding/ injected into new workspaces. Relevant to SoNash M7.3.                        |
| Presenter response formatting layer                 | pattern      | defer    | 2026-04-12 | low     | E1     | low       | -            | JSON response formatting between models and API/MCP consumers. Per-model presenters.                                     |
| Bull queue processor BaseProcessor                  | pattern      | defer    | 2026-04-12 | low     | E1     | low       | -            | Base class for async job processors. ~20 specialized implementations for event-driven background work.                   |
| RPC-over-POST API pattern                           | anti-pattern | defer    | 2026-04-12 | medium  | E0     | high      | -            | POST for everything including reads. Abandons HTTP caching and semantics. Don't regress from SoNash REST-like approach.  |
| Externalized documentation                          | anti-pattern | defer    | 2026-04-12 | low     | E0     | high      | -            | All contributor docs externalized. No CONTRIBUTING.md, .env.example, or API docs in repo. SoNash in-repo approach is bet |
| CSP wildcard security debt                          | anti-pattern | defer    | 2026-04-12 | low     | E0     | medium    | -            | connect-src: \* from Safari WebSocket bug fixed in Safari 15. Temporary workaround became permanent.                     |
| Fat route files                                     | anti-pattern | defer    | 2026-04-12 | low     | E0     | medium    | -            | documents.ts handles ~30 endpoints. Command pattern keeps logic clean but routing layer is discovery burden.             |

<a id="public-apis-public-apis-repo"></a>

## public-apis/public-apis (repo)

| Candidate                                | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                  |
| ---------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Link Validation Workflow                 | pattern      | defer    | 2026-04-06 | low     | E1     | medium    | -            | validate_links.yml (29 lines) + links.py (273 lines). Daily cron link checker. Port to sonash for docs link integrity. |
| Structured Catalog Format (enum columns) | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | API/Desc/Auth/HTTPS/CORS with constrained enum values. Reference for JASON-OS skill/tool catalog.                      |
| Format Validation Script Pattern         | pattern      | defer    | 2026-04-06 | low     | E0     | low       | -            | format.py (277 lines) + tests (466 lines). Regex-based format enforcement. Simpler version of patterns:check.          |
| Google Calendar API                      | content      | defer    | 2026-04-06 | medium  | E1     | high      | -            | OAuth via Firebase Auth. Direct SoNash integration: sobriety milestones, meeting reminders, daily check-ins.           |
| Open-Meteo Weather API                   | content      | defer    | 2026-04-06 | low     | E0     | medium    | -            | No auth, CORS yes. Zero-friction weather data for mood-weather correlation journaling.                                 |
| Google Cloud Natural Language API        | content      | defer    | 2026-04-06 | medium  | E1     | medium    | -            | Same Firebase/Google Cloud ecosystem. Journal sentiment analysis for emotional pattern tracking.                       |
| validate_links.yml Workflow              | content      | defer    | 2026-04-06 | low     | E1     | high      | -            | 29-line daily cron. Directly transferable for SKILL_INDEX.md, EXTRACTIONS.md, MEMORY.md link checking.                 |
| Celebrity Stagnation with Infrastructure | knowledge    | defer    | 2026-04-06 | medium  | E0     | medium    | -            | Second data point with codecrafters. Proves automation alone doesn't prevent stagnation. MERGED cross-repo finding.    |
| Validation Without Maintenance Trap      | anti-pattern | defer    | 2026-04-06 | medium  | E0     | high      | -            | Format validation ensures structural integrity but not content freshness. Applies to patterns:check.                   |
| Sponsor-First README Anti-Pattern        | anti-pattern | defer    | 2026-04-06 | medium  | E0     | medium    | -            | 10 promoted APIs before community content. Erodes trust. Keep sponsors separate from content if JASON-OS has partners. |

<a id="safishamsi-graphify-repo"></a>

## safishamsi/graphify (repo)

| Candidate                                 | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                 |
| ----------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Skill orchestration pipeline              | knowledge    | defer    | 2026-04-09 | high    | E1     | high      | -            | 10-step pipeline with parallel agent dispatch, cache checking, chunk sizing. Reference for SoNash skill architecture. |
| Confidence tagging taxonomy               | knowledge    | defer    | 2026-04-09 | high    | E1     | high      | -            | EXTRACTED/INFERRED/AMBIGUOUS three-tier confidence for CAS findings and recall results.                               |
| MCP server pattern                        | pattern      | defer    | 2026-04-09 | medium  | E1     | high      | -            | 320-line MCP stdio server with 7 tools and token budget. Reference for JASON-OS MCP design.                           |
| LanguageConfig dataclass                  | pattern      | defer    | 2026-04-09 | medium  | E1     | medium    | -            | Generic walker + per-type config pattern. 20 languages with zero code duplication.                                    |
| Threat-vector security model              | knowledge    | defer    | 2026-04-09 | medium  | E0     | high      | -            | Attack-vector-organized security model. More readable than checklist-based formats.                                   |
| Platform-specific skill variants          | pattern      | defer    | 2026-04-09 | high    | E2     | medium    | -            | 7 platform skill files with shared core. Reference for JASON-OS portability.                                          |
| Graph-only persistence without versioning | anti-pattern | defer    | 2026-04-09 | low     | E0     | medium    | -            | No schema_version or migration path. Our analysis.json schema_version is correct.                                     |
| Oversized skill files                     | anti-pattern | defer    | 2026-04-09 | low     | E0     | medium    | -            | 15K+ tokens per variant with duplication. Cautionary for SoNash skill growth.                                         |
| Ship fast skip review                     | anti-pattern | defer    | 2026-04-09 | low     | E0     | low       | -            | Zero external review despite 15K stars. Security self-assessed only.                                                  |

<a id="teng-lin-notebooklm-py-repo"></a>

## teng-lin/notebooklm-py (repo)

| Candidate                           | Type         | Decision    | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                     |
| ----------------------------------- | ------------ | ----------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Skill Install + Version Stamping    | pattern      | defer       | 2026-04-06 | high    | E2     | high      | -            | skill.py reads SKILL.md from package data, stamps version, writes to ~/.claude/skills/. Solves cross_locale_config. Need  |
| Autonomy Rules Section in SKILL.md  | pattern      | defer       | 2026-04-06 | medium  | E1     | high      | -            | 22 auto-run + 7 ask-first with per-command reasons. Retrofit candidate for add-debt, pr-review, session-end, audit-\* ski |
| Nightly RPC Health Check            | pattern      | defer       | 2026-04-06 | medium  | E2     | medium    | -            | rpc-health.yml: daily cron, 3 exit codes, auto-creates labeled GitHub issues. External contract monitoring pattern.       |
| Ambient CLAUDE.md PR Workflow       | pattern      | defer       | 2026-04-06 | medium  | E1     | medium    | -            | 4-step embedded PR workflow. Alternative to /pr-review. Ambient vs invoked design question.                               |
| Embedded Task() Subagent Patterns   | pattern      | defer       | 2026-04-06 | medium  | E1     | medium    | -            | Literal Task() invocations in SKILL.md workflows. Reduces agent cognitive load.                                           |
| Open Skills Ecosystem Investigation | pattern      | investigate | 2026-04-06 | high    | E1     | high      | -            | npx skills add teng-lin/notebooklm-py. Unverified. Critical for JASON-OS distribution if real.                            |
| SKILL.md Autonomy Rules Template    | content      | defer       | 2026-04-06 | medium  | E0     | high      | -            | Lines 94-128. Direct template for adding autonomy rules to sonash skills.                                                 |
| skill.py Install Mechanism          | content      | defer       | 2026-04-06 | high    | E0     | high      | -            | Reference implementation. SkillTarget dataclass, version stamping, drift detection.                                       |
| rpc-health.yml Workflow             | content      | defer       | 2026-04-06 | medium  | E0     | high      | -            | Complete 90-line workflow. Daily cron, 3 exit codes, auto-issue creation, artifact upload.                                |
| CLAUDE.md Agent Guidance Pattern    | content      | defer       | 2026-04-06 | medium  | E0     | high      | -            | Well-structured CLAUDE.md + ambient PR workflow. Compare against sonash CLAUDE.md v5.9.                                   |
| AGENTS.md Separation                | knowledge    | defer       | 2026-04-06 | low     | E0     | medium    | -            | Separate file for multi-agent guidance. Consider if CLAUDE.md Section 7 grows.                                            |
| Undocumented API Dependency         | anti-pattern | defer       | 2026-04-06 | medium  | E0     | medium    | -            | Entire project wraps obfuscated Google RPC endpoints. Prefer documented APIs.                                             |
| Over-Engineered Install Mechanism   | anti-pattern | defer       | 2026-04-06 | low     | E0     | medium    | -            | 280 lines for copy file + stamp version. Extract pattern, not complexity.                                                 |

<a id="tobi-qmd-repo"></a>

## tobi/qmd (repo)

| Candidate                                                   | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Claude Code plugin manifest (marketplace.json)              | pattern      | defer    | 2026-04-12 | high    | E1     | high      | -            | Plugin manifest bundling MCP server + skills for 'claude plugin marketplace add' installation. Enables JASON-OS portabil |
| Skill frontmatter: allowed-tools + disable-model-invocation | pattern      | defer    | 2026-04-12 | high    | E0     | high      | -            | Frontmatter declarations enforcing tool access restrictions and preventing auto-invocation on destructive skills.        |
| MCP server as CLI subcommand (3 transports)                 | pattern      | defer    | 2026-04-12 | high    | E2     | high      | -            | MCP server via 'qmd mcp' subcommand. Stdio, HTTP foreground, HTTP daemon with PID file management. Reference for JASON-O |
| Query DSL with typed sub-queries (EBNF grammar)             | pattern      | defer    | 2026-04-12 | high    | E2     | high      | -            | Formal EBNF grammar for search queries with typed sub-queries (lex/vec/hyde) and intent disambiguation. 182-line spec.   |
| Scored markdown chunking algorithm                          | pattern      | defer    | 2026-04-12 | medium  | E1     | high      | -            | Break point scoring H1=100 down to line=1 with squared distance decay. 900 tokens/chunk, 15% overlap. Applicable to SoNa |
| RRF + position-aware blending                               | knowledge    | defer    | 2026-04-12 | medium  | E1     | high      | -            | Reciprocal Rank Fusion with k=60, original query 2x weight, top-rank bonus, position-aware blend 75/60/40% for ranks 1-3 |
| Fixture-based eval harness with difficulty tiers            | pattern      | defer    | 2026-04-12 | medium  | E1     | high      | -            | Easy/medium/hard query classification with expected docs. Precision@k, recall, MRR, F1 across 4 backends.                |
| Release skill with disabled auto-invocation                 | pattern      | defer    | 2026-04-12 | medium  | E1     | medium    | -            | Release workflow with disable-model-invocation: true. Enforces exact dep pinning. Keep a Changelog format.               |
| node-llama-cpp for privacy-first local inference            | knowledge    | defer    | 2026-04-12 | high    | E0     | high      | -            | Node wrapper for llama.cpp. Runs GGUF models locally with GPU acceleration. Relevant to SoNash privacy-first vision.     |
| AST-aware code chunking via tree-sitter                     | pattern      | defer    | 2026-04-12 | medium  | E1     | medium    | -            | Tree-sitter parsing for TS/JS/Python/Go/Rust. Chunks at function/class/import boundaries.                                |
| Daemon mode with PID file management                        | pattern      | defer    | 2026-04-12 | low     | E1     | medium    | -            | HTTP server --daemon flag. PID at ~/.cache/qmd/mcp.pid. Idle context disposal after 5 min.                               |
| LoRA SFT on small LLMs for domain tasks                     | knowledge    | defer    | 2026-04-12 | high    | E0     | low       | -            | LoRA rank 16, alpha 32, Qwen3-1.7B, 5 epochs. 92% eval score. $1.50 per run on HF A10G.                                  |
| HuggingFace Jobs for cheap cloud training                   | knowledge    | defer    | 2026-04-12 | medium  | E0     | low       | -            | hf jobs uv run executes SFT for ~$1.50. Self-contained scripts.                                                          |
| Rule-based reward function for RL                           | knowledge    | defer    | 2026-04-12 | medium  | E0     | low       | -            | 5-dimension scoring. Deterministic, no LLM judge. Suitable as RL signal.                                                 |
| Nix flake with home-manager module                          | pattern      | defer    | 2026-04-12 | low     | E2     | low       | -            | flake.nix with homeModules.default for NixOS users. programs.qmd.enable option.                                          |
| Fine-tuning before exhausting prompt engineering            | anti-pattern | defer    | 2026-04-12 | medium  | E0     | medium    | -            | qmd tried GEPA prompt optimization before SFT. Order matters - prompt first, then fine-tune.                             |
| Caret ranges in reproducible-install packages               | anti-pattern | defer    | 2026-04-12 | low     | E0     | medium    | -            | Exact pins required for platform-binary shipping packages. SoNash uses carets.                                           |
| Skill without invocation gate on destructive ops            | anti-pattern | defer    | 2026-04-12 | medium  | E0     | high      | -            | Destructive skills should declare disable-model-invocation. SoNash skills rely on prose guardrails.                      |

<a id="unclecode-crawl4ai-repo"></a>

## unclecode/crawl4ai (repo)

| Candidate                                 | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                     |
| ----------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| FilterChain + Scorer composition          | pattern      | defer    | 2026-04-12 | high    | E1     | high      | -            | Composable filter/scorer pipeline for content gating. Applicable to /analyze pipeline.                    |
| 3-tier resource pool (PERMANENT/HOT/COLD) | pattern      | defer    | 2026-04-12 | high    | E1     | high      | -            | Browser pool with tiered warmth and janitor lifecycle. 10x memory reduction. JASON-OS infrastructure.     |
| Hook lifecycle with 8 ordered hooks       | pattern      | defer    | 2026-04-12 | high    | E0     | high      | -            | 8 lifecycle hooks with clear sequence, auth guidance, security model. Combine with ArchiveBox governance. |
| CrawlState save/load resume               | knowledge    | defer    | 2026-04-12 | medium  | E1     | medium    | -            | Persistent state for long-running tasks. NOTE: on_state_change does NOT exist.                            |
| Strategy ABC (55+ implementations)        | knowledge    | defer    | 2026-04-12 | medium  | E0     | medium    | -            | Clean abstract hierarchy with runtime composition via FilterChain.                                        |
| DOCUMENTATION_PROMISES_CODE_GAPS          | anti-pattern | defer    | 2026-04-12 | medium  | E0     | high      | -            | Docs describe features code implements partially. Verify before recommending.                             |
| MONOLITHIC_UTILS                          | anti-pattern | defer    | 2026-04-12 | low     | E0     | medium    | -            | utils.py at 3,778 lines. Domain functions in one file.                                                    |

<a id="unstructured-io-unstructured-repo"></a>

## unstructured-io/unstructured (repo)

| Candidate                                       | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Auto-routing via type detection                 | pattern      | defer    | 2026-04-07 | high    | E2     | high      | -            | partition() auto-detects file type via libmagic, routes to format-specific partitioner. T28 extraction layer core patter |
| Self-describing FileType registry               | pattern      | defer    | 2026-04-07 | high    | E2     | high      | -            | Enum where each member declares deps, extras, MIME types, extensions. Adding format = 1 enum member. T28 source type reg |
| Strategy fallback chain                         | pattern      | defer    | 2026-04-07 | medium  | E1     | high      | -            | AUTO→HI_RES→OCR_ONLY→FAST with dependency checking. Maps to T28 Quick/Standard/Deep with graceful degradation.           |
| Graceful dependency checking                    | pattern      | defer    | 2026-04-07 | medium  | E1     | high      | -            | dependency_exists() runtime check + log warning + fallback. T28 needs for optional deps (Whisper, Chrome, gh CLI).       |
| Golden-file snapshot testing                    | pattern      | defer    | 2026-04-07 | medium  | E2     | medium    | -            | 40+ connector types tested via expected markdown output comparison. Model for T28 extraction regression testing.         |
| Element type hierarchy with metadata            | knowledge    | defer    | 2026-04-07 | medium  | E1     | high      | -            | Dataclass elements with coordinates, data source provenance, permissions. Informs T28 output schema design.              |
| Chunking with table isolation                   | knowledge    | defer    | 2026-04-07 | medium  | E1     | medium    | -            | Tables isolated from text, headers carried across continuation chunks. T28 analysis layer reference.                     |
| Text cleaning pipeline                          | knowledge    | defer    | 2026-04-07 | low     | E0     | medium    | -            | Bullet normalization, ligature replacement, whitespace cleanup. Post-extraction normalization for T28.                   |
| S3-backed performance benchmarking              | knowledge    | defer    | 2026-04-07 | medium  | E1     | low       | -            | Benchmark results tagged with architecture/instance/hash. Production-grade perf tracking model.                          |
| unstructured-ingest connector ecosystem         | content      | defer    | 2026-04-07 | high    | E1     | high      | -            | 40+ source connectors. T28 connector layer reference. Separate repo from extraction.                                     |
| Don't replicate ontology V2                     | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | Pydantic HTML intermediate representation acknowledged as over-engineered by team. Go extraction→typed output directly.  |
| Don't build per-format parsers in TypeScript    | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | 30+ partitioners = years of edge cases. Delegate parsing to existing tools, focus on orchestration.                      |
| Don't fragment extraction+analysis across repos | anti-pattern | defer    | 2026-04-07 | medium  | E0     | high      | -            | Embedding moved to unstructured-ingest, fragmenting DX. Keep T28 as single coherent system.                              |

<a id="vikparuchuri-marker-repo"></a>

## VikParuchuri/marker (repo)

| Candidate                                      | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ---------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Benchmark registry (7 methods, 2 scorers)      | pattern      | defer    | 2026-04-12 | high    | E1     | high      | -            | Pluggable registry for comparing implementations. METHOD_REGISTRY + SCORE_REGISTRY + published dataset. GPL code but pat |
| 3-stage pipeline (provider/processor/renderer) | knowledge    | defer    | 2026-04-12 | high    | E0     | high      | -            | Clean extract->transform->render separation with 6 extension points and dependency injection.                            |
| ConfigParser introspection                     | knowledge    | defer    | 2026-04-12 | medium  | E0     | medium    | -            | Auto-discovers components by inspecting module structure. Self-documenting config.                                       |
| GPL_LICENSE_TRAP                               | anti-pattern | defer    | 2026-04-12 | medium  | E0     | high      | -            | GPL-3.0 blocks adoption. Extract patterns only, never import code.                                                       |
| SECURITY_AS_AFTERTHOUGHT                       | anti-pattern | defer    | 2026-04-12 | low     | E0     | high      | -            | Shell injection + path traversal + credential exposure in tool processing untrusted PDFs.                                |

<a id="viktoraxelsen-memskill-repo"></a>

## ViktorAxelsen/MemSkill (repo)

| Candidate                          | Type         | Decision    | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                               |
| ---------------------------------- | ------------ | ----------- | ---------- | ------- | ------ | --------- | ------------ | --------------------------------------------------------------------------------------------------- |
| Meta-Memory Skills Framework       | pattern      | defer       | 2026-04-06 | high    | E0     | high      | -            | Skills about HOW to remember. Paradigm shift for auto-memory. Read arXiv 2602.02474.                |
| Skill Evolution Loop               | pattern      | defer       | 2026-04-06 | high    | E1     | high      | -            | Mine failures → refine skills → propose new. General-purpose self-improvement.                      |
| Skill Bank 5-Section Format        | pattern      | defer       | 2026-04-06 | medium  | E0     | medium    | -            | Description/Purpose/When to Use/How to Apply/Constraints. Compare against SKILL.md.                 |
| Designer Prompt Templates          | pattern      | defer       | 2026-04-06 | high    | E0     | medium    | -            | 18KB failure classification + mutation prompts. Skill refinement methodology.                       |
| Dual-Embedding Memory Bank         | pattern      | defer       | 2026-04-06 | medium  | E2     | medium    | -            | Content + context embeddings. Concept portable, code FAISS+PyTorch.                                 |
| Operation Templates with Meta-Info | pattern      | defer       | 2026-04-06 | medium  | E1     | medium    | -            | Usage + reward + EMA tracking for skill/tool selection.                                             |
| 15 Memory Skill Templates          | content      | defer       | 2026-04-06 | high    | E0     | high      | -            | 8 conversational + 7 embodied. Direct templates for JASON-OS memory operations. Read all before T4. |
| capture_activity_details.md        | content      | defer       | 2026-04-06 | high    | E0     | high      | -            | Activity capture with temporal context. Template for auto-memory enhancement.                       |
| insert.md                          | content      | defer       | 2026-04-06 | high    | E0     | high      | -            | Memory insert with duplicate avoidance + quality criteria.                                          |
| arXiv 2602.02474                   | content      | investigate | 2026-04-06 | high    | E1     | high      | -            | Core theory paper. NOT FETCHED. MUST read before T4 execution.                                      |
| Academic Code Quality              | anti-pattern | defer       | 2026-04-06 | medium  | E0     | medium    | -            | 42KB monolith, zero tests, no version pins. Extract concepts, not code.                             |
| Research Artifact as Dependency    | anti-pattern | defer       | 2026-04-06 | low     | E0     | medium    | -            | Paper companion code. Won't be maintained. Extract knowledge, don't depend.                         |

<a id="zedeus-nitter-repo"></a>

## zedeus/nitter (repo)

| Candidate                                         | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                     |
| ------------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| Docker container hardening (RO fs + CAP_DROP ALL) | knowledge    | defer    | 2026-04-12 | high    | E0     | high      | -            | Best Docker hardening in T29 corpus. Read-only fs, CAP_DROP ALL, non-root uid 998, alpine, health checks. |
| Session pool with per-endpoint rate limiting      | knowledge    | defer    | 2026-04-12 | medium  | E0     | medium    | -            | Multiple sessions rotate on rate limits. Per-session per-endpoint tracking with preemptive backoff.       |
| ADVERSARIAL_DEPENDENCY                            | anti-pattern | defer    | 2026-04-12 | high    | E0     | high      | -            | Building on hostile platform. Twitter killed nitter. 12.8K stars, effectively dead.                       |
| XSS_IN_CONTENT_RENDERER                           | anti-pattern | defer    | 2026-04-12 | medium  | E0     | high      | -            | Unescaped tweet content via Karax verbatim. Renders untrusted HTML.                                       |
| Parser versioning for unstable APIs               | knowledge    | defer    | 2026-04-12 | medium  | E0     | medium    | -            | Experimental module for parallel parser development. Isolates blast radius of upstream API changes.       |
| SECURITY_HEADERS_ABSENT                           | anti-pattern | defer    | 2026-04-12 | low     | E0     | medium    | -            | No CSP, X-Frame-Options, HSTS in web application. Zero defense-in-depth.                                  |

<a id="https-docs-composio-dev-docs-website"></a>

## https://docs.composio.dev/docs (website)

| Candidate                                             | Type                 | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------------- | -------------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Meta-tool pattern for dynamic tool discovery          | architecture-pattern | extract  | 2026-04-07 | high    | E1     | high      | -            | 6 meta tools (search, get-schema, auth, execute, workbench, bash) instead of loading 1000+ definitions. Agent discovers  |
| Native vs MCP tradeoff framework with token cost data | design-principle     | extract  | 2026-04-07 | high    | E0     | high      | -            | Native: context control + interception. MCP: simplicity. 55K tokens for 5 MCP servers. Measure current 3-server overhead |
| llms.txt standard for AI-readable documentation       | pattern              | defer    | 2026-04-07 | medium  | E0     | medium    | -            | Standardized llms.txt at site root for LLM consumption. Park for JASON-OS documentation strategy.                        |
| Event trigger dual model (webhook + polling)          | pattern              | defer    | 2026-04-07 | medium  | E2     | medium    | -            | Webhook for real-time capable services, polling for those without. Park for event-driven agent features.                 |

<a id="https-gist-github-com-farzaa-c35ac0cfbeb957788650e36aabea836d-website"></a>

## https://gist.github.com/farzaa/c35ac0cfbeb957788650e36aabea836d (website)

| Candidate                                                  | Type                 | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ---------------------------------------------------------- | -------------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Anti-cramming / anti-thinning balance for knowledge skills | design-principle     | extract  | 2026-04-07 | high    | E0     | high      | -            | When to split vs enrich. Third paragraph about sub-topic = split. Stub with 4 entries mentioning it = enrich. Apply to E |
| 15-entry checkpoint cycle pattern                          | workflow-pattern     | extract  | 2026-04-07 | high    | E0     | high      | -            | Every N items: rebuild indexes, audit quality, check for anti-patterns. Apply to batch synthesis and /deep-research mid- |
| Parallel subagent cleanup workflow (5-batch audit)         | workflow-pattern     | defer    | 2026-04-07 | medium  | E1     | high      | -            | 5-agent batches auditing 6 dimensions each. Compare against our parallelization patterns when building T24.              |
| Writer-not-filing-clerk identity framing                   | design-principle     | extract  | 2026-04-07 | medium  | E0     | high      | -            | Identity shapes operations: 'what does this mean' vs 'where do I file this'. T24 synthesis adoption should synthesize, n |
| Concurrency safety rules for LLM file ops                  | pattern              | defer    | 2026-04-07 | low     | E0     | medium    | -            | Re-read before edit, never delete without reading, rebuild indices at end. Partially covered by CLAUDE.md #12.           |
| 7-command skill architecture as T24 reference design       | architecture-pattern | extract  | 2026-04-07 | high    | E1     | high      | -            | ingest/absorb/query/cleanup/breakdown/rebuild-index/reorganize. Direct reference for T24 command set. Absorb + breakdown |

<a id="https-gist-github-com-karpathy-442a6bf555914893e9891c11519de94f-website"></a>

## https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f (website)

| Candidate                                                | Type                   | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| -------------------------------------------------------- | ---------------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Three-layer architecture pattern for LLM knowledge bases | architecture-pattern   | extract  | 2026-04-07 | medium  | E0     | high      | -            | Maps to JASON-OS extraction framing. Raw sources / wiki / schema = .research/ / docs+MEMORY / CLAUDE.md+skills.          |
| Ingest-Query-Lint operational triad                      | workflow-pattern       | extract  | 2026-04-07 | medium  | E1     | high      | -            | Ingest=/repo-analysis+/website-analysis, Query=/deep-research+/repo-synthesis, Lint=orphan detection+/alerts+health scri |
| Answers-compound-into-wiki principle                     | design-principle       | extract  | 2026-04-07 | high    | E0     | high      | -            | Key gap: /deep-research and /brainstorm outputs archive to .research/ but don't feed back into active knowledge layer. T |
| Index + Log dual navigation system                       | implementation-pattern | extract  | 2026-04-07 | low     | E0     | high      | -            | Already have: DOCUMENTATION_INDEX.md=index, SESSION_HISTORY.md+commit-log.jsonl=log, research-index.jsonl=research index |
| qmd local markdown search (MCP + CLI)                    | tool                   | extract  | 2026-04-07 | high    | E1     | medium    | -            | Evaluate for JASON-OS search layer. Currently Grep+index-based. At 1000+ docs may need hybrid BM25/vector search.        |

<a id="https-gist-github-com-kieranklaassen-4f2aba89594a4aea4ad64d753984b2ea-website"></a>

## https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea (website)

| Candidate                                                   | Type                 | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------------------- | -------------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 6-pattern orchestration taxonomy for AGENT_ORCHESTRATION.md | architecture-pattern | extract  | 2026-04-07 | medium  | E0     | high      | -            | Parallel Specialists, Pipeline, Swarm, Research+Impl, Plan Approval, Coordinated Refactoring. Map to existing skill usag |
| Spawn backend comparison for T5 worktree management         | pattern              | extract  | 2026-04-07 | high    | E0     | high      | -            | in-process (hidden/fastest), tmux (visible/persistent), iterm2 (macOS split). Auto-detection logic. Directly relevant to |
| TeammateTool 13-operation reference                         | pattern              | defer    | 2026-04-07 | medium  | E0     | high      | -            | Full lifecycle: spawn/discover/join/approve/write/broadcast/shutdown/cleanup. Audit .claude/teams/ against this when exp |
| Task dependency auto-unblock for skill pipeline design      | workflow-pattern     | defer    | 2026-04-07 | high    | E1     | high      | -            | blockedBy arrays with auto-unblock on completion. Evaluate for deep-research phase sequencing — could replace manual dis |
| Subagent vs teammate decision framework                     | design-principle     | extract  | 2026-04-07 | medium  | E0     | high      | -            | Short-lived focused = subagent. Persistent coordination with messaging = teammate. Add to AGENT_ORCHESTRATION.md as deci |

<a id="https-gist-github-com-maharshi-pandya-4aeccbe1dbaa7f89c182bd65d2764203-website"></a>

## https://gist.github.com/Maharshi-Pandya/4aeccbe1dbaa7f89c182bd65d2764203 (website)

| Candidate                                             | Type             | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ----------------------------------------------------- | ---------------- | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Exploration-over-conclusion as skill design principle | design-principle | defer    | 2026-04-07 | medium  | E0     | medium    | -            | Validates brainstorm Phase 1 philosophy. Potential: add minimum-exploration threshold to convergence loops before allowi |
| Contemplator tag pattern (historical reference)       | pattern          | skip     | 2026-04-07 | low     | E0     | low       | -            | Claude native <thinking> blocks supersede this. Historical reference only — no action needed.                            |

<a id="https-sidbharath-com-blog-claude-code-the-complete-guide-website"></a>

## https://sidbharath.com/blog/claude-code-the-complete-guide/ (website)

| Candidate                                 | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                        |
| ----------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| Cloud teleportation pattern               | knowledge    | defer    | 2026-04-09 | high    | E0     | high      | -            | & prefix sends tasks to Claude Code Web, --teleport pulls back. Could solve terminal-blocking agent problem. |
| Plugin marketplace ecosystem              | knowledge    | defer    | 2026-04-09 | medium  | E0     | medium    | -            | Anthropic marketplace (36 plugins). Community marketplaces emerging. Track maturity.                         |
| Junior engineer framing                   | knowledge    | defer    | 2026-04-09 | low     | E0     | high      | -            | External validation of treating Claude Code as junior engineer, not autopilot.                               |
| Tutorial structure as onboarding template | pattern      | defer    | 2026-04-09 | medium  | E1     | medium    | -            | Setup→Daily→Advanced→Production. 20 sections. Could template a SoNash onboarding guide.                      |
| Features without enforcement              | anti-pattern | defer    | 2026-04-09 | low     | E0     | high      | -            | Hooks as automation not gates. CLAUDE.md as memory not rules. Misses reliability layer.                      |
| No compaction discussion                  | anti-pattern | defer    | 2026-04-09 | low     | E0     | medium    | -            | Treating context as unlimited. No state loss or checkpoint strategies.                                       |

<a id="https-www-youtube-com-watch-v-oszdfnqmgrw-media"></a>

## https://www.youtube.com/watch?v=OSZdFnQmgRw (media)

| Candidate                                   | Type         | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                                    |
| ------------------------------------------- | ------------ | -------- | ---------- | ------- | ------ | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Obsidian raw→wiki pipeline pattern          | pattern      | defer    | 2026-04-09 | medium  | E0     | high      | -            | Raw folder staging → LLM wiki → master index. Lightweight RAG alternative. Our .research/ pipeline is the evolved versio |
| CLAUDE.md as knowledge traversal controller | knowledge    | defer    | 2026-04-09 | medium  | E0     | high      | -            | CLAUDE.md instructs LLM how to navigate file structure. Validates our Section 7 approach.                                |
| Obsidian Web Clipper                        | content      | defer    | 2026-04-09 | low     | E0     | medium    | -            | Chrome extension for web→markdown. Alternative ingestion for /analyze pipeline.                                          |
| Scale threshold decision framework          | knowledge    | defer    | 2026-04-09 | low     | E0     | medium    | -            | Solo <thousands = markdown. Millions = RAG. Start simple.                                                                |
| Overcomplicating knowledge retrieval        | anti-pattern | defer    | 2026-04-09 | low     | E0     | high      | -            | Jumping to vector DBs before validating structured markdown works at your scale.                                         |

<a id="https-www-youtube-com-watch-v-qinuqwl4e-k-media"></a>

## https://www.youtube.com/watch?v=qINuQwL4E-k (media)

| Candidate                                 | Type      | Decision | Date       | Novelty | Effort | Relevance | Extracted To | Notes                                                                                                     |
| ----------------------------------------- | --------- | -------- | ---------- | ------- | ------ | --------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| Context-over-filename retrieval principle | knowledge | defer    | 2026-04-09 | low     | E0     | medium    | -            | Make files findable by surrounding context. Valid principle, already implemented via analysis.json + FTS. |
| Subfolder-per-project attachment pattern  | pattern   | defer    | 2026-04-09 | low     | E0     | low       | -            | Obsidian auto-creates attachments/ per project. Our slug-based dirs already do this.                      |
