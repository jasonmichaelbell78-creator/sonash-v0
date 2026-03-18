---
name: feedback_stale_reviews_dist
description:
  SCHEMA_MAP test failures mean scripts/reviews/dist is stale — rebuild with
  reviews:generate
type: feedback
status: unverified
---

- If SCHEMA_MAP tests fail, it means scripts/reviews/dist/ is stale
- Fix: rebuild with `npm run reviews:generate`
- session-start hook does NOT build reviews/dist automatically
- **Why:** Stale dist files cause confusing test failures that look like code
  bugs.
- **Apply:** On SCHEMA_MAP test failure, run reviews:generate before debugging
  code.
