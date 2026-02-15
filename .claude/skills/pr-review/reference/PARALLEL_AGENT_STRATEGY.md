<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Parallel Agent Strategy (Steps 4.3-4.5)

Detailed guidance for parallel agent execution when processing 20+ review items.

## 4.3 Parallel Agent Strategy (for 20+ items)

**Step 1: Group issues by concern area:**

```
Security Issues:      [1, 5, 12] -> security-auditor agent
Documentation Issues: [3, 8]     -> technical-writer agent
Script Files:         [2, 4, 6]  -> code-reviewer agent (scripts)
TypeScript Files:     [7, 9-11]  -> code-reviewer agent (TS/React)
```

**Step 2: Create parallel batches:**

- Batch by file type OR concern area (whichever produces fewer batches)
- Maximum 4 parallel agents at once (avoid context overload)
- Each agent gets specific file list + issue numbers

**Step 3: Launch agents in parallel:**

```
Use Task tool with MULTIPLE invocations in SINGLE message:

Agent 1: security-auditor
- Prompt: "Fix security issues [1, 5, 12] in files: check-external-links.js
  Issues: SSRF vulnerability, timeout validation, ..."

Agent 2: code-reviewer
- Prompt: "Fix code quality issues [2, 4, 6] in files: check-doc-placement.js
  Issues: Regex precedence, .planning exclusion, ..."

Agent 3: technical-writer
- Prompt: "Fix documentation issues [3, 8] in file: SKILL.md
  Issues: Shell redirection order, code fence syntax, ..."
```

**Step 4: Collect and verify results:**

- All agents return to orchestrator when complete
- Run verification: `npm run lint && npm run patterns:check`
- Check for any merge conflicts in overlapping files

## 4.4 Parallel Execution Benefits

| Metric     | Sequential        | Parallel (4 agents) |
| ---------- | ----------------- | ------------------- |
| Speed      | N issues x T time | ~N/4 x T time       |
| Accuracy   | Context fatigue   | Fresh context each  |
| Expertise  | Generalist        | Domain specialists  |
| Throughput | ~20 items/session | ~80+ items/session  |

## 4.5 When NOT to Parallelize

- Issues have dependencies (fix A before B)
- All issues in single file (one agent is sufficient)
- User requests sequential processing
- Critical security issues (need focused attention)

**Invoke using Task tool** with specific issues to address.
