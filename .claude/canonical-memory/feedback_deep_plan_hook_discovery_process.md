---
name: Deep-plan discovery process for hook audits
description:
  5-layer multi-agent discovery for hook/infrastructure deep-plans — subsystem
  explorers, warning infra, skip reasons, ground-truth, execution verification
type: feedback
status: active
---

For deep-plans involving hooks, scripts, pipelines, or infrastructure, use
5-layer parallel discovery:

1. **Per-subsystem explorers** — one agent per subsystem tracing checks,
   scripts, exit codes, error handling
2. **Warning/logging infra** — traces write scripts, data stores, consumers,
   rotation, gaps
3. **Skip reasons + prior decisions** — override-log patterns, cross-ref
   SWS/audit decisions
4. **Ground-truth verifier** — referenced files exist, valid format, scripts
   registered, configs valid
5. **Execution verifier** — runs scripts, checks exit codes match docs, verifies
   write targets

**Why:** Code-reading alone misses ground-truth issues. Min 3 agents
(subsystem + ground-truth + execution). Add skip-reason agent when prior audits
exist. Update `/hook-ecosystem-audit` to use this as Phase 0.
