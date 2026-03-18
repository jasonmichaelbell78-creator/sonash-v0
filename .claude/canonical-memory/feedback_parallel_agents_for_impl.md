---
name: feedback_parallel_agents_for_impl
description:
  Use parallel agents with convergence loops for implementation — not
  single-threaded work that leads to implementation theater
type: feedback
status: active
---

- Parallel agents for implementation, not sequential single-thread
- Agent teams for skill changes
- Convergence loops to verify implementations actually work
- Testing implementations should also use parallel agents
- **Why:** Single-threaded implementation leads to "implementation theater" —
  changes that look done but are not functional. Parallel agents with CLs catch
  gaps.
- **Apply:** When executing retro action items or skill updates: design as
  parallelizable tasks, spawn implementation agents, spawn CL verification
  agents, cross-reference before marking done.
