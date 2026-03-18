---
name: feedback_execution_failure_recovery
description:
  Failure recovery discipline — stop-diagnose-confirm before retrying, no
  destructive shortcuts
type: feedback
status: active
---

- Don't retry failed approaches blindly — stop and diagnose root cause first
- Verify diagnosis before acting (convergence loop discipline)
- Don't use --no-verify or destructive shortcuts to bypass failures
- When blocked, consider alternative approaches before brute-forcing
- **Why:** Blind retries cascade — each shortcut compounds the next (Session
  #219 evidence).
- **Apply:** On first failure, pause. Diagnose root cause. Confirm diagnosis.
  Then fix. If blocked, ask user.
