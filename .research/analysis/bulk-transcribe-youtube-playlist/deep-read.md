# Deep Read: bulk_transcribe_youtube_videos_from_playlist

## Artifacts Discovered

### Documentation

- **readme.md** — Extensive (200+ lines). Covers functional overview, core
  components, detailed workflow (7 steps), implementation details
  (initialization, downloading, transcription, metadata, output), setup
  instructions with pyenv/venv options, script configuration, and Whisper model
  configuration. This is thorough for a utility script.

### Configuration

- **pyproject.toml** — Minimal. Only ruff config with `ignore = ["E501"]` (line
  length). No build system, no project metadata.
- **.python-version** — `3.12` (pyenv marker)
- **requirements.txt** — 11 deps, unpinned. Includes dead dep `fastapi` (not
  imported in code).

### UI

- **transcript_reader.html** — Self-contained HTML reader for transcript output.
  Uses Bootstrap, jQuery, and compromise.js (NLP library for sentence/paragraph
  detection). Features: dark mode toggle, font selector (Cambria, Georgia,
  Garamond, etc.), font size slider, text width slider, reader mode overlay.
  This is a surprisingly polished UX for a CLI transcript tool.

### Internal Artifacts NOT Found

- No guides, tutorials, or notebooks
- No architecture docs
- No CONTRIBUTING.md
- No examples directory
- No test data

## Knowledge Beyond Code

1. **Whisper model selection**: README discusses model choices — `large-v3` used
   by default, with note that local inference is more accurate than OpenAI API's
   `whisper-1`. This is practical guidance for T27.

2. **CUDA/GPU configuration**: The code shows the real-world complexity of GPU
   setup — Anaconda toolkit path detection, fallback to CPU, float16 vs auto
   compute type. This is operational knowledge about running Whisper locally
   that docs don't cover.

3. **Transcript post-processing**: The `compromise.js` library in the HTML
   reader adds NLP-based paragraph detection client-side. Combined with
   server-side SpaCy sentence splitting, this is a two-stage NLP pipeline for
   transcript readability.

4. **Cost estimation**: `WHISPER_COST_PER_MINUTE = 0.006` with estimation output
   before API transcription. Shows awareness of cost as a first-class concern.

5. **VAD filter**: `vad_filter=True` in Whisper config — Voice Activity
   Detection to skip silence. `beam_size=10` for accuracy. These are tuned
   parameters, not defaults.

## Cataloged for Phase 4b

- pytubefix (shared dep with bedrock repo)
- faster-whisper (CTranslate2 Whisper implementation)
- compromise.js (client-side NLP)
- OpenAI Whisper API as fallback option
