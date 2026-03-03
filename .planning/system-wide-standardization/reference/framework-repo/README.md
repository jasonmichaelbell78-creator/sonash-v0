# framework

**Last Updated:** 2026-03-01

## Overview

Reusable development workflow framework for building applications and websites. Provides standardized tooling, quality gates, and development practices that can be shared across projects.

## Features

- **Hook System** — Event-driven automation (SessionStart, PreToolUse, PostToolUse, PreCompact, UserPromptSubmit)
- **Skill System** — Reusable development workflows invoked via `/skill-name`
- **Agent System** — Specialized AI agents for code review, debugging, architecture, etc.
- **ESLint Plugin** — 23 custom rules for security, correctness, and style enforcement
- **TDMS** — Technical Debt Management System with JSONL-based tracking
- **CI/CD** — 9 GitHub Actions workflows with quality gates

## Quick Start

```bash
npm install
npm run lint
npm test
```

## Version History

| Version | Date       | Description                |
| ------- | ---------- | -------------------------- |
| 0.1.0   | 2026-03-01 | Initial framework skeleton |
