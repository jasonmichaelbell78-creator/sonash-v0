---
name: Never reject review items as pre-existing
description: Pre-existing is not a valid rejection reason in PR reviews — always present fix-or-DEBT options to the user
type: feedback
status: active
---

Never dismiss PR review items as "pre-existing." This applies regardless of how many codebase-wide instances exist.

**Why:** User corrected this twice (PR #427 R1 and R2). The pr-review skill Rule 6 explicitly bans it. "Too many to fix" is not a rejection — it's an effort estimation question for the user.

**How to apply:** When triaging a review item that exists beyond this PR's scope, present the user with: (a) Fix now + effort estimate, or (b) Create DEBT item. Never auto-dismiss based on origin or scale.
