# Context Preservation Pattern

**Document Version:** 1.1 **Last Updated:** 2026-01-22

---

## Purpose

This document describes the Context Preservation Pattern for preventing loss of
important decisions, options, and user choices during Claude Code context
compaction. It provides guidelines for when and how to save decision context to
persistent storage, ensuring critical information survives across sessions.

**Target Audience:** AI assistants working in Claude Code sessions

**Scope:** Decision logging, context preservation strategies, and recovery
mechanisms

---

## AI Instructions

When presenting options or making decisions:

1. If presenting 3+ options to the user, prepare to save the decision
2. After the user makes their choice, save to `docs/SESSION_DECISIONS.md`
3. Include all context: what prompted the decision, all options, user choice,
   and rationale
4. Link to implementation (PR/commit/roadmap item)

Use this pattern for:

- Architectural decisions (tech stack, patterns, infrastructure)
- Feature design choices (behavior, scope, implementation approach)
- Process decisions (workflow, tooling, sprint planning)

Do NOT use for trivial choices (naming, formatting, minor tweaks).

---

## Quick Start

**For AI Assistants:**

1. Detect when presenting 3+ options → prepare to save decision
2. After user chooses → save to `docs/SESSION_DECISIONS.md` using format below
3. Update version history in that document

**For Developers:**

- Review `docs/SESSION_DECISIONS.md` for decision history
- Check `.claude/plans/` for detailed implementation plans
- Use `/checkpoint` to capture current session state

---

## Problem

Context compaction in Claude Code sessions can lose important information:

- **Decisions:** Architectural and feature choices made during sessions
- **Options:** Alternative approaches that were considered but not chosen
- **Rationale:** The "why" behind decisions
- **Implementation links:** Where decisions were applied

Without preservation, this context must be re-researched in future sessions,
wasting time and potentially leading to inconsistent decisions.

---

## Solution

Auto-save decisions to `docs/SESSION_DECISIONS.md` when:

- Presenting 3+ options to user
- User makes architectural/feature choices
- Discussing implementation approaches
- Any decision that would be painful to re-research

### Decision Format

```markdown
### [DATE] - [SHORT TITLE]

**Context:** What prompted this **Options:** Numbered list **User Choice:**
Selection **Implementation:** Link to PR/commit/roadmap
```

### Example

```markdown
### 2026-01-21 - Encryption Scope

**Context:** Determining encryption coverage for step work data **Options:**

1. Encryption for step work only
2. Maximum encryption everywhere possible
3. Minimal encryption for compliance

**User Choice:** Option 2 - Maximum encryption everywhere **Rationale:**
Privacy-first principle alignment **Implementation:** Documented in
docs/EXPANSION_EVALUATION_TRACKER.md
```

---

## Other Context Sources

Beyond `SESSION_DECISIONS.md`, use these mechanisms:

- **Full transcript:** `~/.claude/projects/.../[session-id].jsonl` (complete
  session history)
- **Plans:** `.claude/plans/` (detailed implementation plans)
- **Checkpoints:** `/checkpoint` command updates `SESSION_CONTEXT.md` (current
  state snapshot)
- **Pattern library:** `docs/patterns/` (canonical preserved patterns)
- **Serena memories (optional):** `.serena/memories/` (only if Serena MCP is
  enabled)

---

## Version History

| Version | Date       | Changes                                                               |
| ------- | ---------- | --------------------------------------------------------------------- |
| 1.1     | 2026-01-22 | Added Purpose, AI Instructions, Quick Start, Version History sections |
| 1.0     | 2026-01-17 | Initial pattern created after Firebase Console options loss           |
