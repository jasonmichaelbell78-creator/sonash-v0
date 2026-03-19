---
name: feedback_stale_reviews_dist
description:
  SCHEMA_MAP test failures mean scripts/reviews/dist is stale — rebuild with tsc
  or reviews:generate
type: feedback
status: active
---

- If SCHEMA_MAP tests fail (e.g., expected 7 entries, got 5), dist/ is stale
- Fix: `cd scripts/reviews && npx tsc -p tsconfig.json` or
  `npm run reviews:generate`
- session-start hook does NOT auto-build scripts/reviews/dist
- **Why:** Stale dist files cause confusing test failures that look like code
  bugs.
- **Apply:** On SCHEMA_MAP test failure, run rebuild before debugging code.
