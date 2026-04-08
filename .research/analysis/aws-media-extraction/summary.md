# AWS Media Extraction — Standard Analysis Summary

**Repo:**
aws-solutions-library-samples/guidance-for-media-extraction-and-dynamic-content-policy-framework-on-aws
**Scan:** Standard, 2026-04-07 **Verdict:** Extract (42/100) — patterns over
adoption

## Health Bands

| Dimension       | Band            |
| --------------- | --------------- |
| Security        | Healthy (65)    |
| Reliability     | Needs Work (45) |
| Maintainability | Needs Work (50) |
| Documentation   | Healthy (75)    |
| Process         | Critical (25)   |
| Velocity        | Critical (15)   |

## Key Findings

- **Two-step separation** (extract once, analyze many) is the core architectural
  insight
- **Frame → Shot → Scene hierarchy** with per-level summaries
- **Smart sampling** via multimodal embedding dedup (FAISS local + OpenSearch
  cloud)
- **Toggleable ML features** per frame (labels, text, celebrity, moderation,
  caption)
- **No tests, low velocity** — reference architecture, not production project
- **$0.28-0.35/min** cost at 1 FPS with all features

## Extraction Candidates

8 candidates: 3 T1 (architecture patterns), 2 T2 (implementation patterns), 1 T3
(template), 2 anti-patterns
