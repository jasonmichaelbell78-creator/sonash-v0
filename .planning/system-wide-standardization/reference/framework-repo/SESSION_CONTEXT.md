# Session Context

Last Updated: 2026-03-01

## Overview

This document tracks the current development session state, active work items,
recent decisions, and known issues for the framework project. It is
auto-populated by session hooks and manually updated as work progresses.

## AI Instructions

- Read this file at the start of each session to understand current context
- Update the "Active Work" and "Recent Decisions" sections as work progresses
- Do not modify the "Session ID" or "Started" fields; they are auto-populated

## Current Session

- **Session ID**: (auto-populated by session-start hook)
- **Started**: (auto-populated)
- **Branch**: feature/framework-skeleton
- **Focus**: Initial framework skeleton setup

## Active Work

- Porting dev workflow tooling from source repo
- Setting up quality gates and CI/CD
- Configuring Claude Code hooks, agents, and skills

## Recent Decisions

- All work on feature branch, not main
- Generic-first approach: port only non-project-specific tooling
- Sanitize all source-specific references during porting
- Dual-format ROADMAP (JSONL for AI, MD for human)

## Known Issues

- npm dependencies not yet installed (npm ci needed after initial commit)
- Some scripts reference other scripts that may not exist yet (ROADMAP deferred items)
- ESLint plugin needs testing after npm install

## Quick Reference

- **Pre-commit**: ESLint + tests (parallel), lint-staged, circular deps
- **Pre-push**: Circular deps, type check, security audit, code-reviewer gate
- **Skills**: 50+ in .claude/skills/ (invoke with /skill-name)
- **Agents**: 12 in .claude/agents/

## Version History

- 2026-03-01: Added Overview, AI Instructions, and Version History sections
- 2026-03-01: Initial session context created for framework skeleton setup
