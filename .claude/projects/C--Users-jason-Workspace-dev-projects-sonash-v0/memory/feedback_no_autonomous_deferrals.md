---
name: No autonomous deferrals
description:
  Never defer any work item, plan step, or task without explicit user decision —
  no exceptions
type: feedback
---

Never defer any work item, plan step, or task without explicit user approval.
Even if a plan document says "defer to next session" or a prior session left
something as "deferred," present it to the user for decision before treating it
as deferred.

**Why:** User corrected after Claude presented a plan step as "deferred" without
asking. Deferrals are user decisions, not Claude decisions. This also applies
to: DAS items that seem clear-cut, plan steps that seem low priority, and
session carryover items.

**How to apply:** Before marking anything as deferred, skipped, or "next
session," always present it with options and wait for the user's explicit
choice. This includes plan orchestration steps, pr-review items, and any other
work tracking.
