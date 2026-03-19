---
name: feedback_agent_teams_learnings
description:
  Agent teams operational learnings — Explore read-only, idle floods, token
  cost, team sizing, subagent rules
type: feedback
status: active
---

Agent Teams learnings from Session #225 (first real usage with 4-member
research-team):

1. **Explore agents are read-only.** Cannot write/edit files. Team lead must
   collect messages and write. Use `general-purpose` if teammates need write.
2. **Idle notification flood.** 50%+ of inbox messages are idle pings. Keep
   teams small (3-5 max).
3. **Token cost is 3-7x solo.** Each teammate gets own context window.
4. **5-6 tasks per teammate is optimal.** More causes context switching.
5. **Subagents vs Teams:** If agents need to talk during execution, use a team.
   Otherwise subagents (cheaper).
6. **One team per session.** No nested teams. Lead is fixed. No /resume for
   teams.

- **Why:** First-hand experience. These patterns prevent token waste and failed
  file writes.
- **Apply:** Before dispatching agents, verify tool access matches the task.
