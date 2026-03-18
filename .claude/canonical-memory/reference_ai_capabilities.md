---
name: reference_ai_capabilities
description:
  AI agent constraints — MCP servers, agent return protocol, compaction
  resilience, overflow prevention
type: reference
status: active
---

- MCP servers: memory, sonarcloud
- Explore agents are read-only (cannot write files)
- Agent return protocol: return ONLY completion summary, not full output
- Compaction resilience: 7-layer state persistence (commit-tracker,
  pre-compaction-save, compact-restore)
- Context overflow prevention: cap agent returns, wave chunking, check wc -l not
  content
- Pre-commit hook chain: see project_hook_contract_canon.md for details
