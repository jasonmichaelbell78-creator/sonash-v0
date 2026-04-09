# graphify — Quick Scan Summary

**Repo:** [safishamsi/graphify](https://github.com/safishamsi/graphify)
**Scanned:** 2026-04-09 | **Depth:** Quick Scan | **Skill:** repo-analysis v4.3

## What It Is

An AI coding assistant skill that turns any folder of code, docs, papers, or
images into a queryable knowledge graph. Works across 6 platforms (Claude Code,
Codex, OpenCode, OpenClaw, Factory Droid, Trae). Uses a two-pass model:
deterministic AST extraction (20 languages via tree-sitter) + LLM semantic
inference via parallel subagents. Outputs interactive HTML graph, queryable
JSON, and a plain-language report.

## Lightweight Creator Lens

This repo understands the knowledge graph paradigm for codebase comprehension.
It pairs deterministic AST extraction with LLM-powered semantic inference,
Leiden community detection, and multi-modal ingestion (code, PDFs, images,
screenshots). It solves the same "understand code structure without reading
everything" problem that our repo-analysis addresses, but through graph topology
rather than dimensional scoring. The MCP server mode and always-on hook pattern
are directly relevant to JASON-OS knowledge layer work.

## Health Bands

| Dimension       | Band       | Score |
| --------------- | ---------- | ----- |
| Security        | Healthy    | 65    |
| Reliability     | Healthy    | 70    |
| Maintainability | Healthy    | 68    |
| Documentation   | Excellent  | 80    |
| Process         | Needs Work | 40    |
| Velocity        | Excellent  | 90    |

## Scoring

| Lens         | Band      | Score |
| ------------ | --------- | ----- |
| Quality      | Healthy   | 68    |
| Personal Fit | Excellent | 82    |

**Classification:** active-sprint **Verdict:** Extract (82)

## Key Findings

- **Explosive growth**: 15,252 stars in 6 days
- **Dual-pass extraction**: AST (deterministic) + LLM (semantic), with
  confidence tagging
- **Single contributor**: Bus factor of 1 despite 15K stars
- **Multi-platform**: 7 skill files for 6 AI coding assistants
- **MCP server**: Exposes graph as queryable MCP tools
- **No embeddings**: Leiden clustering uses graph topology, not vector
  similarity
- **Strong docs**: ARCHITECTURE.md, SECURITY.md, CHANGELOG.md, 4 README
  translations

## Absence Patterns

None detected — comprehensive for a 6-day-old repo.
