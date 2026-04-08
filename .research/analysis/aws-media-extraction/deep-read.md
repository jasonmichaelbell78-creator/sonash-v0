# Deep Read — AWS Media Extraction Framework

## Artifacts Discovered and Read

### Extraction Service Lambda Functions (17 functions)

The core pipeline is a Step Functions workflow orchestrating these Lambdas:

1. **extr-srv-sample-video** — Frame sampling using moviepy. Configurable FPS,
   chunk-based processing (10min chunks), resize to 2048x2048 max. Outputs JPEG
   frames to S3, metadata to DynamoDB.

2. **extr-srv-sample-video-dedup** — Smart sampling via OpenSearch vector
   similarity. Uses Titan Multimodal Embedding to generate vectors for each
   frame, then cosine similarity to detect near-duplicates. Configurable
   threshold (default 0.5). Marks frames as similar/unique in DynamoDB.

3. **extr-srv-sample-video-dedup-faiss** — Alternative FAISS-based dedup (local
   vector search, no OpenSearch dependency). Same approach, lower cost.

4. **extr-srv-image-extraction** — Per-frame ML feature extraction:
   - Rekognition DetectLabels (objects, scenes)
   - Rekognition DetectText (OCR)
   - Rekognition DetectCelebrities
   - Rekognition DetectModerationLabels (content safety)
   - Bedrock Claude Haiku image captioning (100 token description) Each feature
     independently toggleable. Raw results stored to S3 JSON.

5. **extr-srv-generate-embedding** — Dual embedding: Titan text (1024-dim) and
   Titan multimodal. Used for semantic search and similarity.

6. **extr-srv-image-embedding** — Stores frame embeddings to OpenSearch.

7. **extr-srv-image-vector-save** — Persists vectors to OpenSearch index.

8. **extr-srv-shot-analysis** — Groups frames into shots based on similarity
   score threshold. Generates per-shot summaries from frame captions + subtitles
   using Bedrock Claude Haiku.

9. **extr-srv-scene-analysis** — Groups shots into scenes using Bedrock Claude
   Sonnet 3.5. Higher-level narrative segmentation. Re-generates summaries at
   scene level.

10. **extr-srv-transcription-s3-trigger** — Amazon Transcribe integration. S3
    trigger on transcription completion, maps subtitle segments to frame
    timestamps.

### Evaluation Service (5 functions)

LLM-driven analysis of extracted metadata:

- Create/delete/get evaluation tasks
- Bedrock Claude invocation with customizable prompts
- Template system for moderation, summarization, IAB classification

### CDK Infrastructure (deployment/)

Full CDK stack: VPC, OpenSearch, DynamoDB tables, Step Functions state machines,
API Gateway, Lambda layers, Cognito auth.

### Web UI (source/policy_eval_frontend/)

React frontend: video upload, extraction config, results viewer, evaluation
sandbox. Amplify-based auth.

## Knowledge Not Visible From Code Alone

1. **The two-step separation is the key architectural insight.** Extract once
   (expensive), analyze many times (cheap). The extraction outputs are
   service-agnostic JSON — any downstream consumer can use them.

2. **Smart sampling dramatically reduces cost.** The README claims 50% frame
   reduction with Titan multimodal embeddings. The FAISS alternative avoids
   OpenSearch dependency entirely.

3. **Multi-granularity output hierarchy:** Frames (individual images) → Shots
   (continuous camera sequences) → Scenes (narrative segments). Each level has
   its own summary, timestamps, and metadata.

4. **Configurable feature extraction** is the extensibility pattern. Each
   Rekognition/Bedrock feature is independently toggleable. Adding a new ML
   model = adding a new Lambda to the Step Functions iteration subflow.
