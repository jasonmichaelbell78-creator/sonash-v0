---
name: feedback_agent_teams_learnings
description:
  Agent teams and Explore agent operational learnings — role separation,
  read-only constraints
type: feedback
status: unverified
---

- Explore agents are read-only — they cannot write, edit, or create files
- Agent teams need clear role separation — don't duplicate work across agents
- Background agents: check completion status, don't poll in sleep loops
- Return protocol: agents return summaries, not full output
- **Why:** Agent misuse wastes tokens and context. Explore agents silently fail
  writes.
- **Apply:** Before dispatching agents, verify tool access matches the task.
